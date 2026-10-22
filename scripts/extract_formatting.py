"""Extract a resolved formatting profile from a .docx file and print it as JSON.

Usage: python extract_formatting.py <path-to-docx>

python-docx is used (instead of raw XML parsing) because Word resolves formatting through an
inheritance chain: run -> paragraph style -> base styles -> document defaults. A paragraph's
effective font size is often declared on a parent style, not on the paragraph itself.

Values that cannot be resolved are reported as null so the caller can tell the AI "unknown"
instead of letting it guess. Real-world files are messy (no section settings, no default
style, odd paragraphs), so extraction is best-effort: one odd paragraph is skipped and counted,
it never fails the whole document.

Exit codes: 0 ok, 3 the file is not a readable .docx package, 1 unexpected failure (our bug).
"""
import json
import re
import sys
import zipfile
from collections import Counter

from docx import Document
from docx.opc.exceptions import PackageNotFoundError
from docx.shared import Length
from docx.oxml.ns import qn

EMU_PER_CM = 360000
EMU_PER_PT = 12700
REFERENCE_HEADING = re.compile(r"^\s*(references?|bibliography)\s*$", re.IGNORECASE)
HEADING_STYLE = re.compile(r"^(heading|title)", re.IGNORECASE)
MIN_BODY_CHARS = 20  # ignore very short paragraphs (captions, page-number lines) when sampling the body
HANGING_TOLERANCE_EMU = 1000
MAX_HEADING_STYLES = 6
EXIT_NOT_A_DOCX = 3


def cm(value):
    return None if value is None else f"{round(Length(value).emu / EMU_PER_CM, 2)}cm"


def style_chain(style):
    seen = 0
    while style is not None and seen < 50:  # bounded: a malformed file can contain a style loop
        yield style
        style = style.base_style
        seen += 1


def style_of(paragraph):
    """The paragraph's style, or None when the document has no usable default style."""
    try:
        return paragraph.style
    except Exception:
        return None


def style_name(paragraph):
    style = style_of(paragraph)
    return (style.name or "") if style is not None else ""


THEME_NS = "{http://schemas.openxmlformats.org/drawingml/2006/main}"


def theme_fonts(document):
    """The theme's heading ('major') and body ('minor') fonts, for text that says 'use the theme font'."""
    themes = {"major": None, "minor": None}
    try:
        for part in document.part.package.iter_parts():
            if str(part.partname).endswith("theme/theme1.xml"):
                from lxml import etree

                root = etree.fromstring(part.blob)
                for key, tag in (("major", "majorFont"), ("minor", "minorFont")):
                    latin = root.find(f".//{THEME_NS}{tag}/{THEME_NS}latin")
                    if latin is not None:
                        themes[key] = latin.get("typeface")
                break
    except Exception:
        pass
    return themes


def font_from_rpr(rpr, themes):
    """An explicit font name, or the theme font it points at, from a run-properties element."""
    if rpr is None:
        return None
    fonts = rpr.find(qn("w:rFonts"))
    if fonts is None:
        return None
    name = fonts.get(qn("w:ascii")) or fonts.get(qn("w:hAnsi"))
    if name:
        return name
    theme = fonts.get(qn("w:asciiTheme")) or fonts.get(qn("w:hAnsiTheme"))
    if theme:
        return themes.get("major" if theme.startswith("major") else "minor")
    return None


def doc_defaults(document):
    """Read w:docDefaults, which python-docx does not expose through its API."""
    themes = theme_fonts(document)
    defaults = {"font": None, "size": None, "line": None, "rule": None, "themes": themes}
    try:
        root = document.styles.element
    except Exception:
        return defaults
    rpr = root.find(qn("w:docDefaults") + "/" + qn("w:rPrDefault") + "/" + qn("w:rPr"))
    if rpr is not None:
        defaults["font"] = font_from_rpr(rpr, themes)
        size = rpr.find(qn("w:sz"))
        if size is not None and size.get(qn("w:val")):
            defaults["size"] = int(size.get(qn("w:val"))) / 2  # half-points -> points
    ppr = root.find(qn("w:docDefaults") + "/" + qn("w:pPrDefault") + "/" + qn("w:pPr"))
    if ppr is not None:
        spacing = ppr.find(qn("w:spacing"))
        if spacing is not None and spacing.get(qn("w:line")):
            defaults["line"] = int(spacing.get(qn("w:line")))
            defaults["rule"] = spacing.get(qn("w:lineRule")) or "auto"
    return defaults


def run_font_name(run, paragraph, defaults):
    """Nearest definition wins: the run, then the style chain, then the document defaults (each may use a theme font)."""
    themes = defaults["themes"]
    name = font_from_rpr(run._r.rPr, themes)
    if name:
        return name
    for style in style_chain(style_of(paragraph)):
        name = font_from_rpr(style.element.rPr, themes)
        if name:
            return name
    return defaults["font"]


def run_font_size(run, paragraph, defaults):
    if run.font.size:
        return round(run.font.size.pt, 1)
    for style in style_chain(style_of(paragraph)):
        if style.font is not None and style.font.size:
            return round(style.font.size.pt, 1)
    return defaults["size"]


