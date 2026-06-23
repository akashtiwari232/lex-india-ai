// Intake field schema for legal document drafting.
// Each doc type can declare specific fields; otherwise we fall back to
// COMMON_FIELDS + a generic facts/relief block.

export type IntakeField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "select" | "number";
  placeholder?: string;
  required?: boolean;
  options?: string[];
  help?: string;
  span?: 1 | 2; // grid column span on md+
};

export type IntakeSection = {
  title: string;
  fields: IntakeField[];
};

const PARTY_SECTION: IntakeSection = {
  title: "Parties",
  fields: [
    {
      name: "petitioner_name",
      label: "Petitioner / Applicant / Plaintiff — Name",
      type: "text",
      required: true,
      placeholder: "Full legal name",
    },
    {
      name: "petitioner_details",
      label: "Petitioner — Address & Identification",
      type: "textarea",
      placeholder: "Age, occupation, S/o or D/o, full address with PIN",
      span: 2,
    },
    {
      name: "respondent_name",
      label: "Respondent / Defendant / Opposite Party — Name",
      type: "text",
      required: true,
      placeholder: "Full legal name",
    },
    {
      name: "respondent_details",
      label: "Respondent — Address & Identification",
      type: "textarea",
      placeholder: "Designation if applicable, full address with PIN",
      span: 2,
    },
  ],
};

const JURISDICTION_SECTION: IntakeSection = {
  title: "Court & Jurisdiction",
  fields: [
    {
      name: "court",
      label: "Court / Forum / Tribunal",
      type: "text",
      required: true,
      placeholder: "e.g. Hon'ble High Court of Delhi at New Delhi",
    },
    {
      name: "case_no",
      label: "Case / Petition Number (if any)",
      type: "text",
      placeholder: "Leave blank if fresh filing",
    },
    {
      name: "filing_date",
      label: "Intended Date of Filing",
      type: "date",
    },
    {
      name: "jurisdiction_basis",
      label: "Basis of Jurisdiction (territorial / pecuniary / subject)",
      type: "textarea",
      placeholder: "Where the cause of action arose, value, statutory provision conferring jurisdiction",
      span: 2,
    },
  ],
};

const FACTS_SECTION: IntakeSection = {
  title: "Facts, Grounds & Relief",
  fields: [
    {
      name: "cause_of_action_date",
      label: "Date of Cause of Action",
      type: "date",
    },
    {
      name: "facts",
      label: "Statement of Facts (chronological)",
      type: "textarea",
      required: true,
      placeholder:
        "Narrate the facts in numbered chronological order — dates, events, correspondence, transactions…",
      span: 2,
    },
    {
      name: "grounds",
      label: "Legal Grounds / Statutory Provisions Invoked",
      type: "textarea",
      placeholder: "Sections, Articles, Rules relied upon; constitutional / statutory grounds",
      span: 2,
    },
    {
      name: "relief",
      label: "Relief / Prayer Sought",
      type: "textarea",
      required: true,
      placeholder: "Precise reliefs the court is being asked to grant",
      span: 2,
    },
    {
      name: "interim_relief",
      label: "Interim Relief (if any)",
      type: "textarea",
      placeholder: "Stay, injunction, status quo, protection from arrest etc.",
      span: 2,
    },
  ],
};

const ANNEXURES_SECTION: IntakeSection = {
  title: "Annexures & Notes",
  fields: [
    {
      name: "annexures",
      label: "List of Annexures / Documents to be filed",
      type: "textarea",
      placeholder: "Annexure A — ..., Annexure B — ...",
      span: 2,
    },
    {
      name: "extra_instructions",
      label: "Special Instructions for the Draftsman",
      type: "textarea",
      placeholder: "Tone, length, particular precedents to cite, language preferences…",
      span: 2,
    },
  ],
};

const COMMON_SECTIONS: IntakeSection[] = [
  PARTY_SECTION,
  JURISDICTION_SECTION,
  FACTS_SECTION,
  ANNEXURES_SECTION,
];

