import { jsPDF } from "jspdf";

/**
 * Indian court formatting standards.
 *
 * Supreme Court of India (default for petitions/pleadings/affidavits):
 *   Font: Times New Roman, 14pt body, 12pt quotations
 *   Line spacing: 1.5
 *   Margins: 4cm left & right, 2cm top & bottom on A4
 *
 * High Courts (Bombay shown as example):
 *   Font: Times New Roman, 14pt
 *   Inner margin: 5cm, Outer margin: 3cm, Top/Bottom: 2.5cm
 *
 * Private contracts / agreements:
 *   Font: Times New Roman, 12pt
 *   Margins: 1 inch (2.54cm) all sides, single spacing
 */

const CM = 28.3464567; // pt per cm
const INCH = 72;       // pt per inch

export type CourtProfile = "supreme_court" | "high_court" | "trial_court" | "contract";

type ProfileSpec = {
  label: string;
  bodySize: number;
  quoteSize: number;
  lineFactor: number;    // 1.5 = 1.5 line spacing
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  font: "times" | "helvetica";
};

const PROFILES: Record<CourtProfile, ProfileSpec> = {
  supreme_court: {
    label: "Supreme Court of India",
    bodySize: 14,
    quoteSize: 12,
    lineFactor: 1.5,
    marginLeft: 4 * CM,
    marginRight: 4 * CM,
    marginTop: 2 * CM,
    marginBottom: 2 * CM,
    font: "times",
  },
  high_court: {
    label: "High Court",
    bodySize: 14,
    quoteSize: 12,
    lineFactor: 1.5,
    marginLeft: 5 * CM,   // inner
    marginRight: 3 * CM,  // outer
    marginTop: 2.5 * CM,
    marginBottom: 2.5 * CM,
    font: "times",
  },
  trial_court: {
    label: "Trial Court",
    bodySize: 14,
    quoteSize: 12,
    lineFactor: 1.5,
    marginLeft: 3.5 * CM,
    marginRight: 2.5 * CM,
    marginTop: 2.5 * CM,
    marginBottom: 2.5 * CM,
    font: "times",
  },
  contract: {
    label: "Private Contract",
    bodySize: 12,
    quoteSize: 11,
    lineFactor: 1.15,
    marginLeft: INCH,
    marginRight: INCH,
    marginTop: INCH,
    marginBottom: INCH,
    font: "times",
  },
};

function inferProfile(docType?: string | null): CourtProfile {
  const t = (docType ?? "").toLowerCase();
  if (/slp|special leave|supreme court|curative|review petition/.test(t)) return "supreme_court";
  if (/writ|pil|habeas|mandamus|certiorari|prohibition|quo warranto|high court|appeal/.test(t))
    return "high_court";
  if (/agreement|deed|contract|nda|mou|policy|lease|rent|sale|gift|mortgage|power of attorney/.test(t))
    return "contract";
  return "trial_court";
}

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
  profile?: CourtProfile;
}): jsPDF {
  const profile = PROFILES[opts.profile ?? inferProfile(opts.docType)];
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const { marginLeft, marginRight, marginTop, marginBottom, bodySize, quoteSize, lineFactor, font } =
    profile;
  const usableW = pageW - marginLeft - marginRight;
  const bodyLineH = bodySize * lineFactor;
  const quoteLineH = quoteSize * lineFactor;

  // Reserve strip inside top/bottom margins for header/footer text
  const headerY = Math.max(marginTop - 18, 24);
  const footerY = pageH - Math.max(marginBottom - 18, 24);

  function drawChrome(pageNo: number) {
    doc.setFont(font, "normal");
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(`${opts.docType ?? "Legal Document"} — ${profile.label}`, marginLeft, headerY);
    doc.text(`Page ${pageNo}`, pageW - marginRight, headerY, { align: "right" });
    doc.text(opts.title.slice(0, 90), marginLeft, footerY);
    if (opts.author) {
      doc.text(`Drafted by ${opts.author}`, pageW - marginRight, footerY, { align: "right" });
    }
    doc.setTextColor(0, 0, 0);
  }

  let pageNo = 1;
  drawChrome(pageNo);

  // Title — centered, bold, slightly larger than body
  doc.setFont(font, "bold");
  doc.setFontSize(bodySize + 2);
  const titleLines = doc.splitTextToSize(opts.title, usableW);
  let y = marginTop + (bodySize + 2);
  for (const line of titleLines) {
    doc.text(line, pageW / 2, y, { align: "center" });
    y += (bodySize + 2) * lineFactor;
  }
  y += bodyLineH * 0.5;

  doc.setFont(font, "normal");
  doc.setFontSize(bodySize);

  const cleaned = stripMarkdown(opts.content);
  const paragraphs = cleaned.split(/\n{2,}/);

  for (const raw of paragraphs) {
    const p = raw.trim();
    if (!p) continue;

    const isHeading =
      p.length < 140 &&
      /^(IN THE|BEFORE|WRIT|PETITION|APPLICATION|BAIL|PRAYER|VERIFICATION|MEMO|CAUSE TITLE|FACTS|GROUNDS|SCHEDULE|ANNEXURE|AFFIDAVIT|INDEX|SYNOPSIS|LIST OF DATES)/i.test(
        p,
      );
    // Quotations / indented citations rendered smaller per SC rules
    const isQuote = /^>\s?/.test(raw) || /^"[\s\S]+"$/.test(p);

    if (isHeading) {
      doc.setFont(font, "bold");
      doc.setFontSize(bodySize);
    } else if (isQuote) {
      doc.setFont(font, "italic");
      doc.setFontSize(quoteSize);
    } else {
      doc.setFont(font, "normal");
      doc.setFontSize(bodySize);
    }

    const text = isQuote ? p.replace(/^>\s?/, "") : p;
    const indent = isQuote ? 24 : 0;
    const lineH = isQuote ? quoteLineH : bodyLineH;
    const lines = doc.splitTextToSize(text, usableW - indent);

    for (const line of lines) {
      if (y > pageH - marginBottom) {
        doc.addPage();
        pageNo += 1;
        drawChrome(pageNo);
        y = marginTop + bodySize;
      }
      const align = isHeading ? "center" : "justify";
      if (align === "center") {
        doc.text(line, pageW / 2, y, { align: "center" });
      } else {
        doc.text(line, marginLeft + indent, y, {
          maxWidth: usableW - indent,
          align: "justify",
        });
      }
      y += lineH;
    }
    y += bodyLineH * 0.4;
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
