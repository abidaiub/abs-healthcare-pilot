/**
 * Generate QC Engineer Quick Start PDF — uses project Playwright.
 * Run: node scripts/generate-qc-engineer-pdf.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourcePath = join(
  root,
  "docs/AI-QC/manual-qc/source/001-QC-Engineer-QuickStart-v1.0.md",
);
const pdfDir = join(root, "docs/AI-QC/manual-qc/pdf");
const pdfPath = join(pdfDir, "001-QC-Engineer-QuickStart-v1.0.pdf");
const verifyDir = join(pdfDir, "_verify-qc-engineer");

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function mdToHtml(md) {
  const lines = md.split("\n");
  let html = "";
  let inTable = false;
  let inCode = false;
  let codeBuf = [];
  let tableHasHeader = false;

  const flushCode = () => {
    if (codeBuf.length) {
      html += `<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`;
      codeBuf = [];
    }
  };

  for (const raw of lines) {
    const line = raw;

    if (line.startsWith("```")) {
      if (inCode) {
        flushCode();
        inCode = false;
      } else {
        if (inTable) {
          html += "</table>";
          inTable = false;
          tableHasHeader = false;
        }
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    if (line.startsWith("# ")) {
      if (inTable) {
        html += "</table>";
        inTable = false;
      }
      html += `<h1>${escapeHtml(line.slice(2))}</h1>`;
      continue;
    }
    if (line.startsWith("## ")) {
      if (inTable) {
        html += "</table>";
        inTable = false;
      }
      html += `<h2>${escapeHtml(line.slice(3))}</h2>`;
      continue;
    }
    if (line.startsWith("### ")) {
      if (inTable) {
        html += "</table>";
        inTable = false;
      }
      html += `<h3>${escapeHtml(line.slice(4))}</h3>`;
      continue;
    }

    if (line.startsWith("|")) {
      if (/^\|[\s\-:|]+\|$/.test(line)) continue;
      if (!inTable) {
        inTable = true;
        tableHasHeader = false;
        html += '<table class="data-table">';
      }
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      const cellTag = tableHasHeader ? "td" : "th";
      html +=
        "<tr>" +
        cells.map((c) => `<${cellTag}>${escapeHtml(c)}</${cellTag}>`).join("") +
        "</tr>";
      if (!tableHasHeader) tableHasHeader = true;
      continue;
    } else if (inTable) {
      html += "</table>";
      inTable = false;
      tableHasHeader = false;
    }

    if (line.startsWith("> ")) {
      html += `<blockquote>${escapeHtml(line.slice(2))}</blockquote>`;
      continue;
    }
    if (line.trim() === "---") {
      html += "<hr/>";
      continue;
    }
    if (line.trim() === "") continue;

    const withBold = escapeHtml(line).replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>",
    );
    html += `<p>${withBold}</p>`;
  }
  if (inTable) html += "</table>";
  flushCode();
  return html;
}

const md = readFileSync(sourcePath, "utf8");
const body = mdToHtml(md);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>QC Engineer Quick Start v1.0</title>
<style>
  body { font-family: Segoe UI, Arial, sans-serif; font-size: 9.5pt; line-height: 1.4; color: #111; margin: 0; }
  .cover { page-break-after: always; text-align: center; padding: 65mm 20mm 0; min-height: 250mm; box-sizing: border-box; }
  .cover h1 { font-size: 22pt; margin: 0 0 8mm; }
  .cover .sub { font-size: 12pt; color: #334155; margin: 4mm 0; }
  .toc { page-break-after: always; padding: 10mm 0; }
  .toc h2 { font-size: 14pt; }
  .toc ol { font-size: 10pt; line-height: 1.7; }
  h1 { font-size: 15pt; border-bottom: 2px solid #0d9488; padding-bottom: 3px; margin: 14px 0 8px; page-break-after: avoid; }
  h2 { font-size: 11.5pt; color: #0f766e; margin: 12px 0 6px; page-break-after: avoid; }
  h3 { font-size: 10pt; margin: 10px 0 4px; page-break-after: avoid; }
  table.data-table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 8pt; table-layout: fixed; word-wrap: break-word; }
  table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 4px 5px; vertical-align: top; overflow-wrap: anywhere; }
  table.data-table th { background: #f1f5f9; font-weight: 600; }
  pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; font-size: 7.5pt; white-space: pre-wrap; overflow-wrap: anywhere; page-break-inside: avoid; }
  blockquote { border-left: 3px solid #0d9488; margin: 6px 0; padding: 4px 10px; background: #f0fdfa; font-size: 8.5pt; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 10px 0; }
  p { margin: 4px 0; }
</style>
</head>
<body>
<section class="cover">
  <h1>ABSHealthcareLite</h1>
  <p class="sub"><strong>QC Engineer Quick Start Guide</strong></p>
  <p class="sub">MOD-01 — Setup, Commands, and Manual QC Workflow</p>
  <p class="sub">Version 1.0</p>
  <p class="sub" style="margin-top:18mm;">Prepared: 19 July 2026</p>
  <p class="sub">Environment: QC Docker (non-production)</p>
  <p class="sub" style="margin-top:12mm;color:#64748b;">Confidential — ABSHealthcareLite - QC Use Only</p>
</section>
<section class="toc">
  <h2>Table of Contents</h2>
  <ol>
    <li>Documents you need</li>
    <li>QC environment URLs</li>
    <li>QC server — deploy and verify</li>
    <li>Local development (optional)</li>
    <li>Manual QC workflow</li>
    <li>Quick command reference</li>
    <li>Roles during testing</li>
    <li>Important rules</li>
    <li>Support references</li>
    <li>Contact and escalation</li>
  </ol>
</section>
<main>${body}</main>
</body>
</html>`;

mkdirSync(pdfDir, { recursive: true });
mkdirSync(verifyDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(fullHtml, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.emulateMedia({ media: "print" });

await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate:
    '<div style="width:100%;font-size:7px;text-align:center;color:#64748b;">ABSHealthcareLite - QC Use Only — QC Engineer Quick Start v1.0 — Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  margin: { top: "12mm", bottom: "16mm", left: "10mm", right: "10mm" },
});

await page.screenshot({
  path: join(verifyDir, "cover-sample.png"),
  fullPage: false,
});

await browser.close();

const pdfBuffer = readFileSync(pdfPath);
const pageMatches = pdfBuffer.toString("latin1").match(/\/Type\s*\/Page\b/g);
const pageCount = pageMatches ? pageMatches.length : 0;

const report = [
  `Generated: ${pdfPath}`,
  `Timestamp: ${new Date().toISOString()}`,
  `Size bytes: ${pdfBuffer.length}`,
  `Estimated page count: ${pageCount}`,
  "",
  "Result: PASS (QC Engineer Quick Start PDF generated)",
].join("\n");

writeFileSync(join(verifyDir, "pdf-verification-report.txt"), report);
console.log(report);
