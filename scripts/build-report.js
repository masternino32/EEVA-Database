// Build an Emotional Evaluation report (.docx) from a JSON content file.
//
// Usage: node scripts/build-report.js <content.json> <output.docx>
//
// Content file shape (see scripts/report-content.example.json):
// {
//   "client": "Full Name",
//   "subtitle": ["Proposed residential care | 10-23 January 2027", "New Paradigm Mental Health Retreat, Chiang Mai, Thailand"],
//   "preparedBy": "Prepared by Dirk J. Lambert, Trauma/EMDR Specialist",
//   "intro": "Opening paragraph addressed to the client.",
//   "scores": { "rows": [["Despair", 4], ["Fear", 2]], "total": 15 },
//   "sections": [
//     { "heading": "Emotional Load Score",
//       "blocks": ["paragraph text", { "type": "scores" }, { "type": "phase", "label": "Days 1-3", "text": "..." }] }
//   ],
//   "clientInfo": [["Name", "Full Name"], ["Age", "54"]]
// }
// Blocks are plain strings (paragraphs) or objects: {type:"scores"} inserts the category table,
// Paragraph strings may mark bold passages with **double asterisks**.
// {type:"phase", label, text} renders a bold label followed by text on one paragraph,
// {type:"table", columns:[...], widths:[...], rows:[[...]]} renders a general table (widths in DXA, total at most 9600),
// {type:"bullets", items:[...]} renders a bulleted list,
// {type:"scorechart", points:[{label, score}], ideal:15} renders a horizontal bar chart of emotional load (score out of 45
// as a percentage), newest first, with the first point highlighted as the latest and a dashed line at the ideal percentage.
// Optional "title" replaces the default document title (used for progress reports).
// A section may set "pageBreakBefore": true to start on a new page.
// The Client Information section is always rendered last, on its own page,
// unless "clientInfoPageBreak": false is set (used for compact summaries).
// Optional "compact": true uses smaller type, tighter spacing and narrower margins, and lets tables split across pages.

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, Header, Footer, PageNumber, ShadingType, BorderStyle,
} = require("docx");

const [contentPath, outPath] = process.argv.slice(2);
if (!contentPath || !outPath) {
  console.error("Usage: node scripts/build-report.js <content.json> <output.docx>");
  process.exit(1);
}
const spec = JSON.parse(fs.readFileSync(contentPath, "utf8"));

const EM_DASH = "—";
const allText = JSON.stringify(spec);
if (allText.includes(EM_DASH)) {
  console.error("Content contains an em dash character, which the house style forbids. Replace it and rebuild.");
  process.exit(1);
}

const FONT = "Calibri";
const CLIENT = spec.client;
const C = !!spec.compact;
// Optional "labels" translate the fixed texts, e.g. for a report in Dutch:
// { scoreCategory, scoreValue, total, clientInfo, confidential, footer, latest, ideal }.
const L = Object.assign({
  scoreCategory: "Emotional category", scoreValue: "Reported score", total: "Total",
  clientInfo: "Client Information", confidential: "Confidential",
  footer: "New Paradigm Mental Health Retreat | Prepared by Dirk J. Lambert, Trauma/EMDR Specialist",
  latest: "latest", ideal: "ideal",
}, spec.labels || {});
// Sizes in half-points and spacing in twentieths of a point; the compact values apply to two-page summaries.
const SZ = { body: C ? 19 : 22, cell: C ? 18 : 21, heading: C ? 22 : 26, title: C ? 28 : 36, client: C ? 24 : 28 };
const SP = { after: C ? 100 : 200, line: C ? 250 : 300, cellPad: C ? 40 : 80, margin: C ? 900 : 1300 };
SP.marginTop = SP.margin; SP.marginBottom = C ? 900 : 1200;
// Optional "layout": { after, line, marginTop, marginBottom } fine-tunes paragraph spacing and the
// top/bottom page margins (more room below the header and above the footer), e.g. to spread a compact report.
Object.assign(SP, spec.layout || {});

