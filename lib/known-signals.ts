// Central list of known signals for immune-balance
export const KNOWN_SIGNALS: Record<string, {
  name: string;
  technicalName?: string;
  explanation?: string;
  measurementMethod?: string;
}> = {
  crp: {
    name: "C-Reactive Protein (CRP)",
    technicalName: "CRP",
    explanation: "A marker of inflammation in the body.",
    measurementMethod: "Blood test",
  },
  wbc: {
    name: "White Blood Cell Count (WBC)",
    technicalName: "WBC",
    explanation: "Measures the number of white blood cells, which fight infection.",
    measurementMethod: "Blood test",
  },
  neutrophil: {
    name: "Neutrophil Count",
    technicalName: "Neutrophil",
    explanation: "A type of white blood cell important for fighting bacteria.",
    measurementMethod: "Blood test",
  },
  esr: {
    name: "Erythrocyte Sedimentation Rate (ESR)",
    technicalName: "ESR",
    explanation: "A test that indirectly measures inflammation.",
    measurementMethod: "Blood test",
  },
  ferritin: {
    name: "Ferritin",
    technicalName: "Ferritin",
    explanation: "A blood protein that contains iron; high levels can indicate inflammation.",
    measurementMethod: "Blood test",
  },
  il6: {
    name: "Interleukin-6 (IL-6)",
    technicalName: "IL-6",
    explanation: "A cytokine involved in inflammation and infection responses.",
    measurementMethod: "Blood test",
  },
  il10: {
    name: "Interleukin-10 (IL-10)",
    technicalName: "IL-10",
    explanation: "A cytokine with anti-inflammatory properties.",
    measurementMethod: "Blood test",
  },
  tgf: {
    name: "Transforming Growth Factor Beta (TGF-β)",
    technicalName: "TGF-β",
    explanation: "A cytokine involved in regulation of immune responses.",
    measurementMethod: "Blood test",
  },
  // Add more signals as needed
};
