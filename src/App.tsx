import { useEffect, useState, type CSSProperties, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileSearch,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  PenLine,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import type { AppTab, DraftingSource, PatentProject } from "./types";
import type { AssistantActionResult, DisclosureDraft, NoveltyAssessment } from "./types";

const navItems: Array<{ id: AppTab; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "工作台", icon: LayoutDashboard },
  { id: "search", label: "创新性查询", icon: FileSearch },
  { id: "result", label: "查新结果", icon: GitCompareArrows },
  { id: "draft", label: "智能撰写", icon: PenLine },
  { id: "export", label: "格式导出", icon: FileCheck2 },
];

const projects: PatentProject[] = [
  {
    id: "p-001",
    title: "多模态传感器的低功耗融合方法",
    stage: "查新评估中",
    risk: "中",
    updatedAt: "今天 09:42",
    summary: "事件触发采样、边缘侧融合权重更新、功耗预算约束",
  },
  {
    id: "p-002",
    title: "基于边缘计算的电池热失控预警系统",
    stage: "权利要求撰写中",
    risk: "低",
    updatedAt: "昨天 18:10",
    summary: "温升趋势预测、阈值自适应、边缘告警联动",
  },
  {
    id: "p-003",
    title: "面向柔性机械臂的阻抗控制装置",
    stage: "排版审查中",
    risk: "高",
    updatedAt: "5月26日",
    summary: "阻抗参数在线辨识、多自由度补偿、末端稳定控制",
  },
];

const skills = [
  { name: "中国专利交底书", desc: "扫描项目、挖掘专利点、查新并生成 md/docx 交底书", icon: FileText },
  { name: "中国专利撰写规则", desc: "接入 Oscima2026/china-patent-drafter：独权、从权、摘要图、审查提示", icon: PenLine },
  { name: "交底书解析", desc: "提取技术问题、方案、效果与实施例", icon: BookOpenText },
  { name: "创新性查新", desc: "生成检索式、IPC 建议与风险分", icon: Search },
  { name: "对比文件分析", desc: "Top 5 对比文件逐项特征映射", icon: GitCompareArrows },
  { name: "权利要求生成", desc: "生成独权与从权，提示范围风险", icon: Scale },
  { name: "术语一致性", desc: "统一部件名称与技术术语", icon: ListChecks },
  { name: "格式合规", desc: "编号、摘要、附图标记与导出检查", icon: ClipboardCheck },
];

const references = [
  { id: "CN116842931A", title: "一种多传感器数据融合方法", score: 86, hit: "采集、滤波、融合策略相近" },
  { id: "CN114209778B", title: "低功耗边缘感知节点", score: 73, hit: "功耗调度逻辑部分重合" },
  { id: "US20240112991A1", title: "Sensor fusion for embedded devices", score: 68, hit: "模型更新机制相似" },
  { id: "EP4276132A1", title: "Adaptive sampling controller", score: 61, hit: "采样频率控制相近" },
  { id: "CN113558240A", title: "一种工业设备状态监测系统", score: 54, hit: "应用场景接近" },
];

const DEFAULT_API_TIMEOUT_MS = 180_000;
const SEARCH_API_TIMEOUT_MS = 240_000;
const GENERATION_API_TIMEOUT_MS = 300_000;
const HF_SPACE_ORIGIN = "https://jianf123-patentdraft.hf.space";

async function parseApiJson(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  const normalized = text.trim();
  if (normalized.startsWith("<!DOCTYPE") || normalized.startsWith("<html")) {
    throw new Error(`接口返回了 HTML 页面，HTTP ${response.status}；请求可能打到了 Hugging Face 外层页面。`);
  }
  throw new Error(normalized.slice(0, 240) || `接口返回了非 JSON 内容，HTTP ${response.status}`);
}

function getAbsoluteApiInput(input: RequestInfo | URL) {
  if (typeof input === "string" && input.startsWith("/api/")) {
    return `${HF_SPACE_ORIGIN}${input}`;
  }
  return input;
}

function shouldRetryWithSpace(input: RequestInfo | URL) {
  return typeof input === "string" && input.startsWith("/api/") && window.location.origin !== HF_SPACE_ORIGIN;
}

