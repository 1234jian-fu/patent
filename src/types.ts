export type AppTab = "dashboard" | "search" | "result" | "draft" | "export";

export type ProjectStage = "查新评估中" | "权利要求撰写中" | "排版审查中";

export interface PatentProject {
  id: string;
  title: string;
  stage: ProjectStage;
  risk: "低" | "中" | "高";
  updatedAt: string;
  summary: string;
}

export interface CrawledPatentDocument {
  url: string;
  source: string;
  title: string;
  excerpt: string;
  fetchedAt: string;
}

export interface PatentFeatureComparison {
  feature: string;
  evidence: string;
  noveltyJudgement: string;
}

export interface PatentReference {
  publicationNumber: string;
  title: string;
  source: string;
  relevanceScore: number;
  keyDisclosure: string;
  url?: string;
}

export interface EvidenceProfile {
  level: "strong" | "limited" | "none";
  confidenceScore: number;
  validSourceCount: number;
  attemptedSourceCount: number;
  featureCoverage: number;
  basis: string[];
  limitations: string[];
  calibrationNote: string;
}

export interface NoveltyAssessment {
  title?: string;
  evidenceStatus?: "evidence_based" | "limited_evidence" | "preliminary_no_evidence";
  evidenceProfile?: EvidenceProfile;
  riskScore: number;
  conclusion: string;
  noveltyPoints: string[];
  featureComparison: PatentFeatureComparison[];
  references: PatentReference[];
  claimSuggestions: string[];
  crawlerEvidence: CrawledPatentDocument[];
  disclosureOutline?: Record<string, string | string[]>;
  selfCheckRisks?: string[];
}

export interface DisclosureSection {
  heading: string;
  content: string;
}

export interface DisclosureDraft {
  title: string;
  abstractText: string;
  claims: string[];
  descriptionSections: DisclosureSection[];
  mermaidSystemDiagram: string;
  mermaidFlow: string;
  formatIssues: string[];
  markdown: string;
}

export interface DraftingSource {
  title: string;
  inventionDisclosure: string;
  dateRange: string;
}

export interface AssistantActionResult {
  title: string;
  content: string;
  risks?: string[];
}