// Paragraph text may mark bold passages with **double asterisks**.
const p = (text, opts = {}) => new Paragraph({
  spacing: { after: SP.after, line: SP.line },
  // split with a capture group puts the bold passages at the odd indexes.
  children: String(text).split(/\*\*(.+?)\*\*/)
    .map((part, i) => ({ part, bold: !!opts.bold || i % 2 === 1 }))
    .filter(({ part }) => part !== "")
    .map(({ part, bold }) => new TextRun({ text: part, font: FONT, size: opts.size || SZ.body, bold, color: opts.color || "222222" })),
});
// The page break is a property of the heading, so a full preceding page never leaves a blank page behind.
const h = (text, pageBreakBefore = false) => new Paragraph({
  spacing: { before: C ? 160 : 240, after: C ? 80 : 160 },
  keepNext: true,
  pageBreakBefore,
  children: [new TextRun({ text, font: FONT, size: SZ.heading, bold: true, color: "1F3A5F" })],
});
const labelled = (label, text, after) => new Paragraph({
  spacing: { after: C ? Math.min(after, 80) : after, line: SP.line },
  children: [
    new TextRun({ text: label + ": ", font: FONT, size: SZ.body, bold: true, color: "222222" }),
    new TextRun({ text, font: FONT, size: SZ.body, color: "222222" }),
  ],
});

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (text, w, bold = false, shade = null, keepNext = false) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  borders,
  shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: "auto" } : undefined,
  margins: { top: SP.cellPad, bottom: SP.cellPad, left: 120, right: 120 },
  children: [new Paragraph({ spacing: { after: 0 }, keepNext, children: [new TextRun({ text: String(text), font: FONT, size: SZ.cell, bold, color: "222222" })] })],
});
const scoresTable = () => new Table({
  width: { size: 6000, type: WidthType.DXA },
  columnWidths: [4200, 1800],
  rows: [
    new TableRow({ tableHeader: true, children: [cell(L.scoreCategory, 4200, true, "E8EEF5"), cell(L.scoreValue, 1800, true, "E8EEF5")] }),
    ...spec.scores.rows.map(([name, n]) => new TableRow({ children: [cell(name, 4200), cell(n, 1800)] })),
    new TableRow({ children: [cell(L.total, 4200, true, "F3F3F3"), cell(spec.scores.total, 1800, true, "F3F3F3")] }),
  ],
});
const spacer = () => new Paragraph({ spacing: { after: C ? 60 : 120 }, children: [] });
const genericTable = ({ columns, widths, rows }) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: widths,
  rows: [
    new TableRow({ tableHeader: true, children: columns.map((c, i) => cell(c, widths[i], true, "E8EEF5", true)) }),
    // Short tables (up to 12 rows) are kept on one page, except in compact mode.
    ...rows.map((r, n) => new TableRow({ cantSplit: true, children: r.map((v, i) => cell(v, widths[i], false, null, !C && rows.length <= 12 && n < rows.length - 1)) })),
  ],
});

