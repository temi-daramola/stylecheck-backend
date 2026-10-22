import PDFDocument from 'pdfkit';
import { PdfConstants } from '@adapters/pdf/pdf.constants.js';

const { PAGE_MARGIN, FONT, SIZE, COLORS, COLUMNS, LABELS, BAND_COLORS } = PdfConstants;

const ROW_PADDING = 6;

const collect = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

const contentWidth = (doc) => doc.page.width - PAGE_MARGIN * 2;

const drawHeader = (doc, { institutionName, studentName, chapterSection, checkDate, score, band, passed, failed }) => {
  doc.font(FONT.BOLD).fontSize(SIZE.TITLE).fillColor(COLORS.NAVY).text(LABELS.PRODUCT);
  doc.font(FONT.REGULAR).fontSize(SIZE.SUBTITLE).fillColor(COLORS.MUTED).text(institutionName);
  doc.moveDown(0.6);
  doc.font(FONT.BOLD).fontSize(SIZE.SUBTITLE + 3).fillColor(COLORS.NAVY).text(LABELS.REPORT_TITLE);
  doc.moveDown(0.5);

  [
    [LABELS.STUDENT, studentName],
    [LABELS.CHAPTER, chapterSection],
    [LABELS.DATE, checkDate],
  ].forEach(([label, value]) => {
    doc.font(FONT.BOLD).fontSize(SIZE.BODY).fillColor(COLORS.MUTED).text(`${label}: `, { continued: true });
    doc.font(FONT.REGULAR).fillColor(COLORS.BODY).text(value);
  });

  doc.moveDown(0.8);
  const bandColor = BAND_COLORS[band] || COLORS.BODY;
  // Score and "/ 100" share a baseline, so they are placed at explicit coordinates instead of
  // using `continued` text (which keeps the larger font's line height and overlaps what follows).
  const scoreY = doc.y;
  const scoreText = String(score);
  doc.font(FONT.BOLD).fontSize(SIZE.SCORE).fillColor(bandColor);
  const scoreWidth = doc.widthOfString(scoreText);
  doc.text(scoreText, PAGE_MARGIN, scoreY, { lineBreak: false });
  doc.font(FONT.REGULAR).fontSize(SIZE.SUBTITLE).fillColor(COLORS.MUTED)
    .text(LABELS.SCORE_SUFFIX, PAGE_MARGIN + scoreWidth + 6, scoreY + SIZE.SCORE - SIZE.SUBTITLE - 4, { lineBreak: false });
  doc.y = scoreY + SIZE.SCORE + 8;
  doc.font(FONT.BOLD).fontSize(SIZE.SUBTITLE + 1).fillColor(bandColor).text(band, PAGE_MARGIN, doc.y);
  doc.font(FONT.REGULAR).fontSize(SIZE.BODY).fillColor(COLORS.MUTED).text(LABELS.SUMMARY(passed, failed), PAGE_MARGIN);
  doc.moveDown(1);
};

const columnLayout = (doc) => {
  const width = contentWidth(doc);
  const rule = width * COLUMNS.RULE;
  const status = width * COLUMNS.STATUS;
  const reasoning = width * COLUMNS.REASONING;
  return {
    rule: { x: PAGE_MARGIN, width: rule },
    status: { x: PAGE_MARGIN + rule, width: status },
    reasoning: { x: PAGE_MARGIN + rule + status, width: reasoning },
  };
};

const ensureRoom = (doc, height) => {
  if (doc.y + height > doc.page.height - PAGE_MARGIN - 20) {
    doc.addPage();
  }
};

const drawTableHeader = (doc, columns) => {
  const y = doc.y;
  doc.font(FONT.BOLD).fontSize(SIZE.BODY).fillColor(COLORS.NAVY);
  doc.text(LABELS.HEADER_RULE, columns.rule.x, y, { width: columns.rule.width });
  doc.text(LABELS.HEADER_STATUS, columns.status.x, y, { width: columns.status.width });
  doc.text(LABELS.HEADER_REASONING, columns.reasoning.x, y, { width: columns.reasoning.width });
  doc.moveTo(PAGE_MARGIN, doc.y + 2).lineTo(PAGE_MARGIN + contentWidth(doc), doc.y + 2)
    .strokeColor(COLORS.NAVY).stroke();
  doc.y += ROW_PADDING;
};

const drawRows = (doc, rules) => {
  const columns = columnLayout(doc);
  drawTableHeader(doc, columns);

  rules.forEach(({ ruleName, status, reasoning }) => {
    doc.font(FONT.REGULAR).fontSize(SIZE.BODY);
    const text = reasoning || '';
    const height = Math.max(
      doc.heightOfString(ruleName, { width: columns.rule.width }),
      doc.heightOfString(text, { width: columns.reasoning.width })
    );
    ensureRoom(doc, height + ROW_PADDING * 2);

    const y = doc.y;
    doc.fillColor(COLORS.BODY).text(ruleName, columns.rule.x, y, { width: columns.rule.width });
    doc.font(FONT.BOLD).fillColor(status === 'Passed' ? COLORS.PASSED : COLORS.FAILED)
      .text(status, columns.status.x, y, { width: columns.status.width });
    doc.font(FONT.REGULAR).fillColor(COLORS.BODY)
      .text(text, columns.reasoning.x, y, { width: columns.reasoning.width });

    doc.y = y + height + ROW_PADDING;
    doc.moveTo(PAGE_MARGIN, doc.y - 2).lineTo(PAGE_MARGIN + contentWidth(doc), doc.y - 2)
      .strokeColor(COLORS.BORDER).stroke();
  });
};

const drawFooters = (doc) => {
  const { count, start } = doc.bufferedPageRange();
  for (let index = start; index < start + count; index += 1) {
    doc.switchToPage(index);
    // Writing inside the bottom margin makes pdfkit add a new page, so drop the margin for the footer only.
    doc.page.margins.bottom = 0;
    doc.font(FONT.REGULAR).fontSize(SIZE.SMALL).fillColor(COLORS.MUTED).text(
      LABELS.FOOTER,
      PAGE_MARGIN,
      doc.page.height - PAGE_MARGIN + 10,
      { width: contentWidth(doc), align: 'center', lineBreak: false }
    );
  }
};

export const pdfAdapter = Object.freeze({
  /** Renders the compliance report to an in-memory PDF buffer. Nothing is written to disk. */
  renderComplianceReport: async (report) => {
    const doc = new PDFDocument({
      size: PdfConstants.PAGE_SIZE,
      margin: PAGE_MARGIN,
      bufferPages: true,
    });
    const done = collect(doc);

    drawHeader(doc, report);
    drawRows(doc, report.rules);
    drawFooters(doc);

    doc.end();
    return done;
  },
});
