/**
 * Generate MOD-24 Manual QC v1.1 — Markdown, PDF, and DOCX.
 * Run: node scripts/generate-mod24-manual-qc-docs.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  Header,
  Footer,
  TableOfContents,
  BorderStyle,
} from "docx";
import {
  MOD24_QC_META,
  MOD24_PRECONDITIONS,
  MOD24_KNOWN_LIMITATIONS,
  MOD24_TEST_CASES,
} from "../docs/AI-QC/manual-qc/source/024-mod24-qc-cases.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const sourceDir = join(root, "docs/AI-QC/manual-qc/source");
const pdfDir = join(root, "docs/AI-QC/manual-qc/pdf");
const docxDir = join(root, "docs/AI-QC/manual-qc/docx");
const baseName = "024-Report-Release-Delivery-Manual-QC-v1.1";
const mdPath = join(sourceDir, `${baseName}.md`);
const pdfPath = join(pdfDir, `${baseName}.pdf`);
const docxPath = join(docxDir, `${baseName}.docx`);

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function caseId(number) {
  return `MOD24-${String(number).padStart(3, "0")}`;
}

function buildMarkdown() {
  const lines = [];
  lines.push("# ABSHealthcareLite Manual Quality Control and UAT Guide");
  lines.push("## MOD-24 — Report Release & Delivery");
  lines.push("");
  lines.push("| Document control | Value |");
  lines.push("|---|---|");
  lines.push(`| Module ID | ${MOD24_QC_META.moduleId} |`);
  lines.push(`| Module name | ${MOD24_QC_META.moduleName} |`);
  lines.push(`| Document version | ${MOD24_QC_META.version} |`);
  lines.push(`| Document status | ${MOD24_QC_META.documentStatus} |`);
  lines.push(`| Prepared date | ${MOD24_QC_META.preparedDate} |`);
  lines.push(`| Prepared by | ${MOD24_QC_META.preparedBy} |`);
  lines.push(`| Environment | ${MOD24_QC_META.environment} |`);
  lines.push("| Intended audience | Independent QC engineers and UAT representatives |");
  lines.push("| Classification | Internal QC / UAT working document |");
  lines.push("");
  lines.push("> **Status: NOT TESTED** — execute in browser and attach evidence before marking pass.");
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Preconditions");
  lines.push("");
  for (const item of MOD24_PRECONDITIONS) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## Result template reference");
  lines.push("");
  lines.push("Use `docs/AI-QC/manual-qc/results/024-Report-Release-Delivery-Manual-QC-Result-Template-v1.1.md`");
  lines.push("");
  lines.push("---");
  lines.push("");

  let currentSection = "";
  for (const testCase of MOD24_TEST_CASES) {
    if (testCase.section !== currentSection) {
      currentSection = testCase.section;
      lines.push(`## ${currentSection}`);
      lines.push("");
    }
    lines.push(`### Test Case ${testCase.number} — ${testCase.title}`);
    lines.push("");
    lines.push("| Field | Content |");
    lines.push("|---|---|");
    lines.push(`| Test Case ID | ${caseId(testCase.number)} |`);
    lines.push(`| Test Case | ${testCase.number}. ${testCase.expected} |`);
    lines.push(`| Objective | ${testCase.objective} |`);
    lines.push("| Steps | |");
    for (const [index, step] of testCase.steps.entries()) {
      lines.push(`| | ${index + 1}. ${step} |`);
    }
    lines.push(`| Expected Result | ${testCase.expected} |`);
    lines.push("| Actual Result | |");
    lines.push("| Status | NOT RUN |");
    lines.push("| Evidence | |");
    lines.push("| Tester | |");
    lines.push("| Date | |");
    lines.push("| Remarks | |");
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Appendix A — Test Evidence");
  lines.push("");
  lines.push("| Test Case ID | Evidence file / link | Captured by | Date |");
  lines.push("|---|---|---|---|");
  for (const testCase of MOD24_TEST_CASES) {
    lines.push(`| ${caseId(testCase.number)} | | | |`);
  }
  lines.push("");
  lines.push("## Appendix B — Screenshots");
  lines.push("");
  lines.push("| Test Case ID | Screenshot file | Description |");
  lines.push("|---|---|---|");
  for (const testCase of MOD24_TEST_CASES) {
    lines.push(`| ${caseId(testCase.number)} | _placeholder_ | |`);
  }
  lines.push("");
  lines.push("## Appendix C — Known Limitations");
  lines.push("");
  for (const item of MOD24_KNOWN_LIMITATIONS) {
    lines.push(`- ${item}`);
  }
  lines.push("");
  lines.push("## Appendix D — Sign-off");
  lines.push("");
  lines.push("| Role | Name | Date | Signature |");
  lines.push("|---|---|---|---|");
  lines.push("| Reviewer | | | |");
  lines.push("| QA Lead | | | |");
  lines.push("| Date | | | |");
  lines.push("| Signature | | | |");
  lines.push("");

  return lines.join("\n");
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

  for (const line of lines) {
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

    const withInline = escapeHtml(line)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    html += `<p>${withInline}</p>`;
  }
  if (inTable) html += "</table>";
  flushCode();
  return html;
}

function buildPdfHtml(bodyHtml) {
  const tocItems = [
    "Document control and status",
    "Preconditions",
    "Core cases (v1.0 carry-forward) — Test Cases 1–10",
    "v1.1 polish cases — Test Cases 11–30",
    "Appendix A — Test Evidence",
    "Appendix B — Screenshots",
    "Appendix C — Known Limitations",
    "Appendix D — Sign-off",
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>MOD-24 Manual QC v1.1</title>
<style>
  @page { size: A4 portrait; }
  body { font-family: "Segoe UI", Calibri, Arial, sans-serif; font-size: 9pt; line-height: 1.35; color: #111827; margin: 0; }
  .cover { page-break-after: always; text-align: center; padding: 55mm 18mm 0; min-height: 250mm; box-sizing: border-box; }
  .logo-box { width: 42mm; height: 18mm; border: 1px dashed #94a3b8; margin: 0 auto 10mm; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:8pt; }
  .cover h1 { font-size: 22pt; margin: 0 0 6mm; color: #0f766e; }
  .cover .sub { font-size: 11pt; color: #334155; margin: 3mm 0; }
  .cover .meta { font-size: 10pt; margin-top: 14mm; text-align: left; display: inline-block; }
  .cover .meta td { padding: 2px 8px 2px 0; vertical-align: top; }
  .toc { page-break-after: always; padding: 8mm 0; }
  .toc h2 { font-size: 14pt; color: #0f766e; }
  .toc ol { font-size: 10pt; line-height: 1.7; }
  h1 { font-size: 15pt; border-bottom: 2px solid #0d9488; padding-bottom: 3px; margin: 14px 0 8px; page-break-after: avoid; }
  h2 { font-size: 11.5pt; color: #0f766e; margin: 12px 0 6px; page-break-after: avoid; }
  h3 { font-size: 10pt; margin: 10px 0 4px; page-break-after: avoid; page-break-inside: avoid; }
  table.data-table { width: 100%; border-collapse: collapse; margin: 6px 0 10px; font-size: 7.2pt; table-layout: fixed; word-wrap: break-word; }
  table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 3px 4px; vertical-align: top; overflow-wrap: anywhere; }
  table.data-table th { background: #f1f5f9; font-weight: 600; width: 22%; }
  pre { background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; font-size: 7pt; white-space: pre-wrap; overflow-wrap: anywhere; page-break-inside: avoid; }
  code { background: #f1f5f9; padding: 1px 3px; border-radius: 2px; font-size: 7.5pt; }
  blockquote { border-left: 3px solid #0d9488; margin: 6px 0; padding: 4px 10px; background: #f0fdfa; font-size: 8.5pt; page-break-inside: avoid; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 10px 0; }
  p { margin: 4px 0; }
  .screenshot-placeholder { border: 1px dashed #94a3b8; min-height: 28mm; margin: 4mm auto; max-width: 120mm; display:flex; align-items:center; justify-content:center; color:#64748b; font-size:8pt; page-break-inside: avoid; }
</style>
</head>
<body>
<section class="cover">
  <div class="logo-box">Company Logo Placeholder</div>
  <h1>ABSHealthcareLite</h1>
  <p class="sub"><strong>Manual Quality Control and UAT Guide</strong></p>
  <p class="sub">${MOD24_QC_META.moduleId} — ${MOD24_QC_META.moduleName}</p>
  <p class="sub">Version ${MOD24_QC_META.version}</p>
  <table class="meta">
    <tr><td><strong>Document Status</strong></td><td>${MOD24_QC_META.documentStatus}</td></tr>
    <tr><td><strong>Date</strong></td><td>${MOD24_QC_META.preparedDate}</td></tr>
    <tr><td><strong>Prepared By</strong></td><td>${MOD24_QC_META.preparedBy}</td></tr>
    <tr><td><strong>Environment</strong></td><td>${MOD24_QC_META.environment}</td></tr>
  </table>
  <p class="sub" style="margin-top:16mm;color:#64748b;">Confidential — ABSHealthcareLite QC Use Only</p>
</section>
<section class="toc">
  <h2>Table of Contents</h2>
  <ol>${tocItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>
</section>
<main>${bodyHtml.replace(/_placeholder_/g, '<div class="screenshot-placeholder">Screenshot placeholder</div>')}</main>
</body>
</html>`;
}

function tableCell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    children: [
      new Paragraph({
        children: [new TextRun({ text: String(text ?? ""), bold: opts.bold ?? false, size: 20 })],
      }),
    ],
  });
}

function buildDocxBuffer() {
  const children = [];

  children.push(
    new Paragraph({ text: "ABSHealthcareLite", heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "Manual Quality Control and UAT Guide", alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `${MOD24_QC_META.moduleId} — ${MOD24_QC_META.moduleName}`, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `Version ${MOD24_QC_META.version}`, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "[Company Logo Placeholder]", alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: `Document Status: ${MOD24_QC_META.documentStatus}`, bold: true })] }),
    new Paragraph({ text: `Date: ${MOD24_QC_META.preparedDate}` }),
    new Paragraph({ text: `Prepared By: ${MOD24_QC_META.preparedBy}` }),
    new Paragraph({ text: `Environment: ${MOD24_QC_META.environment}` }),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ text: "Table of Contents", heading: HeadingLevel.HEADING_1 }),
    new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ text: "Preconditions", heading: HeadingLevel.HEADING_1 }),
  );

  for (const item of MOD24_PRECONDITIONS) {
    children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
  }

  children.push(
    new Paragraph({ text: "" }),
    new Paragraph({
      text: "Result template: docs/AI-QC/manual-qc/results/024-Report-Release-Delivery-Manual-QC-Result-Template-v1.1.md",
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  let currentSection = "";
  for (const testCase of MOD24_TEST_CASES) {
    if (testCase.section !== currentSection) {
      currentSection = testCase.section;
      children.push(new Paragraph({ text: currentSection, heading: HeadingLevel.HEADING_1 }));
    }

    children.push(
      new Paragraph({
        text: `Test Case ${testCase.number} — ${testCase.title}`,
        heading: HeadingLevel.HEADING_2,
      }),
    );

    const rows = [
      ["Test Case ID", caseId(testCase.number)],
      ["Test Case", `${testCase.number}. ${testCase.expected}`],
      ["Objective", testCase.objective],
      ["Steps", testCase.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")],
      ["Expected Result", testCase.expected],
      ["Actual Result", ""],
      ["Status", ""],
      ["Evidence", ""],
      ["Tester", ""],
      ["Date", ""],
      ["Remarks", ""],
    ];

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: rows.map(
          ([label, value]) =>
            new TableRow({
              children: [
                tableCell(label, { width: 24, bold: true }),
                tableCell(value, { width: 76 }),
              ],
            }),
        ),
      }),
      new Paragraph({ text: "" }),
    );
  }

  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ text: "Appendix A — Test Evidence", heading: HeadingLevel.HEADING_1 }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [tableCell("Test Case ID", { bold: true }), tableCell("Evidence file / link", { bold: true }), tableCell("Captured by", { bold: true }), tableCell("Date", { bold: true })],
        }),
        ...MOD24_TEST_CASES.map(
          (testCase) =>
            new TableRow({
              children: [tableCell(caseId(testCase.number)), tableCell(""), tableCell(""), tableCell("")],
            }),
        ),
      ],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "Appendix B — Screenshots", heading: HeadingLevel.HEADING_1 }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [tableCell("Test Case ID", { bold: true }), tableCell("Screenshot file", { bold: true }), tableCell("Description", { bold: true })],
        }),
        ...MOD24_TEST_CASES.map(
          (testCase) =>
            new TableRow({
              children: [tableCell(caseId(testCase.number)), tableCell("[Screenshot placeholder]"), tableCell("")],
            }),
        ),
      ],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ text: "Appendix C — Known Limitations", heading: HeadingLevel.HEADING_1 }),
  );

  for (const item of MOD24_KNOWN_LIMITATIONS) {
    children.push(new Paragraph({ text: item, bullet: { level: 0 } }));
  }

  children.push(
    new Paragraph({ text: "" }),
    new Paragraph({ text: "Appendix D — Sign-off", heading: HeadingLevel.HEADING_1 }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [tableCell("Reviewer", { bold: true }), tableCell(""), tableCell("Date", { bold: true }), tableCell(""), tableCell("Signature", { bold: true }), tableCell("")] }),
        new TableRow({ children: [tableCell("QA Lead", { bold: true }), tableCell(""), tableCell("Date", { bold: true }), tableCell(""), tableCell("Signature", { bold: true }), tableCell("")] }),
      ],
    }),
  );

  const doc = new Document({
    features: { trackRevisions: true, updateFields: true },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, bottom: 720, left: 900, right: 900 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `ABSHealthcareLite — ${MOD24_QC_META.moduleId} Manual QC v${MOD24_QC_META.version}`,
                    size: 16,
                    color: "64748B",
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Confidential — ABSHealthcareLite QC Use Only",
                    size: 16,
                    color: "64748B",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

async function generatePdf(html) {
  mkdirSync(pdfDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: pdfPath,
    format: "A4",
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate:
      '<div style="width:100%;font-size:7px;padding:0 10mm;color:#64748b;">ABSHealthcareLite — MOD-24 Report Release Manual QC v1.1</div>',
    footerTemplate:
      '<div style="width:100%;font-size:7px;text-align:center;color:#64748b;">Confidential — QC Use Only — Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
    margin: { top: "16mm", bottom: "14mm", left: "12mm", right: "12mm" },
  });
  await browser.close();
}

async function main() {
  const warnings = [];

  const markdown = buildMarkdown();
  writeFileSync(mdPath, markdown, "utf8");
  console.log(`Generated MD: ${mdPath}`);

  const bodyHtml = mdToHtml(markdown);
  const pdfHtml = buildPdfHtml(bodyHtml);
  await generatePdf(pdfHtml);
  const pdfBuffer = readFileSync(pdfPath);
  const pageCount = (pdfBuffer.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;
  console.log(`Generated PDF: ${pdfPath} (${pdfBuffer.length} bytes, ~${pageCount} pages)`);

  mkdirSync(docxDir, { recursive: true });
  const docxBuffer = await buildDocxBuffer();
  writeFileSync(docxPath, docxBuffer);
  console.log(`Generated DOCX: ${docxPath} (${docxBuffer.length} bytes)`);

  if (pageCount > 80) {
    warnings.push("PDF exceeds 80 pages; spot-check table wrapping on dense test-case sections.");
  }
  warnings.push("Word TOC requires opening DOCX in Microsoft Word and choosing Update Table of Contents.");
  warnings.push("Bangla/Hindi/Arabic complex scripts in Word may need font substitution on reviewer machines.");
  warnings.push("Automated PDF TOC uses static list; page numbers appear in footer only, not inline TOC leaders.");
  warnings.push("Screenshot placeholders are empty boxes until QC attaches real evidence files.");

  console.log("\nConversion report:");
  for (const warning of warnings) {
    console.log(`- ${warning}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
