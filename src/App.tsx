import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
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
  Filter,
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
import type { AppTab, PatentProject } from "./types";
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

const disclosurePipeline = [
  "项目扫描",
  "专利点挖掘",
  "CNIPA 查新",
  "交底书预览",
  "mermaid 图示",
  "md/docx 交付",
  "自检与迭代",
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [assessment, setAssessment] = useState<NoveltyAssessment>(defaultAssessment);
  const [draft, setDraft] = useState<DisclosureDraft | null>(defaultDraft);
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
            <button className="ghost-button">模板库</button>
            <button className="primary-button" onClick={() => setActiveTab("search")}>
              新建查新 <ArrowRight size={16} />
            </button>
          </div>
        </header>

        {activeTab === "dashboard" && <Dashboard onJump={setActiveTab} />}
        {activeTab === "search" && (
          <NoveltySearch
            onAssessment={(nextAssessment) => {
              setAssessment(nextAssessment);
              setDraft(null);
              setActiveTab("result");
            }}
          />
        )}
        {activeTab === "result" && <SearchResult assessment={assessment} onJump={setActiveTab} />}
        {activeTab === "draft" && <DraftWorkbench assessment={assessment} draft={draft} onDraft={setDraft} />}
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
          <button className="text-button">查看全部</button>
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
            <strong>中国专利交底书 Skill</strong>
            <p>来自 handsomestWei/patent-disclosure-skill：覆盖专利点挖掘、国知局公布公告查新、脱敏交底书成稿、自检和迭代留档。</p>
          </div>
          <div className="pipeline-strip">
            {disclosurePipeline.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
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

function NoveltySearch({ onAssessment }: { onAssessment: (assessment: NoveltyAssessment) => void }) {
  const [title, setTitle] = useState("多模态传感器的低功耗融合方法");
  const [inventionDisclosure, setInventionDisclosure] = useState(
    "本方案面向长期部署的多模态传感器节点，基于异常事件强度动态调整采样频率，并在边缘计算节点中根据功耗预算约束更新融合权重，输出设备状态判定结果。",
  );
  const [patentUrls, setPatentUrls] = useState("");
  const [manualEvidence, setManualEvidence] = useState("");
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsAssessing(true);
    setError("");

    try {
      const response = await fetch("/api/patent/novelty-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          inventionDisclosure,
          patentUrls: patentUrls
            .split(/\r?\n/)
            .map((url) => url.trim())
            .filter(Boolean),
          manualEvidence,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "创新性评估失败");
      }

      onAssessment(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setIsAssessing(false);
    }
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
          <strong>中国专利请求与对比文件证据</strong>
          <p>输入待申请技术方案，并粘贴中国专利公布公告、Google Patents、EPO、WIPO 等对比文件链接，系统抓取正文后输出创新性判断。</p>
        </div>

        <div className="form-grid">
          <label>
            中国专利请求名称
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            时间跨度
            <input defaultValue="2018-01-01 至今" />
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
        <Insight title="输出内容" text="风险分、创新点、特征对比表、Top 对比文件、权利要求补强建议。" />
      </aside>
    </form>
  );
}

function SearchResult({ assessment, onJump }: { assessment: NoveltyAssessment; onJump: (tab: AppTab) => void }) {
  const score = Math.max(0, Math.min(100, Number(assessment.riskScore) || 0));
  const riskTone = score >= 70 ? "danger" : score >= 45 ? "warn" : "ok";

  return (
    <div className="result-layout">
      <section className="score-card">
        <span className="eyebrow">Novelty Risk</span>
        <div className="score-ring" style={{ "--score": `${score}%` } as CSSProperties}>
          {score}
        </div>
        <h2>{score >= 70 ? "创新性风险较高，需重构差异特征" : score >= 45 ? "中等风险，需补强技术效果" : "风险可控，可进入撰写"}</h2>
        <p>{assessment.conclusion}</p>
        <button className="primary-button" onClick={() => onJump("draft")}>
          进入智能撰写 <ArrowRight size={16} />
        </button>
      </section>

      <section className="content-card">
        <div className="section-title">
          <h3>有证据支撑的创新点</h3>
          <Badge tone={riskTone}>{assessment.noveltyPoints.length} 项</Badge>
        </div>
        <div className="novelty-list">
          {assessment.noveltyPoints.map((point, index) => (
            <div key={point}>
              <Insight title={`差异点 ${String(index + 1).padStart(2, "0")}`} text={point} />
            </div>
          ))}
        </div>
      </section>

      <section className="content-card wide">
        <div className="section-title">
          <h3>Top 对比文件</h3>
          <button className="ghost-button">
            <Filter size={16} /> 筛选
          </button>
        </div>
        <div className="reference-table">
          {assessment.references.map((ref) => (
            <div className="reference-row" key={`${ref.publicationNumber}-${ref.title}`}>
              <strong>{ref.publicationNumber || ref.source}</strong>
              <span>{ref.title}</span>
              <div className="bar">
                <i style={{ width: `${Math.max(0, Math.min(100, ref.relevanceScore || 0))}%` }} />
              </div>
              <em>{ref.keyDisclosure}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="content-card wide">
        <div className="section-title">
          <h3>特征 1:1 对比</h3>
          <Badge tone={riskTone}>证据链</Badge>
        </div>
        <div className="feature-table">
          {assessment.featureComparison.map((item) => (
            <div className="feature-row" key={item.feature}>
              <strong>{item.feature}</strong>
              <span>{item.evidence}</span>
              <em>{item.noveltyJudgement}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="content-card wide">
        <div className="section-title">
          <h3>权利要求补强建议</h3>
          <Badge>写作入口</Badge>
        </div>
        <div className="suggestion-list">
          {assessment.claimSuggestions.map((suggestion) => (
            <div className="suggestion-item" key={suggestion}>
              <Scale size={16} />
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
                <span>{doc.source}</span>
                <p>{doc.excerpt.slice(0, 180)}...</p>
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
}: {
  assessment: NoveltyAssessment;
  draft: DisclosureDraft | null;
  onDraft: (draft: DisclosureDraft) => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [assistantResult, setAssistantResult] = useState<AssistantActionResult | null>(null);
  const [assistantLoading, setAssistantLoading] = useState("");
  const [error, setError] = useState("");

  async function generateDraft() {
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch("/api/patent/draft-disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "交底书生成失败");
      onDraft(data);
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
      const response = await fetch("/api/patent/assistant-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, assessment, draft }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "AI 助手动作失败");
      setAssistantResult(data);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    } finally {
      setAssistantLoading("");
    }
  }

  const activeDraft = draft || defaultDraft;

  return (
    <div className="workbench">
      <aside className="doc-outline">
        <h3>文档结构</h3>
        {["权利要求书", "摘要", "现有技术", "技术问题", "技术方案", "实施例", "附图说明"].map((item, index) => (
          <button className={index === 0 ? "outline-item active" : "outline-item"} key={item}>
            {item}
          </button>
        ))}
        <button className="primary-button full draft-generate" disabled={isGenerating} onClick={generateDraft}>
          {isGenerating ? "生成中..." : "生成交底书草稿"}
        </button>
      </aside>

      <section className="editor">
        <div className="editor-toolbar">
          <Badge tone={draft ? "ok" : "warn"}>{draft ? "DeepSeek 已生成" : "示例草稿"}</Badge>
          <span>{activeDraft.title}</span>
        </div>
        {error && <div className="editor-error">{error}</div>}
        <article>
          <h2>权利要求书</h2>
          {activeDraft.claims.map((claim) => (
            <p key={claim}>{claim}</p>
          ))}
          <h2>说明书摘要</h2>
          <p>{activeDraft.abstractText}</p>
          {activeDraft.descriptionSections.map((section) => (
            <section className="draft-section" key={section.heading}>
              <h3>{section.heading}</h3>
              <p>{section.content}</p>
            </section>
          ))}
        </article>
      </section>

      <aside className="assistant-panel">
        <h3>AI Skills 面板</h3>
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
        {assistantResult && (
          <div className="assistant-result">
            <strong>{assistantResult.title}</strong>
            <p>{assistantResult.content}</p>
            {assistantResult.risks && assistantResult.risks.length > 0 && <span>风险：{assistantResult.risks.join("；")}</span>}
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

  function handleDownloadMarkdown() {
    downloadText(`${sanitizeFilename(activeDraft.title)}_${getTimestamp()}.md`, markdown);
  }

  async function handleDownloadDocx() {
    setExportError("");
    try {
      const response = await fetch("/api/patent/export-docx", {
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
        <button className="primary-button full">
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
        {exportError && <div className="form-error">{exportError}</div>}
        <button className="primary-button full" onClick={handleDownloadMarkdown}>
          <Download size={16} /> 下载交底书 MD
        </button>
        <button className="ghost-button full" onClick={handleDownloadDocx}>
          <FileText size={16} /> 下载 DOCX
        </button>
        <button className="ghost-button full">
          <FileCheck2 size={16} /> DOCX/PDF 待接入
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
    <button className="skill-action" disabled={loading === title} onClick={() => onRun?.(title)}>
      <Icon size={18} />
      <span>{loading === title ? "处理中..." : title}</span>
      <ChevronRight size={16} />
    </button>
  );
}