// Per-doc-type extra sections. Inserted BEFORE Facts section.
const TYPE_EXTRAS: Record<string, IntakeSection> = {
  "Bail Application": {
    title: "Bail Specifics",
    fields: [
      { name: "fir_no", label: "FIR Number", type: "text", required: true },
      { name: "police_station", label: "Police Station", type: "text", required: true },
      { name: "sections", label: "Sections / Offences Alleged (BNS / Special Acts)", type: "text", required: true, span: 2 },
      { name: "arrest_date", label: "Date of Arrest", type: "date" },
      { name: "custody_status", label: "Current Custody Status", type: "select", options: ["Judicial Custody", "Police Custody", "Not yet arrested", "Released earlier"] },
      { name: "prior_bail", label: "Prior Bail Applications (if any)", type: "textarea", span: 2 },
    ],
  },
  "Anticipatory Bail Application": {
    title: "Anticipatory Bail Specifics",
    fields: [
      { name: "fir_no", label: "FIR / Complaint Number", type: "text", required: true },
      { name: "police_station", label: "Police Station", type: "text", required: true },
      { name: "sections", label: "Sections / Offences Alleged", type: "text", required: true, span: 2 },
      { name: "apprehension", label: "Reasons for Apprehension of Arrest", type: "textarea", required: true, span: 2 },
    ],
  },
  "Criminal Complaint": {
    title: "Complaint Specifics",
    fields: [
      { name: "offence_date", label: "Date of Offence", type: "date", required: true },
      { name: "offence_place", label: "Place of Offence", type: "text", required: true },
      { name: "sections", label: "Sections invoked (BNS / Special Acts)", type: "text", required: true, span: 2 },
      { name: "witnesses", label: "Witnesses (names & addresses)", type: "textarea", span: 2 },
    ],
  },
  "FIR Representation": {
    title: "FIR Representation Specifics",
    fields: [
      { name: "police_station", label: "Police Station Addressed", type: "text", required: true },
      { name: "incident_date", label: "Date of Incident", type: "date", required: true },
      { name: "sections", label: "Suggested Sections (BNS / Special Acts)", type: "text", span: 2 },
    ],
  },
  "Writ Petition": {
    title: "Writ Specifics",
    fields: [
      {
        name: "writ_type",
        label: "Nature of Writ",
        type: "select",
        required: true,
        options: ["Mandamus", "Certiorari", "Prohibition", "Quo Warranto", "Habeas Corpus", "Composite"],
      },
      { name: "article", label: "Constitutional Article(s)", type: "text", required: true, placeholder: "Art. 32 / Art. 226" },
      { name: "fundamental_right", label: "Fundamental Right(s) Violated", type: "text", span: 2 },
      { name: "impugned_action", label: "Impugned Order / Action / Notification", type: "textarea", required: true, span: 2 },
    ],
  },
  "Habeas Corpus": {
    title: "Detenu Particulars",
    fields: [
      { name: "detenu_name", label: "Detenu's Name", type: "text", required: true },
      { name: "detention_place", label: "Place of Detention", type: "text", required: true },
      { name: "detention_date", label: "Date of Detention", type: "date", required: true },
      { name: "detaining_authority", label: "Detaining Authority", type: "text", required: true, span: 2 },
    ],
  },
  "Public Interest Litigation (PIL)": {
    title: "PIL Specifics",
    fields: [
      { name: "public_interest", label: "Public Interest Involved", type: "textarea", required: true, span: 2 },
      { name: "affected_class", label: "Class / Community Affected", type: "text", span: 2 },
      { name: "locus_standi", label: "Petitioner's Locus / Bona fides", type: "textarea", span: 2 },
    ],
  },
  "Civil Suit (Plaint)": {
    title: "Suit Particulars",
    fields: [
      { name: "suit_value", label: "Valuation of Suit (Rs.)", type: "number", required: true },
      { name: "court_fee", label: "Court Fee Payable (Rs.)", type: "number" },
      { name: "limitation", label: "Limitation Computation", type: "textarea", span: 2 },
    ],
  },
  "Divorce Petition": {
    title: "Marriage Particulars",
    fields: [
      { name: "marriage_date", label: "Date of Marriage", type: "date", required: true },
      { name: "marriage_place", label: "Place of Marriage", type: "text", required: true },
      { name: "personal_law", label: "Personal Law Applicable", type: "select", required: true, options: ["Hindu Marriage Act 1955", "Special Marriage Act 1954", "Muslim Personal Law", "Indian Christian Marriage Act", "Parsi Marriage and Divorce Act"] },
      { name: "grounds_divorce", label: "Grounds for Divorce", type: "textarea", required: true, span: 2 },
      { name: "children", label: "Children of the Marriage (names, age)", type: "textarea", span: 2 },
      { name: "separation_date", label: "Date of Separation (if applicable)", type: "date" },
    ],
  },
  "Mutual Consent Divorce": {
    title: "Mutual Consent Particulars",
    fields: [
      { name: "marriage_date", label: "Date of Marriage", type: "date", required: true },
      { name: "separation_date", label: "Living Separately Since", type: "date", required: true },
      { name: "settlement", label: "Settlement Terms (alimony, custody, property)", type: "textarea", required: true, span: 2 },
    ],
  },
  "Maintenance Petition (Sec 125 BNSS)": {
    title: "Maintenance Particulars",
    fields: [
      { name: "marriage_date", label: "Date of Marriage", type: "date" },
      { name: "monthly_maintenance", label: "Monthly Maintenance Claimed (Rs.)", type: "number", required: true },
      { name: "respondent_income", label: "Respondent's Income / Capacity", type: "textarea", span: 2 },
      { name: "applicant_means", label: "Applicant's Means", type: "textarea", span: 2 },
    ],
  },
  "Custody Petition": {
    title: "Custody Particulars",
    fields: [
      { name: "child_details", label: "Child(ren) Details (name, age, present custody)", type: "textarea", required: true, span: 2 },
      { name: "welfare_grounds", label: "Welfare of the Child — Grounds", type: "textarea", required: true, span: 2 },
    ],
  },
  "Sale Deed": {
    title: "Property & Consideration",
    fields: [
      { name: "property_description", label: "Schedule of Property (boundaries, area, survey no.)", type: "textarea", required: true, span: 2 },
      { name: "consideration", label: "Sale Consideration (Rs.)", type: "number", required: true },
      { name: "payment_mode", label: "Mode of Payment", type: "text", span: 2 },
      { name: "possession_date", label: "Date of Possession", type: "date" },
      { name: "encumbrances", label: "Encumbrances / Title History", type: "textarea", span: 2 },
    ],
  },
  "Lease Deed": {
    title: "Lease Particulars",
    fields: [
      { name: "property_description", label: "Property Description", type: "textarea", required: true, span: 2 },
      { name: "lease_term", label: "Lease Term (months/years)", type: "text", required: true },
      { name: "rent", label: "Monthly Rent (Rs.)", type: "number", required: true },
      { name: "deposit", label: "Security Deposit (Rs.)", type: "number" },
      { name: "commencement", label: "Date of Commencement", type: "date", required: true },
      { name: "lock_in", label: "Lock-in Period", type: "text" },
    ],
  },
  "Rent Agreement": {
    title: "Tenancy Particulars",
    fields: [
      { name: "property_description", label: "Premises Description", type: "textarea", required: true, span: 2 },
      { name: "rent", label: "Monthly Rent (Rs.)", type: "number", required: true },
      { name: "deposit", label: "Security Deposit (Rs.)", type: "number" },
      { name: "term", label: "Term (months)", type: "number", required: true },
      { name: "commencement", label: "Commencement Date", type: "date", required: true },
    ],
  },
  "Gift Deed": {
    title: "Gift Particulars",
    fields: [
      { name: "property_description", label: "Property / Asset Gifted", type: "textarea", required: true, span: 2 },
      { name: "relationship", label: "Relationship between Donor and Donee", type: "text", required: true },
      { name: "consideration_clause", label: "Consideration (love & affection / nominal)", type: "text" },
    ],
  },
  "Power of Attorney": {
    title: "POA Particulars",
    fields: [
      { name: "poa_type", label: "Type of POA", type: "select", required: true, options: ["General", "Special", "Irrevocable"] },
      { name: "powers_granted", label: "Specific Powers Granted", type: "textarea", required: true, span: 2 },
      { name: "duration", label: "Duration / Validity", type: "text" },
    ],
  },
  "Employment Contract": {
    title: "Employment Particulars",
    fields: [
      { name: "designation", label: "Designation / Role", type: "text", required: true },
      { name: "ctc", label: "Annual CTC (Rs.)", type: "number", required: true },
      { name: "joining_date", label: "Date of Joining", type: "date", required: true },
      { name: "probation", label: "Probation Period", type: "text" },
      { name: "notice_period", label: "Notice Period", type: "text" },
      { name: "non_compete", label: "Non-Compete / Non-Solicit Required?", type: "select", options: ["Yes", "No"] },
    ],
  },
  NDA: {
    title: "NDA Particulars",
    fields: [
      { name: "purpose", label: "Purpose of Disclosure", type: "textarea", required: true, span: 2 },
      { name: "term", label: "Term of Confidentiality (years)", type: "number", required: true },
      { name: "mutual", label: "Mutual or One-Way?", type: "select", required: true, options: ["Mutual", "One-Way (Disclosing → Receiving)"] },
      { name: "governing_law", label: "Governing Law & Seat", type: "text" },
    ],
  },
  "Vendor / Services Agreement": {
    title: "Services Particulars",
    fields: [
      { name: "scope", label: "Scope of Services / Deliverables", type: "textarea", required: true, span: 2 },
      { name: "fees", label: "Fees / Payment Schedule", type: "textarea", required: true, span: 2 },
      { name: "term", label: "Term of Agreement", type: "text", required: true },
      { name: "termination", label: "Termination Clauses", type: "textarea", span: 2 },
    ],
  },
  "Shareholders Agreement": {
    title: "SHA Particulars",
    fields: [
      { name: "company", label: "Company Name & CIN", type: "text", required: true, span: 2 },
      { name: "shareholding", label: "Shareholding Pattern", type: "textarea", required: true, span: 2 },
      { name: "key_rights", label: "Key Rights (ROFR, tag-along, drag-along, board seats)", type: "textarea", span: 2 },
    ],
  },
  "Founders Agreement": {
    title: "Founders Particulars",
    fields: [
      { name: "company", label: "Entity / Proposed Entity", type: "text", required: true },
      { name: "founders", label: "Founders (names, roles, equity split)", type: "textarea", required: true, span: 2 },
      { name: "vesting", label: "Vesting Schedule", type: "text" },
      { name: "ip_assignment", label: "IP Assignment Terms", type: "textarea", span: 2 },
    ],
  },
  "Partnership Deed": {
    title: "Partnership Particulars",
    fields: [
      { name: "firm_name", label: "Name of Firm", type: "text", required: true },
      { name: "business", label: "Nature of Business", type: "text", required: true },
      { name: "capital", label: "Capital Contribution by each Partner", type: "textarea", required: true, span: 2 },
      { name: "profit_share", label: "Profit / Loss Sharing Ratio", type: "text", required: true, span: 2 },
    ],
  },
  "Legal Notice": {
    title: "Notice Particulars",
    fields: [
      { name: "subject", label: "Subject of Notice", type: "text", required: true, span: 2 },
      { name: "demand", label: "Demand / Action Required", type: "textarea", required: true, span: 2 },
      { name: "compliance_period", label: "Compliance Period (days)", type: "number", required: true },
      { name: "consequence", label: "Consequence on Non-Compliance", type: "textarea", span: 2 },
    ],
  },
  "Section 138 NI Act Notice": {
    title: "Cheque Particulars",
    fields: [
      { name: "cheque_no", label: "Cheque Number", type: "text", required: true },
      { name: "cheque_date", label: "Cheque Date", type: "date", required: true },
      { name: "cheque_amount", label: "Cheque Amount (Rs.)", type: "number", required: true },
      { name: "bank", label: "Drawee Bank & Branch", type: "text", required: true },
      { name: "dishonour_date", label: "Date of Dishonour", type: "date", required: true },
      { name: "return_reason", label: "Bank Return Memo Reason", type: "text", required: true, span: 2 },
    ],
  },
  "Recovery Notice": {
    title: "Recovery Particulars",
    fields: [
      { name: "principal", label: "Principal Amount Due (Rs.)", type: "number", required: true },
      { name: "interest", label: "Interest Rate / Computation", type: "text" },
      { name: "due_since", label: "Amount Due Since", type: "date", required: true },
    ],
  },
  "Cease & Desist Notice": {
    title: "Infringement Particulars",
    fields: [
      { name: "ip_right", label: "IP Right Asserted (Trademark / Copyright / Patent)", type: "text", required: true },
      { name: "registration_no", label: "Registration No. (if any)", type: "text" },
      { name: "infringing_act", label: "Infringing Act / Use Complained Of", type: "textarea", required: true, span: 2 },
    ],
  },
  "Trademark Opposition": {
    title: "Trademark Particulars",
    fields: [
      { name: "application_no", label: "Opposed Application No.", type: "text", required: true },
      { name: "class", label: "Class", type: "text", required: true },
      { name: "opponent_mark", label: "Opponent's Prior Mark / Registration", type: "text", required: true, span: 2 },
      { name: "grounds_opposition", label: "Grounds of Opposition (Sections 9, 11 etc.)", type: "textarea", span: 2 },
    ],
  },
  "Consumer Complaint": {
    title: "Consumer Dispute Particulars",
    fields: [
      { name: "purchase_date", label: "Date of Purchase / Service", type: "date", required: true },
      { name: "amount_paid", label: "Amount Paid (Rs.)", type: "number", required: true },
      { name: "deficiency", label: "Deficiency in Service / Defect in Goods", type: "textarea", required: true, span: 2 },
      { name: "compensation", label: "Compensation Claimed (Rs.)", type: "number" },
    ],
  },
  "RTI Application": {
    title: "RTI Particulars",
    fields: [
      { name: "public_authority", label: "Public Authority / PIO", type: "text", required: true, span: 2 },
      { name: "information_sought", label: "Information Sought (point-wise)", type: "textarea", required: true, span: 2 },
      { name: "period", label: "Period to which Information Relates", type: "text" },
    ],
  },
  "GST Appeal": {
    title: "GST Appeal Particulars",
    fields: [
      { name: "order_no", label: "Impugned Order Number & Date", type: "text", required: true, span: 2 },
      { name: "tax_demand", label: "Tax / Penalty / Interest Demanded (Rs.)", type: "number", required: true },
      { name: "appellate_authority", label: "Appellate Authority", type: "text", required: true },
    ],
  },
  "Domestic Violence Complaint": {
    title: "DV Particulars",
    fields: [
      { name: "relationship", label: "Domestic Relationship", type: "text", required: true },
      { name: "incidents", label: "Specific Incidents of Violence (dates & nature)", type: "textarea", required: true, span: 2 },
      { name: "reliefs_dv", label: "Reliefs under PWDVA (residence, protection, monetary, custody)", type: "textarea", required: true, span: 2 },
    ],
  },
};

