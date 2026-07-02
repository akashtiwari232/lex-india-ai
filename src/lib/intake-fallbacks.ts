export type FollowupQuestion = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "number";
};

export function fallbackFollowups(docType?: string | null): FollowupQuestion[] {
  const lower = (docType ?? "").toLowerCase();
  const common: FollowupQuestion[] = [
    {
      name: "limitation_status",
      label: "Is the matter within limitation? If delayed, mention delay period and reason.",
      type: "textarea",
    },
    {
      name: "prior_proceedings",
      label: "Have there been any prior notices, orders, FIRs, appeals, or proceedings?",
      type: "textarea",
    },
    {
      name: "urgent_relief_reason",
      label: "Is any interim or urgent relief required? State the urgency and prejudice.",
      type: "textarea",
    },
  ];

  if (lower.includes("bail")) {
    return [
      { name: "custody_days", label: "Total days in custody / apprehension details", type: "text" },
      { name: "criminal_antecedents", label: "Any prior criminal antecedents? If yes, provide details.", type: "textarea" },
      { name: "investigation_status", label: "Status of investigation / charge-sheet and need for further custody", type: "textarea" },
      ...common.slice(0, 2),
    ];
  }

  if (lower.includes("writ") || lower.includes("pil") || lower.includes("habeas")) {
    return [
      { name: "state_action", label: "Identify the exact State action / inaction / order being challenged.", type: "textarea" },
      { name: "alternate_remedy", label: "Is any alternative statutory remedy available or already exhausted?", type: "textarea" },
      { name: "rights_violated", label: "Which fundamental / legal rights are violated and how?", type: "textarea" },
      ...common.slice(0, 2),
    ];
  }

  if (lower.includes("suit") || lower.includes("plaint") || lower.includes("written statement")) {
    return [
      { name: "valuation_court_fee", label: "Confirm suit valuation and court-fee computation.", type: "textarea" },
      { name: "cause_dates", label: "List the exact cause-of-action dates in chronological order.", type: "textarea" },
      { name: "documents_relied", label: "List documents, notices, replies, and admissions relied upon.", type: "textarea" },
      ...common.slice(0, 2),
    ];
  }

  if (lower.includes("agreement") || lower.includes("deed") || lower.includes("contract")) {
    return [
      { name: "commercial_terms", label: "State consideration, payment schedule, term, renewal and termination terms.", type: "textarea" },
      { name: "risk_allocation", label: "Mention indemnity, liability cap, warranties, confidentiality or non-compete needs.", type: "textarea" },
      { name: "dispute_resolution", label: "Preferred governing law, court jurisdiction, arbitration seat and language.", type: "textarea" },
    ];
  }

  return common;
}