async function fetchApiJson(input: RequestInfo | URL, init?: RequestInit, timeoutMs = DEFAULT_API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response;
    try {
      response = await fetch(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      if (!shouldRetryWithSpace(input)) throw error;
      response = await fetch(getAbsoluteApiInput(input), { ...init, signal: controller.signal });
    }
    let data;
    try {
      data = await parseApiJson(response);
    } catch (error) {
      const shouldRetryAbsolute =
        error instanceof Error &&
        error.message.includes("HTML 页面") &&
        shouldRetryWithSpace(input);
      if (!shouldRetryAbsolute) throw error;
      response = await fetch(getAbsoluteApiInput(input), { ...init, signal: controller.signal });
      data = await parseApiJson(response);
    }
    return { response, data };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`请求超过 ${Math.round(timeoutMs / 1000)} 秒仍未返回。请先压缩 Word、删除大图后重试，或稍后再试 HF 免费 CPU。`);
    }
    if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) {
      throw new Error("网络请求失败：浏览器没有连上后端 API。请刷新页面重试；如果从本地预览页打开，请确认 HF Space 已启动且网络未拦截跨域请求。");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

const defaultAssessment: NoveltyAssessment = {
  title: "多模态传感器的低功耗融合方法",
  riskScore: 42,
  conclusion: "中低风险，可进入权利要求设计。主要差异点集中在事件触发采样与融合权重联动更新的组合关系。",
  noveltyPoints: [
    "根据异常事件强度动态调整传感器采样频率，而非固定周期采样。",
    "融合权重由边缘节点本地更新，降低云端依赖和通信开销。",
    "将功耗预算作为融合模型约束条件写入控制流程。",
  ],
  featureComparison: [
    {
      feature: "事件触发采样",
      evidence: "对比文件多公开固定周期采集或单阈值触发。",
      noveltyJudgement: "可作为独权中的触发条件与采样频率调整关系。",
    },
    {
      feature: "功耗预算约束融合权重",
      evidence: "现有方案通常把功耗管理和融合模型分开描述。",
      noveltyJudgement: "建议写成算法步骤之间的耦合关系。",
    },
  ],
  references: references.map((ref) => ({
    publicationNumber: ref.id,
    title: ref.title,
    source: ref.id.startsWith("CN") ? "CNIPA" : ref.id.startsWith("US") ? "USPTO" : "EPO",
    relevanceScore: ref.score,
    keyDisclosure: ref.hit,
  })),
  claimSuggestions: [
    "独权聚焦“异常事件强度-采样频率调整系数-融合权重更新”的闭环。",
    "从权补充环境变化率、历史误报率、功耗预算阈值的计算方式。",
    "说明书中补齐边缘节点本地更新的触发条件和参数范围。",
  ],
  crawlerEvidence: [],
  disclosureOutline: {
    background: "长期部署传感器节点的采集功耗与边缘处理约束。",
    technicalProblem: "如何在保证异常检测准确性的同时降低持续采样功耗。",
    solution: "事件触发采样、边缘侧融合权重更新、功耗预算约束联动。",
    beneficialEffects: "降低通信和采集能耗，提高部署稳定性。",
    protectedPoints: "异常强度与采样频率、功耗预算与融合权重之间的耦合控制。",
  },
  selfCheckRisks: ["异常事件强度需定义计算方式。", "功耗预算阈值需要给出参数范围或示例。"],
};

const defaultDraft: DisclosureDraft = {
  title: "多模态传感器的低功耗融合方法",
  abstractText:
    "本发明公开了一种多模态传感器的低功耗融合方法，通过异常事件强度驱动采样频率调整，并在边缘计算节点中结合功耗预算更新融合权重，从而在长期部署场景下兼顾检测稳定性与能耗控制。",
  claims: [
    "1. 一种多模态传感器的低功耗融合方法，其特征在于，包括：获取至少两类传感器的候选采样信号；基于异常事件强度确定采样频率调整系数；在边缘计算节点中根据功耗预算约束更新融合权重；输出融合后的设备状态判定结果。",
    "2. 根据权利要求1所述的方法，其中所述采样频率调整系数由环境变化率和历史误报率共同确定。",
  ],
  descriptionSections: [
    { heading: "一、现有技术及缺点", content: "现有多传感器融合节点通常采用固定周期采样，长期部署时容易产生冗余采集和通信功耗。" },
    { heading: "二、技术问题", content: "需要在保证异常事件识别准确性的同时降低多模态传感器节点的持续运行功耗。" },
    { heading: "三、技术方案详细阐述", content: "通过异常事件强度调整采样频率，并将功耗预算作为边缘侧融合权重更新的约束条件。" },
  ],
  mermaidSystemDiagram: "flowchart LR\n  A[多模态传感器] --> B[事件强度评估]\n  B --> C[采样频率控制]\n  C --> D[边缘融合节点]\n  D --> E[状态判定输出]",
  mermaidFlow: "flowchart TD\n  S[开始] --> A[采集候选信号]\n  A --> B[计算异常事件强度]\n  B --> C[调整采样频率]\n  C --> D[更新融合权重]\n  D --> E[输出判定结果]",
  formatIssues: ["需要补充异常事件强度的计算公式或判定规则。"],
  markdown: "",
};

const defaultDraftingSource: DraftingSource = {
  title: defaultAssessment.title || "多模态传感器的低功耗融合方法",
  inventionDisclosure:
    "本方案面向长期部署的多模态传感器节点，基于异常事件强度动态调整采样频率，并在边缘计算节点中根据功耗预算约束更新融合权重，输出设备状态判定结果。",
  dateRange: "2018-01-01 至今",
};

const disclosurePipeline = [
  "项目扫描",
  "专利点挖掘",
  "CNIPA 查新",
  "写法规则校准",
  "交底书预览",
  "mermaid 图示",
  "md/docx 交付",
  "自检与迭代",
];

const draftingRules = [
  "先抽取技术领域、缺陷、创新点、可保护点和缺失信息",
  "完整草案默认 1 项独权 + 6-12 项从权",
  "方法/算法类方案用 S1-S5 写可执行步骤",
  "摘要控制在约 300 字，写明问题、方案和效果",
  "摘要图按方法流程图、装置结构图或系统架构图生成",
  "输出专业审查提示和可进一步强化的保护点建议",
];

interface CnipaSearchResult {
  blocks: string[];
  hits: Array<{
    title?: string;
    pub_number?: string;
    pubNumber?: string;
    link?: string;
    abstract?: string;
  }>;
  evidenceText?: string;
  publicSources?: Array<{
    source: string;
    query: string;
    url: string;
    ok: boolean;
    title: string;
    links: string[];
    note?: string;
  }>;
  publicDocuments?: Array<{
    source: string;
    url: string;
    title: string;
    excerpt: string;
    fetchedAt: string;
  }>;
  coverageNote?: string;
  error?: string;
  hint?: string;
}

interface SearchTermCandidate {
  term: string;
  type: string;
  reason: string;
}

interface ImportedDisclosureSummary {
  fileName: string;
  charCount: number;
  paragraphCount: number;
  headings: string[];
  warnings?: string[];
}

function formatDateRange(startDate: string, endDate: string) {
  if (!startDate && !endDate) return "未限定";
  return `${startDate || "不限"} 至 ${endDate || "今"}`;
}

function isInvalidDateRange(startDate: string, endDate: string) {
  return Boolean(startDate && endDate && startDate > endDate);
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [assessment, setAssessment] = useState<NoveltyAssessment>(defaultAssessment);
  const [draft, setDraft] = useState<DisclosureDraft | null>(null);
  const [draftingSource, setDraftingSource] = useState<DraftingSource>(defaultDraftingSource);
  const activeTitle = navItems.find((item) => item.id === activeTab)?.label ?? "工作台";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setActiveTab("dashboard")}>
          <span className="brand-mark">PD</span>
          <span>
            <strong>PatentDraft</strong>
            <em>专利起草专家</em>
          </span>
        </button>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeTab === item.id ? "nav-item active" : "nav-item"}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <section className="sidebar-card">
          <span>当前流程</span>
          <strong>低功耗融合方法</strong>
          <div className="mini-progress">
            <i style={{ width: "72%" }} />
          </div>
          <em>查新评估完成 72%</em>
        </section>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span className="eyebrow">课题组专利工作流</span>
            <h1>{activeTitle}</h1>
          </div>
          <div className="top-actions">
            <button className="ghost-button" onClick={() => setActiveTab("draft")}>模板库</button>
            <button className="primary-button" onClick={() => setActiveTab("search")}>
              新建查新 <ArrowRight size={16} />
            </button>
          </div>
        </header>

        {activeTab === "dashboard" && <Dashboard onJump={setActiveTab} />}
        {activeTab === "search" && (
          <NoveltySearch
            onAssessment={(nextAssessment, source) => {
              setAssessment(nextAssessment);
              setDraftingSource(source);
              setDraft(null);
              setActiveTab("result");
            }}
          />
        )}
        {activeTab === "result" && <SearchResult assessment={assessment} onJump={setActiveTab} />}
        {activeTab === "draft" && <DraftWorkbench assessment={assessment} draft={draft} onDraft={setDraft} onJump={setActiveTab} source={draftingSource} />}
        {activeTab === "export" && <ExportReview assessment={assessment} draft={draft} />}
      </main>
    </div>
  );
}