// Bar chart built from table cells, so it renders the same in Word and LibreOffice without an image.
// The plot area is a grid of 100 one-percent columns between a label column and a value column.
const scoreChart = ({ points, ideal = 15 }) => {
  const LABEL_W = 2100, UNIT = 56, VALUE_W = 1500;
  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const gap = { style: BorderStyle.SINGLE, size: 18, color: "FFFFFF" };
  const idealLine = { style: BorderStyle.DASHED, size: 8, color: "8A8A8A" };
  const textCell = (text, w, opts = {}) => new TableCell({
    width: { size: w, type: WidthType.DXA },
    borders: { top: none, bottom: none, left: none, right: none },
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
    columnSpan: opts.span,
    children: [new Paragraph({ spacing: { after: 0 }, alignment: opts.align, children: [
      new TextRun({ text, font: FONT, size: opts.size || 19, bold: !!opts.bold, color: opts.color || "222222" }),
    ] })],
  });
  const segment = (from, to, fill) => new TableCell({
    width: { size: (to - from) * UNIT, type: WidthType.DXA },
    columnSpan: to - from,
    borders: { top: gap, bottom: gap, left: from === ideal ? idealLine : none, right: none },
    shading: fill ? { type: ShadingType.CLEAR, fill, color: "auto" } : undefined,
    children: [new Paragraph({ spacing: { after: 0 }, children: [] })],
  });
  const rows = points.map(({ label, score }, i) => {
    const latest = i === 0;
    const pct = Math.max(0, Math.min(100, Math.round((score / 45) * 100)));
    const fill = latest ? "1F3A5F" : "6F8BAE";
    const stops = [...new Set([0, Math.min(pct, ideal), ideal, Math.max(pct, ideal), 100])].sort((a, b) => a - b);
    const cells = [];
    for (let k = 0; k < stops.length - 1; k++) cells.push(segment(stops[k], stops[k + 1], stops[k + 1] <= pct ? fill : null));
    return new TableRow({ cantSplit: true, height: { value: 400, rule: "atLeast" }, children: [
      textCell(label + (latest ? ` (${L.latest})` : ""), LABEL_W, { bold: latest }),
      ...cells,
      textCell(`${pct}% (${score}/45)`, VALUE_W, { bold: latest }),
    ] });
  });
  const axis = (from, to, text, align) => textCell(text, (to - from) * UNIT, { span: to - from, size: 16, color: "666666", align });
  rows.push(new TableRow({ children: [
    textCell("", LABEL_W), axis(0, ideal, "0%"), axis(ideal, 50, `${ideal}% ${L.ideal}`), axis(50, 75, "50%"),
    axis(75, 100, "100%", AlignmentType.RIGHT), textCell("", VALUE_W),
  ] }));
  return new Table({
    width: { size: LABEL_W + 100 * UNIT + VALUE_W, type: WidthType.DXA },
    columnWidths: [LABEL_W, ...Array(100).fill(UNIT), VALUE_W],
    borders: { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none },
    rows,
  });
};
const bullet = (text, last) => new Paragraph({
  bullet: { level: 0 },
  spacing: { after: last ? 200 : 80, line: 300 },
  children: [new TextRun({ text, font: FONT, size: 22, color: "222222" })],
});

const TITLE = spec.title || "Emotional Evaluation and Treatment Plan";
const children = [
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: TITLE, font: FONT, size: SZ.title, bold: true, color: "1F3A5F" })] }),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: CLIENT, font: FONT, size: SZ.client, bold: true, color: "222222" })] }),
  ...(spec.subtitle || []).map((s) => p(s, { color: "444444" })),
  p(spec.preparedBy || "Prepared by Dirk J. Lambert, Trauma/EMDR Specialist", { color: "444444" }),
  p(spec.intro),
];

for (const section of spec.sections) {
  children.push(h(section.heading, !!section.pageBreakBefore));
  for (const block of section.blocks) {
    if (typeof block === "string") children.push(p(block));
    else if (block.type === "scores") { children.push(scoresTable()); children.push(spacer()); }
    else if (block.type === "phase") children.push(labelled(block.label, block.text, 200));
    else if (block.type === "table") { children.push(genericTable(block)); children.push(spacer()); }
    else if (block.type === "scorechart") { children.push(scoreChart(block)); children.push(spacer()); }
    else if (block.type === "bullets") block.items.forEach((item, i) => children.push(bullet(item, i === block.items.length - 1)));
    else throw new Error(`Unknown block type: ${JSON.stringify(block)}`);
  }
}

// Leave "clientInfo" out (or empty) to omit the Client Information section, e.g. in mid-term evaluations for the client.
if (spec.clientInfo && spec.clientInfo.length) {
  children.push(h(L.clientInfo, spec.clientInfoPageBreak !== false));
  for (const [label, text] of spec.clientInfo) children.push(labelled(label, text, 120));
}

const doc = new Document({
  creator: "Dirk J. Lambert",
  title: TITLE + " - " + CLIENT,
  styles: { default: { document: { run: { font: FONT, size: SZ.body } } } },
  sections: [{
    properties: { page: { margin: { top: SP.marginTop, bottom: SP.marginBottom, left: SP.margin, right: SP.margin } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      new TextRun({ text: L.confidential + " | " + CLIENT + " | ", font: FONT, size: 18, color: "777777" }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "777777" }),
    ] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: L.footer, font: FONT, size: 16, color: "777777" }),
    ] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("written", outPath, buf.length, "bytes");
});
