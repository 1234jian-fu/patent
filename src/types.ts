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
