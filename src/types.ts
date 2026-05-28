export type ProjectStage = "撰写中" | "查新中" | "定稿审核";

export interface PatentClaim {
  id: number;
  type: "independent" | "dependent";
  ref: number; // For dependent claims, points to claim id (e.g. 1)
  text: string;
}

export interface ComparativePatent {
  similarity: number;
  style: "danger" | "warning" | "info" | "success";
  pubNumber: string;
  title: string;
  comparison: {
    mine: string;
    theirs: string;
  }[];
}

export interface DifferencePoint {
  title: string;
  desc: string;
}

export interface PatentAnalysis {
  score: number;
  riskLevel: string;
  riskClass: string;
  differences: DifferencePoint[];
  comparativePatents: ComparativePatent[];
  claims: PatentClaim[];
}

export interface PatentProject {
  id: string;
  title: string;
  stage: ProjectStage;
  lastModified: string;
  disclosureText: string;
  databases: string[];
  startDate: string;
  endDate: string;
  analysis?: PatentAnalysis;
  specification?: {
    title: string;
    paragraphs: {
      num: string;
      section: string;
      text: string;
    }[];
  };
}

export interface AIReviewSuggestion {
  type: "warning" | "optimize";
  title: string;
  desc: string;
  original?: string;
  suggestion: string;
}
