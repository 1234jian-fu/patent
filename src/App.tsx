import { useState } from "react";
import { PatentProject, ProjectStage, PatentClaim, PatentAnalysis } from "./types";
import TopNavBar from "./components/TopNavBar";
import Footer from "./components/Footer";
import Dashboard from "./components/Dashboard";
import NoveltyQuery from "./components/NoveltyQuery";
import NoveltyResult from "./components/NoveltyResult";
import ClaimEditor from "./components/ClaimEditor";
import FormatExport from "./components/FormatExport";
import { ToolboxView } from "./components/ToolboxView";
import { SettingsView } from "./components/SettingsView";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "novelty" | "result" | "edit" | "format" | "toolbox" | "settings">("dashboard");
  const [loading, setLoading] = useState(false);
  const [activeProject, setActiveProject] = useState<PatentProject | null>(null);

  // Pre-seed some initial professional mock projects to look incredibly complete and beautiful!
  const [projects, setProjects] = useState<PatentProject[]>([
    {
      id: "proj_1",
      title: "一种基于人工智能的图像处理方法及系统",
      stage: "撰写中",
      lastModified: "2024-05-20 14:30",
      disclosureText: "一种基于多层卷积深度神经网络自适应特征对齐和高精度图像分割工艺，提高微观成像对比度。",
      databases: ["全球", "中国"],
      startDate: "2020-01-01",
      endDate: "2026-05-28",
      analysis: {
        score: 82,
        riskLevel: "可作为专利保护授权率较高",
        riskClass: "success",
        differences: [
          {
            title: "微观特征自动对齐层设计",
            desc: "利用在卷积后建立物理极坐标相位转换层，避免了由于镜头偏差导致的拉伸变形，具有显著差异。"
          }
        ],
        comparativePatents: [
          {
            similarity: 68,
            style: "info",
            pubNumber: "CN108992231A",
            title: "双阶段深度图像去噪算法和系统装置",
            comparison: [
              {
                mine: "采用极坐标极化相干变换对齐特征。",
                theirs: "常规直角坐标插值平滑，边缘分辨率大幅度下降。"
              }
            ]
          }
        ],
        claims: [
          {
            id: 1,
            type: "independent",
            ref: 0,
            text: "一种用于微观医学成像领域的深度学习高保真度图像对齐法，其特征在于，包括：接收相机捕捉的偏置原始灰度图像；利用极轴变换模型将图像映射至角坐标系；计算极径向极性差，从而自适应恢复由于多透镜反射产生的几何畸变损失。"
          }
        ]
      }
    },
    {
      id: "proj_2",
      title: "新型高分子材料的制备工艺",
      stage: "查新中",
      lastModified: "2024-05-18 09:15",
      disclosureText: "制备一种带有超耐磨氧化铝杂化填料阻燃树脂共缩聚法，使用硅烷微包覆结构。",
      databases: ["全球", "中国", "美国"],
      startDate: "2019-06-01",
      endDate: "2026-05-28"
    },
    {
      id: "proj_3",
      title: "分布式数据库的事务并发控制装置",
      stage: "定稿审核",
      lastModified: "2024-05-15 16:45",
      disclosureText: "带有无锁多版本一致性哈希多因子快照乐观控制机制，优化高并发状态死锁耗费。",
      databases: ["全球"],
      startDate: "2021-01-01",
      endDate: "2026-05-28"
    }
  ]);

  const handleNewNoveltyCheck = () => {
    setActiveTab("novelty");
    setActiveProject(null);
  };

  const handleNewDraftDirect = () => {
    // Scaffold an empty project directly into editor
    const emptyProj: PatentProject = {
      id: "proj_" + Date.now(),
      title: "智能负载均衡系统开发项目",
      stage: "撰写中",
      lastModified: new Date().toISOString().replace("T", " ").substring(0, 16),
      disclosureText: "基于多级神经网络模型对边缘计算节点实时运算开销与瞬时温度的多阶回归，预测空闲可用区间，从而完成动态负载分配调度过程。",
      databases: ["中国"],
      startDate: "2020-01-01",
      endDate: "2026-05-28",
      analysis: {
        score: 85,
        riskLevel: "高新颖性风险低",
        riskClass: "success",
        differences: [
          {
            title: "回归算例的多维温控映射",
            desc: "传统单纯依赖CPU物理占比，本发明深度关联机柜出口气温和瞬态阻抗，规避了算例聚集时产生物理局部温升导致的整体效能退化。"
          }
        ],
        comparativePatents: [
          {
            similarity: 72,
            style: "warning",
            pubNumber: "US202300188A",
            title: "Dynamic task balancing on core computing nodes",
            comparison: [
              {
                mine: "实时耦合算力分布、机架物理进风温度和功耗进行协同预测调度。",
                theirs: "仅考量系统内静态轮换百分比，未结合物理温控与功耗衰变因子。"
              }
            ]
          }
        ],
        claims: [
          {
            id: 1,
            type: "independent",
            ref: 0,
            text: "一种基于人工智能的多维度感知计算环境动态负载调度分配方法，其特征在于，包括：采集待测物理计算节点的瞬时CPU占比、机柜进风通道传感器环境温度以及供电功耗系数；输入预训练神经网络回归模型输出未来周期内各节点状态退化值；根据退化值排序分派动态负载算力作业包。"
          }
        ]
      }
    };
    setActiveProject(emptyProj);
    setProjects([emptyProj, ...projects]);
    setActiveTab("edit");
  };

  const handleContinueWork = (project: PatentProject) => {
    setActiveProject(project);
    if (!project.analysis) {
      // If it doesn't have an analysis, jump to Query view so they can run it
      setActiveTab("novelty");
    } else if (project.stage === "查新中") {
      setActiveTab("result");
    } else {
      setActiveTab("edit");
    }
  };

  // Analyze technical disclosure submission
  const handleNoveltySubmit = async (
    title: string,
    text: string,
    databases: string[],
    startDate: string,
    endDate: string
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/analyze-disclosure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, text, databases, startDate, endDate }),
      });
      const data = await res.json();
      if (data.success && data.analysis) {
        const newProj: PatentProject = {
          id: "proj_" + Date.now(),
          title: data.projectName,
          stage: "查新中",
          lastModified: new Date().toISOString().replace("T", " ").substring(0, 16),
          disclosureText: text,
          databases,
          startDate,
          endDate,
          analysis: data.analysis,
        };
        setProjects([newProj, ...projects]);
        setActiveProject(newProj);
        setActiveTab("result");
      }
    } catch (err) {
      console.error("Analysis request failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedDraft = () => {
    if (activeProject) {
      const updated = { ...activeProject, stage: "撰写中" as ProjectStage };
      setProjects(projects.map((p) => (p.id === activeProject.id ? updated : p)));
      setActiveProject(updated);
      setActiveTab("edit");
    }
  };

  // Compile full patent specification from edited claims
  const handleSaveClaimsAndProceed = async (updatedClaims: PatentClaim[]) => {
    if (!activeProject) return;
    
    // Load spinner/indicator while calling backend esm to write spec section
    setLoading(true);
    try {
      const res = await fetch("/api/compile-specification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeProject.title,
          claims: updatedClaims,
          disclosureText: activeProject.disclosureText,
        }),
      });
      const data = await res.json();
      
      const analysisWithUpdatedClaims: PatentAnalysis = {
        ...activeProject.analysis!,
        claims: updatedClaims,
      };

      const finalProject: PatentProject = {
        ...activeProject,
        stage: "定稿审核" as ProjectStage,
        analysis: analysisWithUpdatedClaims,
        specification: data,
        lastModified: new Date().toISOString().replace("T", " ").substring(0, 16),
      };

      setProjects(projects.map((p) => (p.id === activeProject.id ? finalProject : p)));
      setActiveProject(finalProject);
      setActiveTab("format");
    } catch (e) {
      console.error("Compilation error", e);
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    setActiveTab("dashboard");
    setActiveProject(null);
  };

  return (
    <div className="bg-[#fbf9f8] min-h-screen text-slate-900 flex flex-col font-sans antialiased">
      {/* Universal Sticky Header Navigation */}
      <TopNavBar
        currentTab={activeTab}
        onTabChange={(tab: any) => setActiveTab(tab)}
        onGoHome={handleGoHome}
      />

      {/* Primary loading backdrop */}
      {loading && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-[100] transition-opacity select-none">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center gap-4 max-w-sm text-center">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin"></div>
              <span className="absolute text-xs font-bold text-indigo-600">AI</span>
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">正在加载高维智能特征比对...</p>
              <p className="text-gray-400 text-xs mt-1">Gemini 3.5 正在严谨阅读法言法语，进行深度专利合规逻辑比对</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col h-full overflow-hidden">
        {activeTab === "dashboard" && (
          <Dashboard
            projects={projects}
            onNewNoveltyCheck={handleNewNoveltyCheck}
            onNewDraftDirect={handleNewDraftDirect}
            onContinueWork={handleContinueWork}
          />
        )}

        {activeTab === "novelty" && (
          <NoveltyQuery
            onBack={handleGoHome}
            onSubmit={handleNoveltySubmit}
            loading={loading}
          />
        )}

        {activeTab === "result" && activeProject && (
          <NoveltyResult
            project={activeProject}
            onBack={() => setActiveTab("novelty")}
            onProceedDraft={handleProceedDraft}
          />
        )}

        {activeTab === "edit" && activeProject && (
          <ClaimEditor
            project={activeProject}
            onSaveAndNext={handleSaveClaimsAndProceed}
            onBack={handleGoHome}
          />
        )}

        {activeTab === "format" && activeProject && (
          <FormatExport
            project={activeProject}
            onBack={() => setActiveTab("edit")}
            onGoHome={handleGoHome}
          />
        )}

        {activeTab === "toolbox" && (
          <ToolboxView onSelectNovelty={handleNewNoveltyCheck} onSelectDraft={handleNewDraftDirect} />
        )}

        {activeTab === "settings" && <SettingsView />}
      </main>

      {/* Footer layout */}
      {activeTab !== "edit" && activeTab !== "format" && <Footer />}
    </div>
  );
}