function Dashboard({ onJump }: { onJump: (tab: AppTab) => void }) {
  return (
    <div className="page-grid">
      <section className="hero-panel">
        <div>
          <span className="eyebrow">AI Patent Workflow</span>
          <h2>从交底书到申请文件的五步闭环</h2>
          <p>把查新、对比、权利要求、说明书和格式导出统一在一个严谨的专利工作台里。</p>
        </div>
        <div className="hero-actions">
          <button className="primary-button light" onClick={() => onJump("search")}>
            开始创新性查询 <ChevronRight size={16} />
          </button>
          <button className="ghost-button dark" onClick={() => onJump("draft")}>
            直接撰写
          </button>
        </div>
      </section>

      <section className="metric-row">
        <Metric label="进行中项目" value="12" note="3 个待导师复核" />
        <Metric label="本周查新" value="28" note="平均风险分 41" />
        <Metric label="格式问题" value="17" note="附图标记占 52%" />
      </section>

      <section className="content-card">
        <div className="section-title">
          <h3>最近项目</h3>
          <button className="text-button" onClick={() => onJump("result")}>查看全部</button>
        </div>
        <div className="project-list">
          {projects.map((project) => (
            <div className="project-row" key={project.id}>
              <div>
                <strong>{project.title}</strong>
                <span>{project.summary}</span>
              </div>
              <Badge tone={project.risk === "高" ? "danger" : project.risk === "中" ? "warn" : "ok"}>
                {project.risk}风险
              </Badge>
              <span className="row-meta">{project.stage}</span>
              <button className="compact-button" onClick={() => onJump(project.stage === "查新评估中" ? "result" : "draft")}>
                继续
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="content-card">
        <div className="section-title">
          <h3>AI Skills</h3>
          <Badge>已注入 1.8.7</Badge>
        </div>
        <div className="injected-skill">
          <div>
            <span className="eyebrow">Injected Skill</span>
            <strong>中国专利双 Skill 写作引擎</strong>
            <p>融合 handsomestWei/patent-disclosure-skill 与 Oscima2026/china-patent-drafter-skill：覆盖专利点挖掘、查新证据、权利要求策略、摘要图、交底书成稿、自检和 DOCX 交付。</p>
          </div>
          <div className="pipeline-strip">
            {disclosurePipeline.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
        </div>
        <div className="rule-strip">
          {draftingRules.map((rule) => (
            <span key={rule}>{rule}</span>
          ))}
        </div>
        <div className="skill-grid">
          {skills.map((skill) => {
            const Icon = skill.icon;
            return (
              <div className="skill-card" key={skill.name}>
                <Icon size={18} />
                <strong>{skill.name}</strong>
                <span>{skill.desc}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function NoveltySearch({ onAssessment }: { onAssessment: (assessment: NoveltyAssessment, source: DraftingSource) => void }) {
  const [title, setTitle] = useState("多模态传感器的低功耗融合方法");
  const [inventionDisclosure, setInventionDisclosure] = useState(
    "本方案面向长期部署的多模态传感器节点，基于异常事件强度动态调整采样频率，并在边缘计算节点中根据功耗预算约束更新融合权重，输出设备状态判定结果。",
  );
  const [searchStartDate, setSearchStartDate] = useState("2018-01-01");
  const [searchEndDate, setSearchEndDate] = useState("");
  const [patentUrls, setPatentUrls] = useState("");
  const [manualEvidence, setManualEvidence] = useState("");
  const [isAssessing, setIsAssessing] = useState(false);
  const [isImportingDisclosure, setIsImportingDisclosure] = useState(false);
  const [isGeneratingBlocks, setIsGeneratingBlocks] = useState(false);
  const [isSearchingCnipa, setIsSearchingCnipa] = useState(false);
  const [searchBlocks, setSearchBlocks] = useState<string[]>([]);
  const [termCandidates, setTermCandidates] = useState<SearchTermCandidate[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<string[]>([]);
  const [cnipaResult, setCnipaResult] = useState<CnipaSearchResult | null>(null);
  const [importedDisclosure, setImportedDisclosure] = useState<ImportedDisclosureSummary | null>(null);
  const [error, setError] = useState("");
  const searchText = inventionDisclosure.trim() || title.trim();

  async function handleDisclosureFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportingDisclosure(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("document", file);
      const { response, data } = await fetchApiJson("/api/patent/import-disclosure", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(data?.error || "Word 文档解析失败");

      if (data.title) setTitle(data.title);
      if (data.inventionDisclosure) setInventionDisclosure(data.inventionDisclosure);
      setImportedDisclosure({
        fileName: data.fileName || file.name,
        charCount: data.summary?.charCount || String(data.inventionDisclosure || "").length,
        paragraphCount: data.summary?.paragraphCount || 0,
        headings: Array.isArray(data.summary?.headings) ? data.summary.headings : [],
        warnings: Array.isArray(data.warnings) ? data.warnings : [],
      });
      setSearchBlocks([]);
      setTermCandidates([]);
      setSelectedTerms([]);
      setCnipaResult(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setIsImportingDisclosure(false);
      event.target.value = "";
    }
  }

  async function generateSearchBlocks() {
    if (isInvalidDateRange(searchStartDate, searchEndDate)) {
      setError("日期范围不合法：开始日期不能晚于结束日期。");
      return;
    }

    setIsGeneratingBlocks(true);
    setError("");

    try {
      const { response, data } = await fetchApiJson("/api/patent/search-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          inventionDisclosure: searchText,
          dateRange: formatDateRange(searchStartDate, searchEndDate),
        }),
      }, SEARCH_API_TIMEOUT_MS);
      if (!response.ok) throw new Error(data?.error || "检索词生成失败");
      const nextBlocks = Array.isArray(data.blocks) ? data.blocks : [];
      const nextCandidates = Array.isArray(data.termCandidates) ? data.termCandidates : [];
      setSearchBlocks(nextBlocks);
      setTermCandidates(nextCandidates);
      setSelectedTerms(nextCandidates.length ? nextCandidates.slice(0, 8).map((item: SearchTermCandidate) => item.term) : nextBlocks);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setIsGeneratingBlocks(false);
    }
  }

  async function runCnipaSearch() {
    if (isInvalidDateRange(searchStartDate, searchEndDate)) {
      setError("日期范围不合法：开始日期不能晚于结束日期。");
      return;
    }

    setIsSearchingCnipa(true);
    setError("");

    try {
      let blocks = selectedTerms.length > 0 ? selectedTerms : searchBlocks;
      if (blocks.length === 0) {
        const { response: blockResponse, data: blockData } = await fetchApiJson("/api/patent/search-blocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            inventionDisclosure: searchText,
            dateRange: formatDateRange(searchStartDate, searchEndDate),
          }),
        }, SEARCH_API_TIMEOUT_MS);
        if (!blockResponse.ok) throw new Error(blockData?.error || "检索词生成失败");
        const nextCandidates = Array.isArray(blockData.termCandidates) ? blockData.termCandidates : [];
        blocks = nextCandidates.length ? nextCandidates.slice(0, 8).map((item: SearchTermCandidate) => item.term) : Array.isArray(blockData.blocks) ? blockData.blocks : [];
        setSearchBlocks(blocks);
        setTermCandidates(nextCandidates);
        setSelectedTerms(blocks);
      }

      if (blocks.length === 0) throw new Error("未能生成可用的国知局检索词");

      const { response, data } = await fetchApiJson("/api/patent/public-patent-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords: blocks,
          dateRange: formatDateRange(searchStartDate, searchEndDate),
        }),
      }, SEARCH_API_TIMEOUT_MS);
      if (!response.ok) {
        setCnipaResult(data);
        throw new Error(data?.hint || data?.error || "国知局查新失败");
      }
      setCnipaResult(data);
      if (data.evidenceText) {
        setManualEvidence((current) => [current, data.evidenceText].filter(Boolean).join("\n\n"));
      }
      const urls = Array.isArray(data.hits)
        ? data.hits.map((hit: { link?: string }) => hit.link).filter(Boolean)
        : [];
      if (urls.length > 0) {
        setPatentUrls((current) => Array.from(new Set([...current.split(/\r?\n/).filter(Boolean), ...urls])).join("\n"));
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setIsSearchingCnipa(false);
    }
  }

  async function resolveSearchTerms() {
    let blocks = selectedTerms.length > 0 ? selectedTerms : searchBlocks;
    if (blocks.length > 0) return blocks;

    const { response, data } = await fetchApiJson("/api/patent/search-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        inventionDisclosure: searchText,
        dateRange: formatDateRange(searchStartDate, searchEndDate),
      }),
    }, SEARCH_API_TIMEOUT_MS);
    if (!response.ok) throw new Error(data?.error || "检索词生成失败");

    const nextCandidates = Array.isArray(data.termCandidates) ? data.termCandidates : [];
    blocks = nextCandidates.length
      ? nextCandidates.slice(0, 8).map((item: SearchTermCandidate) => item.term)
      : Array.isArray(data.blocks) ? data.blocks : [];
    setSearchBlocks(blocks);
    setTermCandidates(nextCandidates);
    setSelectedTerms(blocks);
    return blocks;
  }

  async function crawlPublicEvidenceIfNeeded() {
    const currentUrls = patentUrls
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean);
    const hasEvidence = manualEvidence.trim().length >= 20 || patentUrls.split(/\r?\n/).some((url) => url.trim());
    if (hasEvidence) return { evidence: manualEvidence, urls: currentUrls };

    const blocks = await resolveSearchTerms();
    if (blocks.length === 0) return { evidence: manualEvidence, urls: currentUrls };

    const { response, data } = await fetchApiJson("/api/patent/public-patent-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords: blocks,
        dateRange: formatDateRange(searchStartDate, searchEndDate),
      }),
    }, SEARCH_API_TIMEOUT_MS);
    if (!response.ok) throw new Error(data?.hint || data?.error || "多源公开抓取失败");

    setCnipaResult(data);
    const nextEvidence = [manualEvidence, data.evidenceText].filter(Boolean).join("\n\n");
    if (data.evidenceText) setManualEvidence(nextEvidence);
    const urlsFromHits = Array.isArray(data.hits)
      ? data.hits.map((hit: { link?: string }) => hit.link).filter(Boolean)
      : [];
    const urlsFromDocuments = Array.isArray(data.publicDocuments)
      ? data.publicDocuments.map((doc: { url?: string }) => doc.url).filter(Boolean)
      : [];
    const urls = Array.from(new Set([...currentUrls, ...urlsFromHits, ...urlsFromDocuments]));
    if (urls.length > 0) {
      setPatentUrls(urls.join("\n"));
    }
    return { evidence: nextEvidence, urls };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isInvalidDateRange(searchStartDate, searchEndDate)) {
      setError("日期范围不合法：开始日期不能晚于结束日期。");
      return;
    }

    setIsAssessing(true);
    setError("");

    try {
      const evidenceForAssessment = await crawlPublicEvidenceIfNeeded();
      const { response, data } = await fetchApiJson("/api/patent/novelty-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          inventionDisclosure: searchText,
          dateRange: formatDateRange(searchStartDate, searchEndDate),
          patentUrls: evidenceForAssessment.urls,
          manualEvidence: evidenceForAssessment.evidence,
        }),
      }, GENERATION_API_TIMEOUT_MS);
      if (!response.ok) {
        throw new Error(data?.error || "创新性评估失败");
      }

      onAssessment(data, {
        title,
        inventionDisclosure: searchText,
        dateRange: formatDateRange(searchStartDate, searchEndDate),
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setIsAssessing(false);
    }
  }

  function toggleSearchTerm(term: string) {
    setSelectedTerms((current) => (
      current.includes(term)
        ? current.filter((item) => item !== term)
        : [...current, term].slice(0, 8)
    ));
  }

  return (
    <form className="two-column" onSubmit={handleSubmit}>
      <section className="content-card">
        <div className="stepper">
          {["输入请求", "抓取对比文件", "证据比对", "创新性输出"].map((step, index) => (
            <div className={index === 0 ? "step active" : "step"} key={step}>
              <CircleDot size={16} />
              {step}
            </div>
          ))}
        </div>

        <div className="upload-zone">
          <UploadCloud size={42} />
          <strong>Word 辅助生成词条，词条主导多源查新</strong>
          <p>上传 .docx 后系统会提取标题、技术方案和候选词条；后续爬取端以用户确认的词条为主，Word 文件只作为词条生成和技术背景的辅助材料。</p>
          <div className="upload-actions">
            <label className="file-upload-button">
              <input accept=".docx" disabled={isImportingDisclosure} onChange={handleDisclosureFileUpload} type="file" />
              {isImportingDisclosure ? "正在解析 Word..." : "选择 Word 文档"}
            </label>
            <span>{isImportingDisclosure ? "大文件或含大量图片时可能需要 10-60 秒" : "支持 .docx；旧版 .doc 请先另存为 .docx"}</span>
          </div>
          {importedDisclosure && (
            <div className="import-summary">
              <strong>{importedDisclosure.fileName}</strong>
              <span>{importedDisclosure.charCount} 字 · {importedDisclosure.paragraphCount} 段 · 已自动填入标题和技术方案</span>
              {importedDisclosure.headings.length > 0 && <em>识别章节：{importedDisclosure.headings.slice(0, 4).join(" / ")}</em>}
              {importedDisclosure.warnings && importedDisclosure.warnings.length > 0 && <em>解析提示：{importedDisclosure.warnings[0]}</em>}
            </div>
          )}
        </div>

        <div className="form-grid">
          <label>
            中国专利请求名称
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="date-field">
            时间跨度
            <div className="date-range-control">
              <div className="date-input-cell">
                <span>开始</span>
                <input
                  aria-label="检索开始日期"
                  type="date"
                  value={searchStartDate}
                  onChange={(event) => setSearchStartDate(event.target.value)}
                />
              </div>
              <div className="date-input-cell">
                <span>结束</span>
                <input
                  aria-label="检索结束日期，留空表示至今"
                  type="date"
                  value={searchEndDate}
                  onChange={(event) => setSearchEndDate(event.target.value)}
                />
              </div>
            </div>
            <small>{formatDateRange(searchStartDate, searchEndDate)}</small>
          </label>
          <label className="span-all">
            对比文件来源
            <div className="chip-row">
              <span>CNIPA 中国专利公布公告</span>
              <span>Google Patents</span>
              <span>EPO</span>
              <span>WIPO</span>
            </div>
          </label>
          <div className="span-all cnipa-tool">
            <div>
              <strong>DeepSeek 词条提取 + 多源公开抓取</strong>
              <p>爬取端以关键词/词条为核心输入，Word 文件只辅助产生词条和背景。系统会用选中的词条同时生成 CNIPA、Google Patents、EPO、WIPO 的公开检索入口并尝试抓取页面证据。</p>
            </div>
            <div className="cnipa-actions">
              <button className="ghost-button" disabled={isGeneratingBlocks} onClick={generateSearchBlocks} type="button">
                {isGeneratingBlocks ? "提取中..." : "提取候选词条"}
              </button>
              <button className="ghost-button" disabled={isSearchingCnipa || (termCandidates.length > 0 && selectedTerms.length === 0)} onClick={runCnipaSearch} type="button">
                {isSearchingCnipa ? "抓取中..." : `用 ${selectedTerms.length || searchBlocks.length || 0} 个词条多源抓取`}
              </button>
            </div>
            {termCandidates.length > 0 && (
              <div className="term-candidate-panel">
                <div className="term-candidate-head">
                  <strong>候选查新词条</strong>
                  <span>最多选择 8 个；词条均来自上传题目或正文</span>
                </div>
                <div className="term-candidate-grid">
                  {termCandidates.map((item) => {
                    const selected = selectedTerms.includes(item.term);
                    return (
                      <button className={selected ? "term-chip selected" : "term-chip"} key={`${item.type}-${item.term}`} onClick={() => toggleSearchTerm(item.term)} type="button">
                        <span>{item.type}</span>
                        <strong>{item.term}</strong>
                        <em>{item.reason}</em>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {termCandidates.length === 0 && searchBlocks.length > 0 && (
              <div className="search-blocks">
                {searchBlocks.map((block) => (
                  <span key={block}>{block}</span>
                ))}
              </div>
            )}
            {cnipaResult && (
              <div className="cnipa-result">
                <strong>
                  CNIPA {cnipaResult.hits?.length || 0} 条 · 公开源 {cnipaResult.publicSources?.length || 0} 个入口 · 详情页 {cnipaResult.publicDocuments?.length || 0} 个
                </strong>
                <span>{cnipaResult.error || cnipaResult.hint || cnipaResult.coverageNote || "检索结果已合并到证据区，可继续生成创新性评估。"}</span>
                {cnipaResult.publicSources && cnipaResult.publicSources.length > 0 && (
                  <div className="public-source-grid">
                    {cnipaResult.publicSources.slice(0, 9).map((item) => (
                      <a href={item.url} key={`${item.source}-${item.query}`} target="_blank" rel="noreferrer">
                        <strong>{item.source}</strong>
                        <span>{item.query}</span>
                        <em>{item.ok ? "已抓取页面" : "需浏览器打开"}</em>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <label className="span-all">
            待申请技术方案
            <textarea value={inventionDisclosure} onChange={(event) => setInventionDisclosure(event.target.value)} />
          </label>
          <label className="span-all">
            对比文件 URL，每行一个
            <textarea
              placeholder="例如：https://patents.google.com/patent/CNXXXXXXXXA/zh"
              value={patentUrls}
              onChange={(event) => setPatentUrls(event.target.value)}
            />
          </label>
          <label className="span-all">
            人工补充证据或检索摘录
            <textarea
              placeholder="可粘贴国知局检索结果、摘要、权利要求片段或导师给出的现有技术材料。"
              value={manualEvidence}
              onChange={(event) => setManualEvidence(event.target.value)}
            />
          </label>
        </div>

        {error && <div className="form-error">{error}</div>}

        <button className="primary-button full" disabled={isAssessing} type="submit">
          {isAssessing ? "正在抓取并评估..." : "生成创新性评估"} <Sparkles size={16} />
        </button>
      </section>

      <aside className="insight-panel">
        <h3>中国专利写作 Skill</h3>
        <div className="skill-source">
          <span>证据优先级</span>
          <strong>先证据，再结论，再撰写</strong>
          <p>对比文件正文会作为证据材料传给 DeepSeek，创新点必须对应到具体差异特征。</p>
        </div>
        <Insight title="核心技术问题" text="现有融合节点持续采集导致功耗升高，难以满足长期部署场景。" />
        <Insight title="关键技术特征" text="事件触发采样、分层特征融合、边缘侧动态阈值更新。" />
        <Insight title="输出内容" text="风险分、创新点、特征对比表、Top 对比文件、权利要求策略、摘要图建议和审查提示。" />
      </aside>
    </form>
  );
}

function SearchResult({ assessment, onJump }: { assessment: NoveltyAssessment; onJump: (tab: AppTab) => void }) {
  const [reportError, setReportError] = useState("");
  const [isExportingReport, setIsExportingReport] = useState(false);
  const score = Math.max(0, Math.min(100, Number(assessment.riskScore) || 0));
  const riskTone = score >= 70 ? "danger" : score >= 45 ? "warn" : "ok";
  const riskLabel = score >= 70 ? "高风险" : score >= 45 ? "中风险" : "风险可控";
  const riskTitle = score >= 70 ? "创新性风险较高，需重构差异特征" : score >= 45 ? "中等风险，需补强技术效果" : "风险可控，可进入撰写";
  const nextStep =
    score >= 70
      ? "建议先补充检索、收窄独权核心特征，并寻找可验证的结构或步骤差异。"
      : score >= 45
        ? "建议把差异特征写成步骤间的耦合关系，同时补足参数范围、触发条件和技术效果。"
        : "可进入权利要求设计，优先把已验证差异写入独权，再用从权覆盖变形方案。";
  const sourceCount = assessment.references.length + assessment.crawlerEvidence.length;
  const isEvidenceBased = assessment.evidenceStatus !== "preliminary_no_evidence" && sourceCount > 0;

  async function handleDownloadReport() {
    setIsExportingReport(true);
    setReportError("");

    try {
      const response = await fetch(getAbsoluteApiInput("/api/patent/export-novelty-report-docx"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "查新报告 DOCX 导出失败");
      }
      const blob = await response.blob();
      downloadBlob(`${sanitizeFilename(assessment.title || "查新报告")}_创新性查新报告_${getTimestamp()}.docx`, blob);
    } catch (nextError) {
      setReportError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setIsExportingReport(false);
    }
  }

  return (
    <div className="result-layout">
      <section className="score-card">
        <span className="eyebrow">Novelty Risk</span>
        <div className="score-ring" style={{ "--score": `${score}%` } as CSSProperties}>
          {score}
        </div>
        <Badge tone={isEvidenceBased ? riskTone : "warn"}>{isEvidenceBased ? riskLabel : "证据不足"}</Badge>
        <h2>{isEvidenceBased ? riskTitle : "初步自评，不能作为创新性结论"}</h2>
        <p>{assessment.conclusion}</p>
        {!isEvidenceBased && (
          <div className="form-error">
            当前没有可用的对比文件正文证据。系统会优先用词条自动跑 CNIPA、Google Patents、EPO、WIPO 多源公开抓取；若公开页面仍抓不到正文，请补充对比文件链接、摘要或权利要求摘录。
          </div>
        )}
        <div className="score-detail">
          <strong>下一步处理建议</strong>
          <span>{nextStep}</span>
        </div>
        <div className="score-stats">
          <span><strong>{assessment.noveltyPoints.length}</strong>创新点</span>
          <span><strong>{assessment.featureComparison.length}</strong>特征对比</span>
          <span><strong>{sourceCount}</strong>证据来源</span>
        </div>
        <button className="primary-button" onClick={() => onJump("draft")}>
          {isEvidenceBased ? "进入智能撰写" : "基于初步结论撰写"} <ArrowRight size={16} />
        </button>
        <button className="ghost-button" disabled={isExportingReport} onClick={handleDownloadReport}>
          <Download size={16} /> {isExportingReport ? "正在生成..." : "下载 Word 查新报告"}
        </button>
        {reportError && <div className="form-error">{reportError}</div>}
      </section>

      <section className="content-card">
        <div className="section-title">
          <h3>{isEvidenceBased ? "有证据支撑的创新点" : "待验证候选创新点"}</h3>
          <Badge tone={riskTone}>{assessment.noveltyPoints.length} 项</Badge>
        </div>
        {assessment.noveltyPoints.length > 0 ? (
          <div className="novelty-list">
            {assessment.noveltyPoints.map((point, index) => (
            <div className="novelty-card" key={point}>
              <div className="novelty-index">{String(index + 1).padStart(2, "0")}</div>
              <div>
                <strong>差异点 {String(index + 1).padStart(2, "0")}</strong>
                <p>{point}</p>
                <span>写作落点：优先转化为独权限定关系或从权补强条件。</span>
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">暂无可标记为“有证据支撑”的创新点。请补充对比文件后重新评估。</div>
        )}
      </section>

      <section className="content-card wide">
        <div className="section-title">
          <h3>Top 对比文件</h3>
          <Badge>{assessment.references.length} 份</Badge>
        </div>
        {assessment.references.length > 0 ? (
          <div className="reference-grid">
            {assessment.references.map((ref) => (
            <article className="reference-card" key={`${ref.publicationNumber}-${ref.title}`}>
              <div className="reference-head">
                <strong>{ref.publicationNumber || "未识别公开号"}</strong>
                <Badge tone={ref.relevanceScore >= 75 ? "danger" : ref.relevanceScore >= 55 ? "warn" : "ok"}>
                  {ref.relevanceScore || 0}%
                </Badge>
              </div>
              <h4>{ref.title || "未识别标题"}</h4>
              <div className="reference-meta">
                <span>{ref.source || "未知来源"}</span>
                {ref.url && <a href={ref.url} target="_blank" rel="noreferrer">打开原文</a>}
              </div>
              <p>{ref.keyDisclosure || "暂无关键公开内容摘要。"}</p>
              <div className="bar">
                <i style={{ width: `${Math.max(0, Math.min(100, ref.relevanceScore || 0))}%` }} />
              </div>
            </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">没有对比文件。创新性结论需要 CNIPA/Google Patents/EPO/WIPO 或人工粘贴的公开文献证据。</div>
        )}
      </section>

      <section className="content-card wide">
        <div className="section-title">
          <h3>特征 1:1 对比</h3>
          <Badge tone={riskTone}>证据链</Badge>
        </div>
        {assessment.featureComparison.length > 0 ? (
          <div className="feature-table">
            {assessment.featureComparison.map((item) => (
            <div className="feature-row" key={item.feature}>
              <div>
                <span className="table-label">待保护特征</span>
                <strong>{item.feature}</strong>
              </div>
              <div>
                <span className="table-label">对比证据</span>
                <p>{item.evidence}</p>
              </div>
              <div>
                <span className="table-label">创新性判断</span>
                <p>{item.noveltyJudgement}</p>
              </div>
            </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">暂无 1:1 特征对比。请先补充至少 1 份对比文件证据。</div>
        )}
      </section>

      <section className="content-card wide">
        <div className="section-title">
          <h3>权利要求补强建议</h3>
          <Badge>写作入口</Badge>
        </div>
        <div className="suggestion-list">
          {assessment.claimSuggestions.map((suggestion, index) => (
            <div className="suggestion-item" key={suggestion}>
              <span className="suggestion-index">{index + 1}</span>
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      </section>

      {assessment.disclosureOutline && (
        <section className="content-card wide">
          <div className="section-title">
            <h3>交底书预览大纲</h3>
            <Badge>Skill Step 6-7</Badge>
          </div>
          <div className="outline-grid">
            {Object.entries(assessment.disclosureOutline).map(([key, value]) => (
              <div className="outline-card" key={key}>
                <strong>{outlineLabels[key] || key}</strong>
                <p>{Array.isArray(value) ? value.join("；") : value}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {assessment.selfCheckRisks && assessment.selfCheckRisks.length > 0 && (
        <section className="content-card wide">
          <div className="section-title">
            <h3>内部自检风险</h3>
            <Badge tone="warn">不写入正文</Badge>
          </div>
          <div className="suggestion-list">
            {assessment.selfCheckRisks.map((risk) => (
              <div className="suggestion-item" key={risk}>
                <AlertTriangle size={16} />
                <span>{risk}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {assessment.crawlerEvidence.length > 0 && (
        <section className="content-card wide">
          <div className="section-title">
            <h3>网页抓取证据</h3>
            <Badge>{assessment.crawlerEvidence.length} 个来源</Badge>
          </div>
          <div className="evidence-grid">
            {assessment.crawlerEvidence.map((doc) => (
              <div className="evidence-card" key={doc.url}>
                <strong>{doc.title}</strong>
                <span>{doc.source} · {new Date(doc.fetchedAt).toLocaleString()}</span>
                <p>{doc.excerpt.slice(0, 360)}...</p>
                <a href={doc.url} target="_blank" rel="noreferrer">查看来源</a>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const outlineLabels: Record<string, string> = {
  background: "1.1 现有技术背景",
  technicalProblem: "二、技术问题",
  solution: "三、技术方案",
  beneficialEffects: "四、有益效果",
  protectedPoints: "五、技术关键点和欲保护点",
};

function DraftWorkbench({
  assessment,
  draft,
  onDraft,
  source,
  onJump,
}: {
  assessment: NoveltyAssessment;
  draft: DisclosureDraft | null;
  onDraft: (draft: DisclosureDraft) => void;
  source: DraftingSource;
  onJump: (tab: AppTab) => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [assistantResult, setAssistantResult] = useState<AssistantActionResult | null>(null);
  const [assistantLoading, setAssistantLoading] = useState("");
  const [activeSection, setActiveSection] = useState("basis");
  const [error, setError] = useState("");
  const activeDraft = draft || defaultDraft;
  const isRealDraft = Boolean(draft);

  function findSectionContent(keyword: string, fallback: ReactNode) {
    const matched = activeDraft.descriptionSections.find((section) => section.heading.includes(keyword) || keyword.includes(section.heading.replace(/[一二三四五六七八九十、，,]/g, "")));
    return matched?.content || fallback;
  }

  async function generateDraft() {
    setIsGenerating(true);
    setError("");

    try {
      const { response, data } = await fetchApiJson("/api/patent/draft-disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment, inventionDisclosure: source.inventionDisclosure }),
      }, GENERATION_API_TIMEOUT_MS);
      if (!response.ok) throw new Error(data?.error || "交底书生成失败");
      onDraft(data);
      setActiveSection("claims");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setIsGenerating(false);
    }
  }

  async function runAssistantAction(action: string) {
    setAssistantLoading(action);
    setError("");

    try {
      const { response, data } = await fetchApiJson("/api/patent/assistant-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          assessment,
          draft: activeDraft,
          source,
          currentSection: currentSection?.label || "未选择章节",
        }),
      }, GENERATION_API_TIMEOUT_MS);
      if (!response.ok) throw new Error(data?.error || "AI 助手动作失败");
      setAssistantResult(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setAssistantLoading("");
    }
  }

  const transformSteps = [
    ["输入", "原始技术方案、查新结论、对比文件证据"],
    ["抽取", "技术问题、核心创新点、可保护特征"],
    ["撰写", "权利要求优先，再反推说明书支撑"],
    ["输出", "章节草稿、AI 审查、MD/DOCX 交付"],
  ];

  const sections = [
    {
      id: "basis",
      label: "输入依据",
      status: "已同步",
      sourceLabel: "查新结果 + 原始技术披露",
      description: "说明这一页吃什么输入，以及如何转成专利撰写任务。",
      content: (
        <>
          <div className="draft-source-grid">
            <div>
              <span>原始技术方案</span>
              <p>{source.inventionDisclosure}</p>
            </div>
            <div>
              <span>查新结论</span>
              <p>{assessment.conclusion}</p>
            </div>
            <div>
              <span>检索日期范围</span>
              <p>{source.dateRange}</p>
            </div>
            <div>
              <span>证据来源</span>
              <p>{assessment.references.length} 份对比文件，{assessment.crawlerEvidence.length} 个网页抓取来源。</p>
            </div>
          </div>
          <div className="draft-rule-panel">
            <strong>转换规则</strong>
            <p>先用查新结论锁定核心差异特征，再按 china-patent-drafter 规则生成权利要求策略；说明书必须反向支撑每个权利要求术语，缺失事实使用“需补充”或谨慎实施例表达。</p>
          </div>
        </>
      ),
    },
    {
      id: "strategy",
      label: "权利要求策略",
      status: assessment.claimSuggestions.length ? "可撰写" : "待补充",
      sourceLabel: "创新点 + 特征对比 + 权利要求建议",
      description: "决定独权范围、从权层级和需要补强的保护点。",
      content: (
        <div className="draft-stack">
          {assessment.claimSuggestions.map((item, index) => (
            <div className="strategy-card" key={item}>
              <span>策略 {index + 1}</span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "claims",
      label: "权利要求书",
      status: isRealDraft ? "已生成" : "示例预览",
      sourceLabel: "权利要求策略 → 独权 + 从权",
      description: "Claim 1 覆盖核心发明构思，从权逐级限定变量、触发条件和应用场景。",
      content: (
        <>
          {activeDraft.claims.map((claim, index) => (
            <div className="claim-block" key={claim}>
              <span>{index === 0 ? "独立权利要求" : `从属权利要求 ${index + 1}`}</span>
              <p>{claim}</p>
            </div>
          ))}
        </>
      ),
    },
    {
      id: "abstract",
      label: "摘要",
      status: activeDraft.abstractText.length <= 300 ? "合规" : "需压缩",
      sourceLabel: "技术问题 + 核心方案 + 技术效果",
      description: "摘要控制在约 300 字内，不能写授权结论、广告语或未提供实验数据。",
      content: (
        <>
          <p>{activeDraft.abstractText}</p>
          <div className="draft-check-grid">
            <span>摘要字数：{activeDraft.abstractText.length} 字</span>
            <span>建议范围：300 字以内</span>
            <span>状态：{activeDraft.abstractText.length <= 300 ? "符合" : "需压缩"}</span>
          </div>
        </>
      ),
    },
    {
      id: "background",
      label: "背景技术",
      status: "需支撑问题",
      sourceLabel: "查新证据 + 现有缺陷",
      description: "只写现有技术客观缺陷，不夸大，也不把本方案效果提前写进去。",
      content: <p>{findSectionContent("现有技术", "现有多传感器融合节点通常采用固定周期采样，长期部署时容易产生冗余采集和通信功耗。")}</p>,
    },
    {
      id: "solution",
      label: "发明内容",
      status: "需闭环",
      sourceLabel: "技术问题 → 技术方案 → 有益效果",
      description: "形成中国专利说明书最关键的闭环，后续权利要求必须能被这里支撑。",
      content: (
        <div className="draft-source-grid">
          <div>
            <span>技术问题</span>
            <p>{findSectionContent("技术问题", assessment.disclosureOutline?.technicalProblem || "需要补充技术问题。")}</p>
          </div>
          <div>
            <span>技术方案</span>
            <p>{findSectionContent("技术方案", assessment.disclosureOutline?.solution || "需要补充技术方案。")}</p>
          </div>
          <div>
            <span>有益效果</span>
            <p>{findSectionContent("有益效果", assessment.disclosureOutline?.beneficialEffects || "需要补充有益效果。")}</p>
          </div>
          <div>
            <span>欲保护点</span>
            <p>{assessment.disclosureOutline?.protectedPoints || "需要补充欲保护点。"}</p>
          </div>
        </div>
      ),
    },
    {
      id: "embodiment",
      label: "具体实施方式",
      status: assessment.selfCheckRisks?.length ? "待补材料" : "可细化",
      sourceLabel: "步骤 S1-S5 + 参数/规则/输出",
      description: "把方案写成可实施步骤，补齐触发条件、参数范围、更新规则和输出指标。",
      content: (
        <>
          <p>{findSectionContent("实施例", "建议补充异常事件强度计算方式、采样频率调整系数、功耗预算阈值、融合权重更新规则和设备状态输出示例。")}</p>
          <div className="draft-check-grid">
            {(assessment.selfCheckRisks?.length ? assessment.selfCheckRisks : ["需补充可执行步骤和参数范围。"]).map((risk) => <span key={risk}>{risk}</span>)}
          </div>
        </>
      ),
    },
    {
      id: "drawings",
      label: "附图说明",
      status: activeDraft.mermaidFlow || activeDraft.mermaidSystemDiagram ? "已生成图源" : "待生成",
      sourceLabel: "方法流程图 / 系统架构图",
      description: "方法类优先用流程图，图中步骤编号应与权利要求和说明书一致。",
      content: (
        <>
          <p>建议摘要图采用方法流程图，覆盖 S1 采集候选信号、S2 计算异常事件强度、S3 调整采样频率、S4 更新融合权重、S5 输出状态判定结果。</p>
          <pre className="mermaid-preview">{activeDraft.mermaidFlow || activeDraft.mermaidSystemDiagram || "暂无 Mermaid 图示源码。"}</pre>
        </>
      ),
    },
    {
      id: "review",
      label: "自检与导出",
      status: activeDraft.formatIssues?.length ? "需复核" : "可导出",
      sourceLabel: "格式问题 + DOCX 交付",
      description: "正式交付前检查术语、附图标记、摘要字数、权利要求支撑和缺失信息。",
      content: (
        <>
          <div className="draft-stack">
            {(activeDraft.formatIssues?.length ? activeDraft.formatIssues : ["暂无明确格式问题，仍建议代理师复核。"]).map((issue) => (
              <div className="strategy-card" key={issue}>
                <span>审查项</span>
                <p>{issue}</p>
              </div>
            ))}
          </div>
          <button className="primary-button" onClick={() => onJump("export")} type="button">
            进入格式导出 <ArrowRight size={16} />
          </button>
        </>
      ),
    },
  ];
  const currentSection = sections.find((section) => section.id === activeSection) || sections[0];

  return (
    <div className="workbench">
      <aside className="doc-outline drafting-rail">
        <h3>撰写链路</h3>
        <div className="draft-source-compact">
          <span>当前案件</span>
          <strong>{source.title}</strong>
          <em>{source.dateRange}</em>
        </div>
        {sections.map((section) => (
          <button
              type="button"
            className={activeSection === section.id ? "outline-item active" : "outline-item"}
            key={section.id}
            onClick={() => setActiveSection(section.id)}
          >
            <span>{section.label}</span>
            <em>{section.status}</em>
          </button>
        ))}
        <button className="primary-button full draft-generate" disabled={isGenerating} onClick={generateDraft} type="button">
          {isGenerating ? "生成中..." : isRealDraft ? "重新生成交底书" : "生成交底书草稿"}
        </button>
      </aside>

      <section className="editor">
        <div className="editor-toolbar">
          <Badge tone={isRealDraft ? "ok" : "warn"}>{isRealDraft ? "DeepSeek 已生成" : "示例预览，待生成"}</Badge>
          <span>{activeDraft.title} · 当前章节：{currentSection.label}</span>
        </div>
        {error && <div className="editor-error">{error}</div>}
        <div className="draft-transform-strip">
          {transformSteps.map(([label, text], index) => (
            <div className="draft-transform-step" key={label}>
              <strong>{label}</strong>
              <span>{text}</span>
              {index < transformSteps.length - 1 && <ArrowRight size={14} />}
            </div>
          ))}
        </div>
        <article className="draft-article">
          <div className="draft-section-heading">
            <div>
              <span>{currentSection.sourceLabel}</span>
              <h2>{currentSection.label}</h2>
              <p>{currentSection.description}</p>
            </div>
            <Badge tone={currentSection.status.includes("需") || currentSection.status.includes("待") ? "warn" : "ok"}>{currentSection.status}</Badge>
          </div>
          {currentSection.content}
        </article>
      </section>

      <aside className="assistant-panel">
        <h3>AI Skills 面板</h3>
        <div className="assistant-context-card">
          <span>当前动作上下文</span>
          <strong>{currentSection.label}</strong>
          <p>AI 动作会携带当前章节、查新结论、原始技术方案和当前草稿，输出只作为建议区展示。</p>
        </div>
        <SkillAction icon={BookOpenText} title="按交底书模板生成章节" loading={assistantLoading} onRun={runAssistantAction} />
        <SkillAction icon={Scale} title="生成从属权利要求" loading={assistantLoading} onRun={runAssistantAction} />
        <SkillAction icon={ShieldCheck} title="保护范围风险审查" loading={assistantLoading} onRun={runAssistantAction} />
        <SkillAction icon={MessageSquareText} title="术语一致性检查" loading={assistantLoading} onRun={runAssistantAction} />
        <SkillAction icon={BrainCircuit} title="说明书反向扩写" loading={assistantLoading} onRun={runAssistantAction} />
        <SkillAction icon={GitCompareArrows} title="补充现有技术区别论述" loading={assistantLoading} onRun={runAssistantAction} />
        <div className="risk-note">
          <AlertTriangle size={18} />
          {activeDraft.formatIssues[0] || "请在定稿前补齐参数、实施例和附图标记。"}
        </div>
        {assistantResult ? (
          <div className="assistant-result">
            <strong>{assistantResult.title}</strong>
            <p>{assistantResult.content}</p>
            {assistantResult.risks && assistantResult.risks.length > 0 && <span>风险：{assistantResult.risks.join("；")}</span>}
          </div>
        ) : (
          <div className="assistant-empty">
            <strong>尚未执行章节动作</strong>
            <p>选择左侧章节后点击右侧 Skill，输出会显示在这里，便于逐段审查和复制进草稿。</p>
          </div>
        )}
      </aside>
    </div>
  );
}

function ExportReview({ assessment, draft }: { assessment: NoveltyAssessment; draft: DisclosureDraft | null }) {
  const activeDraft = draft || defaultDraft;
  const markdown = activeDraft.markdown || buildFallbackMarkdown(activeDraft, assessment);
  const [exportError, setExportError] = useState("");
  const [fixMessage, setFixMessage] = useState("");
  const [docxStatus, setDocxStatus] = useState("检测中");

  useEffect(() => {
    let cancelled = false;
    fetch(getAbsoluteApiInput("/api/docx/status"))
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setDocxStatus(data?.minimax?.ready ? `MiniMax 可用 · .NET ${data.minimax.dotnetVersion}` : "MiniMax 未就绪 · 自动降级 Node DOCX");
      })
      .catch(() => {
        if (!cancelled) setDocxStatus("DOCX 状态检测失败");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function handleDownloadMarkdown() {
    downloadText(`${sanitizeFilename(activeDraft.title)}_${getTimestamp()}.md`, markdown);
  }

  async function handleDownloadDocx() {
    setExportError("");
    try {
      const response = await fetch(getAbsoluteApiInput("/api/patent/export-docx"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: activeDraft }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "DOCX 导出失败");
      }
      const blob = await response.blob();
      downloadBlob(`${sanitizeFilename(activeDraft.title)}_${getTimestamp()}.docx`, blob);
    } catch (nextError) {
      setExportError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  }

  async function handleDownloadMiniMaxDocx() {
    setExportError("");
    try {
      const response = await fetch(getAbsoluteApiInput("/api/patent/export-docx-minimax"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: activeDraft, fallback: true }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "MiniMax DOCX 导出失败");
      }
      const provider = response.headers.get("X-Docx-Provider");
      if (provider === "node-docx") {
        setExportError("MiniMax 严格导出未就绪，已自动降级为 Node DOCX。安装 .NET SDK 后会切回 MiniMax。");
      }
      const blob = await response.blob();
      downloadBlob(`${sanitizeFilename(activeDraft.title)}_${getTimestamp()}.docx`, blob);
    } catch (nextError) {
      setExportError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  }

  function handleAutoFix() {
    setFixMessage("已完成可自动处理项预检：摘要字数、法律用语替换建议和段落编号问题已生成处理建议；附图标记仍需结合实际附图人工确认。");
  }

  async function handleDownloadNoveltyReportDocx() {
    setExportError("");
    try {
      const response = await fetch(getAbsoluteApiInput("/api/patent/export-novelty-report-docx"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "查新报告 DOCX 导出失败");
      }
      const blob = await response.blob();
      downloadBlob(`${sanitizeFilename(assessment.title || "查新报告")}_创新性查新报告_${getTimestamp()}.docx`, blob);
    } catch (nextError) {
      setExportError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  }

  return (
    <div className="export-layout">
      <section className="content-card">
        <div className="section-title">
          <h3>格式合规检查</h3>
          <Badge tone="warn">4 项待处理</Badge>
        </div>
        {[
          ["摘要字数", "当前 286 字，符合要求", "ok"],
          ["段落编号", "第 [0034] 段后编号跳转", "warn"],
          ["附图标记", "控制模块 120 在权利要求中未定义", "danger"],
          ["法律用语", "建议替换“最佳”为“优选”", "warn"],
        ].map(([title, text, tone]) => (
          <div className="check-item" key={title}>
            {tone === "ok" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            <div>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          </div>
        ))}
        {fixMessage && <div className="success-note">{fixMessage}</div>}
        <button className="primary-button full" onClick={handleAutoFix}>
          一键修复可自动处理项 <Sparkles size={16} />
        </button>
      </section>

      <section className="paper-preview">
        <div className="paper">
          <h2>说明书摘要</h2>
          <p>{activeDraft.abstractText}</p>
          <h2>权利要求书</h2>
          <p>{activeDraft.claims[0]}</p>
        </div>
      </section>

      <aside className="insight-panel">
        <h3>导出</h3>
        <div className="delivery-card">
          <strong>交底书交付规则</strong>
          <span>{`{案件名}_{YYYYMMDDHHmmss}.md + .docx`}</span>
          <p>保留 mermaid 系统框图/流程图源文本，并在导出时渲染为图片写入 Word。</p>
        </div>
        <div className="delivery-card">
          <strong>MiniMax DOCX 管线</strong>
          <span>{docxStatus}</span>
          <p>服务器安装 .NET SDK 后，严格导出会走 minimax-docx OpenXML 创建、merge-runs 和 XSD 校验。</p>
        </div>
        {exportError && <div className="form-error">{exportError}</div>}
        <button className="primary-button full" onClick={handleDownloadMarkdown}>
          <Download size={16} /> 下载交底书 MD
        </button>
        <button className="ghost-button full" onClick={handleDownloadMiniMaxDocx}>
          <FileText size={16} /> MiniMax 严格 DOCX
        </button>
        <button className="ghost-button full" onClick={handleDownloadDocx}>
          <FileText size={16} /> Node 兼容 DOCX
        </button>
        <button className="ghost-button full" onClick={handleDownloadNoveltyReportDocx}>
          <FileCheck2 size={16} /> 下载查新报告 DOCX
        </button>
      </aside>
    </div>
  );
}

function buildFallbackMarkdown(draft: DisclosureDraft, assessment: NoveltyAssessment) {
  const sections = draft.descriptionSections.map((section) => `## ${section.heading}\n\n${section.content}`).join("\n\n");
  return `# 技术交底书

**案件名称**：${draft.title}

## 注意事项

（1）交底书应使代理人能看懂，尤其是背景技术和详细技术方案应完整、清楚。
（2）技术公开程度应以本领域普通技术人员能够实施为准。

## 查新与创新性结论

风险分：${assessment.riskScore}

${assessment.conclusion}

## 权利要求书草稿

${draft.claims.join("\n\n")}

## 说明书摘要

${draft.abstractText}

${sections}

## 系统框图

\`\`\`mermaid
${draft.mermaidSystemDiagram}
\`\`\`

## 流程图

\`\`\`mermaid
${draft.mermaidFlow}
\`\`\`
`;
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[\\/:*?"<>|\r\n]/g, "").trim().slice(0, 70) || "PatentDraft";
}

function getTimestamp() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  downloadBlob(filename, blob);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{note}</em>
    </div>
  );
}

function Badge({ children, tone = "ok" }: { children: ReactNode; tone?: "ok" | "warn" | "danger" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function Insight({ title, text }: { title: string; text: string }) {
  return (
    <div className="insight">
      <BadgeCheck size={18} />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
    </div>
  );
}

function SkillAction({
  icon: Icon,
  title,
  loading = "",
  onRun,
}: {
  icon: typeof Scale;
  title: string;
  loading?: string;
  onRun?: (title: string) => void;
}) {
  return (
    <button className="skill-action" disabled={loading === title} onClick={() => onRun?.(title)} type="button">
      <Icon size={18} />
      <span>{loading === title ? "处理中..." : title}</span>
      <ChevronRight size={16} />
    </button>
  );
}