export function getIntakeSchema(docType: string | null): IntakeSection[] {
  const extras = docType ? TYPE_EXTRAS[docType] : undefined;
  if (!extras) return COMMON_SECTIONS;
  // Insert specifics after parties+jurisdiction, before facts
  return [PARTY_SECTION, JURISDICTION_SECTION, extras, FACTS_SECTION, ANNEXURES_SECTION];
}

export function buildIntakePrompt(
  docCategory: string | null,
  docType: string | null,
  values: Record<string, string>,
): string {
  const lines: string[] = [];
  lines.push(`Please draft the following document in full, court-ready form.`);
  lines.push("");
  if (docCategory) lines.push(`**Category:** ${docCategory}`);
  if (docType) lines.push(`**Document Type:** ${docType}`);
  lines.push("");
  lines.push(`---`);
  lines.push("");
  const sections = getIntakeSchema(docType);
  for (const section of sections) {
    const sectionLines: string[] = [];
    for (const f of section.fields) {
      const v = (values[f.name] ?? "").trim();
      if (!v) continue;
      sectionLines.push(`- **${f.label}:** ${v}`);
    }
    if (sectionLines.length === 0) continue;
    lines.push(`### ${section.title}`);
    lines.push(...sectionLines);
    lines.push("");
  }
  lines.push(`---`);
  lines.push("");
  lines.push(
    `Produce the complete, professionally formatted draft inside a fenced markdown code block, ` +
      `following Indian drafting conventions. Use [bracketed placeholders] only where I have not ` +
      `supplied a value. After the draft, briefly list the statutory provisions invoked and any ` +
      `leading authorities relied upon.`,
  );
  return lines.join("\n");
}
