// Convert a .docx to .pdf.
//
// Usage: node scripts/convert-pdf.js <input.docx> <output.pdf>
//
// Tries LibreOffice first (available in the cloud sandbox and on most Linux machines),
// then falls back to Microsoft Word through COM automation on Windows.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: node scripts/convert-pdf.js <input.docx> <output.pdf>");
  process.exit(1);
}
const absIn = path.resolve(input);
const absOut = path.resolve(output);

function tryLibreOffice() {
  for (const bin of ["soffice", "libreoffice", "C:\\Program Files\\LibreOffice\\program\\soffice.exe"]) {
    const outDir = path.dirname(absOut);
    const r = spawnSync(bin, ["--headless", "--convert-to", "pdf", "--outdir", outDir, absIn], { encoding: "utf8" });
    if (r.error) continue;
    const produced = path.join(outDir, path.basename(absIn, path.extname(absIn)) + ".pdf");
    if (fs.existsSync(produced)) {
      if (produced !== absOut) fs.renameSync(produced, absOut);
      return true;
    }
  }
  return false;
}

function tryWord() {
  if (process.platform !== "win32") return false;
  const ps = `
    $word = New-Object -ComObject Word.Application; $word.Visible = $false
    try { $doc = $word.Documents.Open('${absIn.replace(/'/g, "''")}', $false, $true); $doc.ExportAsFixedFormat('${absOut.replace(/'/g, "''")}', 17); $doc.Close($false) }
    finally { $word.Quit() }`;
  const r = spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8" });
  return r.status === 0 && fs.existsSync(absOut);
}

if (tryLibreOffice() || tryWord()) {
  console.log("written", absOut, fs.statSync(absOut).size, "bytes");
} else {
  console.error("No converter available. Install LibreOffice, or run on Windows with Microsoft Word.");
  process.exit(1);
}
