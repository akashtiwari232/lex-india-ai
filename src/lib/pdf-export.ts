import { jsPDF } from "jspdf";

// Convert markdown-ish legal draft to a paginated, court-styled PDF.
function stripMarkdown(s: string): string {
  return s
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```/g, ""))
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

export function generateLegalPdf(opts: {
  title: string;
  docType?: string | null;
  content: string;
  author?: string;
}): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 56;
  const marginTop = 70;
  const marginBottom = 60;
  const usableW = pageW - marginX * 2;

  // Header band
  function drawHeader(pageNo: number) {
    doc.setDrawColor(150, 110, 50);
    doc.setLineWidth(0.6);
    doc.line(marginX, 46, pageW - marginX, 46);
    doc.setFont("times", "bold");
    doc.setFontSize(10);
    doc.setTextColor(92, 26, 27);
    doc.text("LexLaw AI", marginX, 38);
    doc.setFont("times", "normal");
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    const right = opts.docType ?? "Legal Brief";
    doc.text(right, pageW - marginX, 38, { align: "right" });
    // footer
    doc.setLineWidth(0.4);
    doc.line(marginX, pageH - 38, pageW - marginX, pageH - 38);
    doc.setFontSize(9);
    doc.text(
      `${opts.title.slice(0, 80)} · Drafted by ${opts.author ?? "LexLaw AI"}`,
      marginX,
      pageH - 24,
    );
    doc.text(`Page ${pageNo}`, pageW - marginX, pageH - 24, { align: "right" });
    doc.setTextColor(0, 0, 0);
  }

  let pageNo = 1;
  drawHeader(pageNo);

  // Title
  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  const titleLines = doc.splitTextToSize(opts.title, usableW);
  doc.text(titleLines, pageW / 2, marginTop, { align: "center" });

  let y = marginTop + titleLines.length * 18 + 14;

  // Body
  doc.setFont("times", "normal");
  doc.setFontSize(11.5);
  const cleaned = stripMarkdown(opts.content);
  const paragraphs = cleaned.split(/\n{2,}/);

  for (const p of paragraphs) {
    const isHeading =
      /^(IN THE|BEFORE|WRIT|PETITION|APPLICATION|BAIL|PRAYER|VERIFICATION|MEMO|CAUSE TITLE|FACTS|GROUNDS|SCHEDULE|ANNEXURE)/i.test(
        p.trim(),
      ) && p.length < 120;

    if (isHeading) {
      doc.setFont("times", "bold");
    } else {
      doc.setFont("times", "normal");
    }
    const lines = doc.splitTextToSize(p.trim(), usableW);
    for (const line of lines) {
      if (y > pageH - marginBottom) {
        doc.addPage();
        pageNo += 1;
        drawHeader(pageNo);
        y = marginTop;
      }
      doc.text(line, marginX, y);
      y += 15;
    }
    y += 8;
  }

  return doc;
}

export function downloadDraftPdf(opts: Parameters<typeof generateLegalPdf>[0]) {
  const doc = generateLegalPdf(opts);
  const safe = opts.title.replace(/[^a-z0-9-_ ]/gi, "").slice(0, 60) || "draft";
  doc.save(`${safe}.pdf`);
}

export function draftPdfBlobUrl(opts: Parameters<typeof generateLegalPdf>[0]): string {
  const doc = generateLegalPdf(opts);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}
