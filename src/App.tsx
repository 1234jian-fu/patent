import { useState, type ReactNode } from "react";
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

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
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
        {activeTab === "search" && <NoveltySearch onJump={setActiveTab} />}
        {activeTab === "result" && <SearchResult onJump={setActiveTab} />}
        {activeTab === "draft" && <DraftWorkbench />}
        {activeTab === "export" && <ExportReview />}
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
          <Badge>可扩展</Badge>
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

function NoveltySearch({ onJump }: { onJump: (tab: AppTab) => void }) {
  return (
    <div className="two-column">
      <section className="content-card">
        <div className="stepper">
          {["上传交底书", "提取特征", "配置检索", "生成报告"].map((step, index) => (
            <div className={index === 0 ? "step active" : "step"} key={step}>
              <CircleDot size={16} />
              {step}
            </div>
          ))}
        </div>

        <div className="upload-zone">
          <UploadCloud size={42} />
          <strong>上传技术交底书</strong>
          <p>支持 .docx、.pdf、图片扫描件，系统将解析技术问题、关键结构和技术效果。</p>
          <button className="primary-button">选择文件</button>
        </div>

        <div className="form-grid">
          <label>
            技术主题
            <input defaultValue="多模态传感器的低功耗融合方法" />
          </label>
          <label>
            时间跨度
            <input defaultValue="2018-01-01 至今" />
          </label>
          <label className="span-all">
            检索数据库
            <div className="chip-row">
              <span>CNIPA</span>
              <span>USPTO</span>
              <span>EPO</span>
              <span>WIPO</span>
            </div>
          </label>
          <label className="span-all">
            技术关键词
            <textarea defaultValue="多模态传感器；低功耗；数据融合；边缘计算；自适应采样" />
          </label>
        </div>

        <button className="primary-button full" onClick={() => onJump("result")}>
          开始查新评估 <Sparkles size={16} />
        </button>
      </section>

      <aside className="insight-panel">
        <h3>交底书解析 Skill</h3>
        <Insight title="核心技术问题" text="现有融合节点持续采集导致功耗升高，难以满足长期部署场景。" />
        <Insight title="关键技术特征" text="事件触发采样、分层特征融合、边缘侧动态阈值更新。" />
        <Insight title="建议分类号" text="G06F 18/25、G01D 21/02、H04W 52/02" />
      </aside>
    </div>
  );
}

function SearchResult({ onJump }: { onJump: (tab: AppTab) => void }) {
  return (
    <div className="result-layout">
      <section className="score-card">
        <span className="eyebrow">Novelty Risk</span>
        <div className="score-ring">42</div>
        <h2>中低风险，可进入权利要求设计</h2>
        <p>主要差异点集中在“事件触发采样与融合权重联动更新”的组合关系。</p>
        <button className="primary-button" onClick={() => onJump("draft")}>
          进入智能撰写 <ArrowRight size={16} />
        </button>
      </section>

      <section className="content-card">
        <div className="section-title">
          <h3>核心差异点</h3>
          <Badge tone="ok">3 项可主张</Badge>
        </div>
        <div className="novelty-list">
          <Insight title="差异点 01" text="根据异常事件强度动态调整传感器采样频率，而非固定周期采样。" />
          <Insight title="差异点 02" text="融合权重由边缘节点本地更新，降低云端依赖和通信开销。" />
          <Insight title="差异点 03" text="将功耗预算作为融合模型约束条件写入控制流程。" />
        </div>
      </section>

      <section className="content-card wide">
        <div className="section-title">
          <h3>Top 5 对比文件</h3>
          <button className="ghost-button">
            <Filter size={16} /> 筛选
          </button>
        </div>
        <div className="reference-table">
          {references.map((ref) => (
            <div className="reference-row" key={ref.id}>
              <strong>{ref.id}</strong>
              <span>{ref.title}</span>
              <div className="bar">
                <i style={{ width: `${ref.score}%` }} />
              </div>
              <em>{ref.hit}</em>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DraftWorkbench() {
  return (
    <div className="workbench">
      <aside className="doc-outline">
        <h3>文档结构</h3>
        {["权利要求书", "技术领域", "背景技术", "发明内容", "具体实施方式", "附图说明"].map((item, index) => (
          <button className={index === 0 ? "outline-item active" : "outline-item"} key={item}>
            {item}
          </button>
        ))}
      </aside>

      <section className="editor">
        <div className="editor-toolbar">
          <Badge tone="ok">已连接查新结果</Badge>
          <span>自动保存于 10:28</span>
        </div>
        <article>
          <h2>权利要求书</h2>
          <p>
            <strong>1.</strong> 一种多模态传感器的低功耗融合方法，其特征在于，包括：
          </p>
          <p>
            获取至少两类传感器的候选采样信号；基于异常事件强度确定采样频率调整系数；在边缘计算节点中根据功耗预算约束更新融合权重；输出融合后的设备状态判定结果。
          </p>
          <p>
            <strong>2.</strong> 根据权利要求1所述的方法，其中所述采样频率调整系数由环境变化率和历史误报率共同确定。
          </p>
        </article>
      </section>

      <aside className="assistant-panel">
        <h3>AI Skills 面板</h3>
        <SkillAction icon={Scale} title="生成从属权利要求" />
        <SkillAction icon={ShieldCheck} title="保护范围风险审查" />
        <SkillAction icon={MessageSquareText} title="术语一致性检查" />
        <SkillAction icon={BrainCircuit} title="说明书反向扩写" />
        <div className="risk-note">
          <AlertTriangle size={18} />
          “异常事件强度”需要在说明书中给出计算方式或判定规则。
        </div>
      </aside>
    </div>
  );
}

function ExportReview() {
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
          <p>本发明公开了一种多模态传感器的低功耗融合方法，通过事件触发采样、边缘侧融合权重更新以及功耗预算约束，实现长期部署场景下的稳定监测。</p>
          <h2>权利要求书</h2>
          <p>1. 一种多模态传感器的低功耗融合方法，其特征在于，包括...</p>
        </div>
      </section>

      <aside className="insight-panel">
        <h3>导出</h3>
        <button className="primary-button full">
          <Download size={16} /> 导出 CNIPA ZIP
        </button>
        <button className="ghost-button full">
          <FileText size={16} /> 下载 DOCX
        </button>
        <button className="ghost-button full">
          <FileCheck2 size={16} /> 下载 PDF
        </button>
      </aside>
    </div>
  );
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

function SkillAction({ icon: Icon, title }: { icon: typeof Scale; title: string }) {
  return (
    <button className="skill-action">
      <Icon size={18} />
      <span>{title}</span>
      <ChevronRight size={16} />
    </button>
  );
}
