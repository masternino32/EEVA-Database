// Build an Emotional Evaluation report (.docx) from a JSON content file.
//
// Usage: node scripts/build-report.js <content.json> <output.docx>
//
// Content file shape (see scripts/report-content.example.json):
// {
//   "client": "Full Name",
//   "subtitle": ["Proposed residential care | 10-23 January 2027", "New Paradigm Mental Health Retreat, Chiang Mai, Thailand"],
//   "preparedBy": "Prepared by Dirk J. Lambert, Trauma/EMDR Specialist and Program Director",
//   "intro": "Opening paragraph addressed to the client.",
//   "scores": { "rows": [["Despair", 4], ["Fear", 2]], "total": 15 },
//   "sections": [
//     { "heading": "Emotional Load Score",
//       "blocks": ["paragraph text", { "type": "scores" }, { "type": "phase", "label": "Days 1-3", "text": "..." }] }
//   ],
//   "clientInfo": [["Name", "Full Name"], ["Age", "54"]]
// }
// Blocks are plain strings (paragraphs) or objects: {type:"scores"} inserts the category table,
// {type:"phase", label, text} renders a bold label followed by text on one paragraph,
// {type:"table", columns:[...], widths:[...], rows:[[...]]} renders a general table (widths in DXA, total at most 9600).
// Optional "title" replaces the default document title (used for progress reports).
// The Client Information section is always rendered last, on its own page.

const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType,
  AlignmentType, Header, Footer, PageNumber, ShadingType, BorderStyle, PageBreak,
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

const p = (text, opts = {}) => new Paragraph({
  spacing: { after: 200, line: 300 },
  children: [new TextRun({ text, font: FONT, size: opts.size || 22, bold: !!opts.bold, color: opts.color || "222222" })],
});
const h = (text) => new Paragraph({
  spacing: { before: 240, after: 160 },
  keepNext: true,
  children: [new TextRun({ text, font: FONT, size: 26, bold: true, color: "1F3A5F" })],
});
const labelled = (label, text, after) => new Paragraph({
  spacing: { after, line: 300 },
  children: [
    new TextRun({ text: label + ": ", font: FONT, size: 22, bold: true, color: "222222" }),
    new TextRun({ text, font: FONT, size: 22, color: "222222" }),
  ],
});

const border = { style: BorderStyle.SINGLE, size: 4, color: "BFBFBF" };
const borders = { top: border, bottom: border, left: border, right: border };
const cell = (text, w, bold = false, shade = null) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  borders,
  shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: "auto" } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: String(text), font: FONT, size: 21, bold, color: "222222" })] })],
});
const scoresTable = () => new Table({
  width: { size: 6000, type: WidthType.DXA },
  columnWidths: [4200, 1800],
  rows: [
    new TableRow({ tableHeader: true, children: [cell("Emotional category", 4200, true, "E8EEF5"), cell("Reported score", 1800, true, "E8EEF5")] }),
    ...spec.scores.rows.map(([name, n]) => new TableRow({ children: [cell(name, 4200), cell(n, 1800)] })),
    new TableRow({ children: [cell("Total", 4200, true, "F3F3F3"), cell(spec.scores.total, 1800, true, "F3F3F3")] }),
  ],
});
const spacer = () => new Paragraph({ spacing: { after: 120 }, children: [] });
const genericTable = ({ columns, widths, rows }) => new Table({
  width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  columnWidths: widths,
  rows: [
    new TableRow({ tableHeader: true, children: columns.map((c, i) => cell(c, widths[i], true, "E8EEF5")) }),
    ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((v, i) => cell(v, widths[i])) })),
  ],
});

const TITLE = spec.title || "Emotional Evaluation and Treatment Plan";
const children = [
  new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: TITLE, font: FONT, size: 36, bold: true, color: "1F3A5F" })] }),
  new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: CLIENT, font: FONT, size: 28, bold: true, color: "222222" })] }),
  ...(spec.subtitle || []).map((s) => p(s, { color: "444444" })),
  p(spec.preparedBy || "Prepared by Dirk J. Lambert, Trauma/EMDR Specialist and Program Director", { color: "444444" }),
  p(spec.intro),
];

for (const section of spec.sections) {
  children.push(h(section.heading));
  for (const block of section.blocks) {
    if (typeof block === "string") children.push(p(block));
    else if (block.type === "scores") { children.push(scoresTable()); children.push(spacer()); }
    else if (block.type === "phase") children.push(labelled(block.label, block.text, 200));
    else if (block.type === "table") { children.push(genericTable(block)); children.push(spacer()); }
    else throw new Error(`Unknown block type: ${JSON.stringify(block)}`);
  }
}

children.push(new Paragraph({ children: [new PageBreak()] }));
children.push(h("Client Information"));
for (const [label, text] of spec.clientInfo) children.push(labelled(label, text, 120));

const doc = new Document({
  creator: "Dirk J. Lambert",
  title: TITLE + " - " + CLIENT,
  styles: { default: { document: { run: { font: FONT, size: 22 } } } },
  sections: [{
    properties: { page: { margin: { top: 1300, bottom: 1200, left: 1300, right: 1300 } } },
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
      new TextRun({ text: "Confidential | " + CLIENT + " | ", font: FONT, size: 18, color: "777777" }),
      new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18, color: "777777" }),
    ] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
      new TextRun({ text: "New Paradigm Mental Health Retreat | Prepared by Dirk J. Lambert, Trauma/EMDR Specialist and Program Director", font: FONT, size: 16, color: "777777" }),
    ] })] }) },
    children,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outPath, buf);
  console.log("written", outPath, buf.length, "bytes");
});
