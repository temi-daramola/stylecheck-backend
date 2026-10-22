"""Extract a resolved formatting profile from a .docx file and print it as JSON.

Usage: python extract_formatting.py <path-to-docx>

python-docx is used (instead of raw XML parsing) because Word resolves formatting through an
inheritance chain: run -> paragraph style -> base styles -> document defaults. A paragraph's
effective font size is often declared on a parent style, not on the paragraph itself.

Values that cannot be resolved are reported as null so the caller can tell the AI "unknown"
instead of letting it guess.
"""
import json
import re
import sys
from collections import Counter

from docx import Document
from docx.shared import Length
from docx.oxml.ns import qn

EMU_PER_CM = 360000
EMU_PER_PT = 12700
REFERENCE_HEADING = re.compile(r"^\s*(references?|bibliography)\s*$", re.IGNORECASE)
HEADING_STYLE = re.compile(r"^(heading|title)", re.IGNORECASE)
MIN_BODY_CHARS = 20  # ignore very short paragraphs (captions, page-number lines) when sampling the body
HANGING_TOLERANCE_EMU = 1000
MAX_HEADING_LEVELS = 3


def cm(value):
    return None if value is None else f"{round(Length(value).emu / EMU_PER_CM, 2)}cm"


def pt(value):
    return None if value is None else f"{round(Length(value).emu / EMU_PER_PT, 1)}pt"


def style_chain(style):
    while style is not None:
        yield style
        style = style.base_style


def doc_defaults(document):
    """Read w:docDefaults, which python-docx does not expose through its API."""
    defaults = {"font": None, "size": None, "line": None, "rule": None}
    root = document.styles.element
    rpr = root.find(qn("w:docDefaults") + "/" + qn("w:rPrDefault") + "/" + qn("w:rPr"))
    if rpr is not None:
        fonts = rpr.find(qn("w:rFonts"))
        if fonts is not None:
            defaults["font"] = fonts.get(qn("w:ascii")) or fonts.get(qn("w:hAnsi"))
        size = rpr.find(qn("w:sz"))
        if size is not None:
            defaults["size"] = int(size.get(qn("w:val"))) / 2  # half-points -> points
    ppr = root.find(qn("w:docDefaults") + "/" + qn("w:pPrDefault") + "/" + qn("w:pPr"))
    if ppr is not None:
        spacing = ppr.find(qn("w:spacing"))
        if spacing is not None and spacing.get(qn("w:line")):
            defaults["line"] = int(spacing.get(qn("w:line")))
            defaults["rule"] = spacing.get(qn("w:lineRule")) or "auto"
    return defaults


def run_font_name(run, paragraph, defaults):
    if run.font.name:
        return run.font.name
    for style in style_chain(paragraph.style):
        if style.font is not None and style.font.name:
            return style.font.name
    return defaults["font"]


def run_font_size(run, paragraph, defaults):
    if run.font.size:
        return round(run.font.size.pt, 1)
    for style in style_chain(paragraph.style):
        if style.font is not None and style.font.size:
            return round(style.font.size.pt, 1)
    return defaults["size"]


def paragraph_line_spacing(paragraph, defaults):
    """Return a label such as 'single', 'double', '1.5', or 'exactly 24.0pt'; None if unresolved."""
    fmt = paragraph.paragraph_format
    value, rule = fmt.line_spacing, fmt.line_spacing_rule
    if value is None:
        for style in style_chain(paragraph.style):
            if style.paragraph_format.line_spacing is not None:
                value = style.paragraph_format.line_spacing
                rule = style.paragraph_format.line_spacing_rule
                break
    if value is None and defaults["line"] is not None:
        if defaults["rule"] == "auto":
            value = defaults["line"] / 240
        else:
            value, rule = Length(int(defaults["line"] * 635)), defaults["rule"]
    if value is None:
        return None
    if isinstance(value, Length):
        return f"exactly {round(value.pt, 1)}pt"
    value = round(float(value), 2)
    return {1.0: "single", 2.0: "double"}.get(value, str(value))


def paragraph_indent(paragraph, attribute):
    for style in [None, *style_chain(paragraph.style)]:
        source = paragraph.paragraph_format if style is None else style.paragraph_format
        value = getattr(source, attribute)
        if value is not None:
            return value
    return None


def dominant(counter):
    """Most common value, weighted by character count; None if nothing was sampled."""
    counter.pop(None, None)
    return counter.most_common(1)[0][0] if counter else None


def is_heading(paragraph):
    return bool(HEADING_STYLE.match(paragraph.style.name or ""))


def extract(path):
    document = Document(path)
    defaults = doc_defaults(document)
    unresolved = []

    section = document.sections[0]
    margins = {
        "top": cm(section.top_margin),
        "bottom": cm(section.bottom_margin),
        "left": cm(section.left_margin),
        "right": cm(section.right_margin),
    }
    margins_vary = any(
        (s.top_margin, s.bottom_margin, s.left_margin, s.right_margin)
        != (section.top_margin, section.bottom_margin, section.left_margin, section.right_margin)
        for s in document.sections[1:]
    )

    fonts, sizes, spacings, first_indents, left_indents = Counter(), Counter(), Counter(), Counter(), Counter()
    headings = {}
    reference_entries, hanging_entries, in_references = 0, 0, False

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        if not text:
            continue

        if REFERENCE_HEADING.match(text):
            in_references = True
            continue

        if is_heading(paragraph):
            level = re.search(r"\d+", paragraph.style.name or "")
            key = paragraph.style.name
            if key not in headings and len(headings) < MAX_HEADING_LEVELS * 2 and paragraph.runs:
                run = paragraph.runs[0]
                headings[key] = {
                    "font": run_font_name(run, paragraph, defaults),
                    "size": f"{run_font_size(run, paragraph, defaults)}pt" if run_font_size(run, paragraph, defaults) else None,
                    "bold": bool(run.bold if run.bold is not None else (paragraph.style.font.bold if paragraph.style.font else False)),
                    "alignment": str(paragraph.alignment or paragraph.style.paragraph_format.alignment or "LEFT").split(".")[-1].split(" ")[0],
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

    body_font, body_size, line_spacing = dominant(fonts), dominant(sizes), dominant(spacings)
    for name, value in (("bodyFont", body_font), ("bodyFontSize", body_size), ("lineSpacing", line_spacing)):
        if value is None:
            unresolved.append(name)

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
        "unresolved": unresolved,
    }


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.stderr.write("Usage: extract_formatting.py <path-to-docx>\n")
        sys.exit(2)
    try:
        sys.stdout.write(json.dumps(extract(sys.argv[1])))
    except Exception as error:  # surfaced to the caller as a processing failure
        sys.stderr.write(f"{type(error).__name__}: {error}\n")
        sys.exit(1)