def paragraph_line_spacing(paragraph, defaults):
    """Return a label such as 'single', 'double', '1.5', or 'exactly 24.0pt'; None if unresolved."""
    fmt = paragraph.paragraph_format
    value = fmt.line_spacing
    if value is None:
        for style in style_chain(style_of(paragraph)):
            if style.paragraph_format.line_spacing is not None:
                value = style.paragraph_format.line_spacing
                break
    if value is None and defaults["line"] is not None:
        if defaults["rule"] == "auto":
            value = defaults["line"] / 240
        else:
            value = Length(int(defaults["line"] * 635))
    if value is None:
        return None
    if isinstance(value, Length):
        return f"exactly {round(value.pt, 1)}pt"
    value = round(float(value), 2)
    return {1.0: "single", 2.0: "double"}.get(value, str(value))


def paragraph_indent(paragraph, attribute):
    value = getattr(paragraph.paragraph_format, attribute)
    if value is not None:
        return value
    for style in style_chain(style_of(paragraph)):
        value = getattr(style.paragraph_format, attribute)
        if value is not None:
            return value
    return None


def dominant(counter):
    """Most common value, weighted by character count; None if nothing was sampled."""
    counter.pop(None, None)
    return counter.most_common(1)[0][0] if counter else None


def page_margins(document, unresolved):
    sections = list(document.sections)
    if not sections:
        unresolved.append("pageMargins")
        return {"top": None, "bottom": None, "left": None, "right": None}, False
    first = sections[0]
    margins = {
        "top": cm(first.top_margin),
        "bottom": cm(first.bottom_margin),
        "left": cm(first.left_margin),
        "right": cm(first.right_margin),
    }
    if any(value is None for value in margins.values()):
        unresolved.append("pageMargins")
    signature = lambda s: (s.top_margin, s.bottom_margin, s.left_margin, s.right_margin)
    return margins, any(signature(s) != signature(first) for s in sections[1:])


def extract(path):
    document = Document(path)
    defaults = doc_defaults(document)
    unresolved = []
    skipped = 0

    margins, margins_vary = page_margins(document, unresolved)

    fonts, sizes, spacings, first_indents, left_indents = Counter(), Counter(), Counter(), Counter(), Counter()
    headings = {}
    reference_entries, hanging_entries, in_references = 0, 0, False

    for paragraph in document.paragraphs:
        try:
            text = paragraph.text.strip()
            if not text:
                continue

            if REFERENCE_HEADING.match(text):
                in_references = True
                continue

            name = style_name(paragraph)
            if HEADING_STYLE.match(name):
                if name not in headings and len(headings) < MAX_HEADING_STYLES and paragraph.runs:
                    run = paragraph.runs[0]
                    size = run_font_size(run, paragraph, defaults)
                    style = style_of(paragraph)
                    style_bold = style.font.bold if style is not None and style.font is not None else None
                    headings[name] = {
                        "font": run_font_name(run, paragraph, defaults),
                        "size": f"{size}pt" if size else None,
                        "bold": bool(run.bold if run.bold is not None else style_bold),
                        "alignment": str(paragraph.alignment or "LEFT").split(".")[-1].split(" ")[0],
                    }
                continue

            if in_references:
                reference_entries += 1
                first = paragraph_indent(paragraph, "first_line_indent")
                if first is not None and first < -HANGING_TOLERANCE_EMU:
                    hanging_entries += 1

            if len(text) < MIN_BODY_CHARS:
                continue

            weight = len(text)
            for run in paragraph.runs:
                if not run.text.strip():
                    continue
                fonts[run_font_name(run, paragraph, defaults)] += len(run.text)
                sizes[run_font_size(run, paragraph, defaults)] += len(run.text)
            spacings[paragraph_line_spacing(paragraph, defaults)] += weight
            first = paragraph_indent(paragraph, "first_line_indent")
            left = paragraph_indent(paragraph, "left_indent")
            first_indents[cm(first) if first is not None else "0cm"] += weight
            left_indents[cm(left) if left is not None else "0cm"] += weight
        except Exception:
            skipped += 1  # one odd paragraph must not fail the whole document

    body_font, body_size, line_spacing = dominant(fonts), dominant(sizes), dominant(spacings)
    for label, value in (("bodyFont", body_font), ("bodyFontSize", body_size), ("lineSpacing", line_spacing)):
        if value is None:
            unresolved.append(label)

    return {
        "pageMargins": margins,
        "marginsVaryAcrossSections": margins_vary,
        "bodyFont": body_font,
        "bodyFontSize": None if body_size is None else f"{body_size}pt",
        "lineSpacing": line_spacing,
        "paragraphFirstLineIndent": dominant(first_indents),
        "paragraphLeftIndent": dominant(left_indents),
        "headings": headings,
        "referenceList": {
            "found": reference_entries > 0,
            "entries": reference_entries,
            "entriesWithHangingIndent": hanging_entries,
        },
        "skippedParagraphs": skipped,
        "unresolved": unresolved,
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.stderr.write("Usage: extract_formatting.py <path-to-docx>\n")
        sys.exit(2)
    try:
        sys.stdout.write(json.dumps(extract(sys.argv[1])))
    except (PackageNotFoundError, zipfile.BadZipFile, KeyError) as error:
        # Not a readable .docx package (wrong format, corrupt, or empty): the file is the problem.
        sys.stderr.write(f"NotADocx: {type(error).__name__}: {error}\n")
        sys.exit(EXIT_NOT_A_DOCX)
    except Exception as error:  # anything else is OUR bug, reported as such
        sys.stderr.write(f"{type(error).__name__}: {error}\n")
        sys.exit(1)
