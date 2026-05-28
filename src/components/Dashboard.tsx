import { FileUp, Edit3, History, ArrowRight } from "lucide-react";
import { PatentProject } from "../types";

interface DashboardProps {
  projects: PatentProject[];
  onNewNoveltyCheck: () => void;
  onNewDraftDirect: () => void;
  onContinueWork: (project: PatentProject) => void;
}

export default function Dashboard({
  projects,
  onNewNoveltyCheck,
  onNewDraftDirect,
  onContinueWork
}: DashboardProps) {
  const ongoingCount = projects.filter(p => p.stage !== "定稿审核").length;

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Welcome Hero Area */}
      <section className="flex flex-col gap-2 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl"></div>
        
        <h1 className="text-2xl md:text-3.5xl font-extrabold tracking-tight">欢迎回来，测试用户</h1>
        <p className="text-indigo-200 text-sm md:text-base font-medium">
          您当前有 <span className="font-bold text-emerald-400 text-lg mx-1">{projects.length}</span> 个正在进行中的专利项目。
        </p>
      </section>

      {/* Quick Actions Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Box Card 1: Upload and Novelty Verification */}
        <button
          onClick={onNewNoveltyCheck}
          className="flex flex-col items-start p-6 bg-white border border-slate-200 rounded-2xl hover:border-indigo-500 hover:shadow-md active:scale-[0.99] transition-all duration-200 text-left relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-600"></div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
            <FileUp className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-lg text-slate-900 mb-1 flex items-center gap-1">
            新建查新 <span className="text-xs text-gray-400 font-normal">(上传交底书)</span>
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            上传技术交底书 Word/PDF / 输入文本概要，AI 将自动分析提取核心发明特征并进行全球比对。
          </p>
          <span className="text-indigo-600 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all mt-auto leading-none">
            立即开启 
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>

        {/* Box Card 2: Directly Create Draft */}
        <button
          onClick={onNewDraftDirect}
          className="flex flex-col items-start p-6 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-md active:scale-[0.99] transition-all duration-200 text-left relative overflow-hidden group cursor-pointer"
        >
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-200">
            <Edit3 className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-lg text-slate-900 mb-1 flex items-center gap-1">
            直接创建撰写 <span className="text-xs text-gray-400 font-normal">(跳过查新)</span>
          </h3>
          <p className="text-gray-500 text-sm leading-relaxed mb-4">
            跳过前置查新评分和文献比对，直接进入交互式专利权利要求书在线编辑器开始快速起草规范案。
          </p>
          <span className="text-emerald-600 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all mt-auto leading-none">
            开始起草
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </section>

      {/* Recent Projects Table section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-400" />
          最近项目
        </h2>
        
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6 w-1/2">项目名称</th>
                  <th className="py-4 px-4">当前阶段</th>
                  <th className="py-4 px-4">最后修改时间</th>
                  <th className="py-4 px-6 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 px-6 text-center text-gray-400 bg-slate-50/50">
                      暂无专利项目，请点击上方按钮新建一个项目开始。
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <tr 
                      key={project.id} 
                      className="hover:bg-slate-50/70 transition-colors duration-150"
                    >
                      <td className="py-4 px-6 font-medium text-slate-900">
                        <div className="font-semibold truncate max-w-md md:max-w-lg" title={project.title}>
                          {project.title}
                        </div>
                        {project.disclosureText && (
                          <div className="text-xs text-gray-400 truncate max-w-sm font-normal mt-0.5">
                            {project.disclosureText}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                          project.stage === "撰写中"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : project.stage === "查新中"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            project.stage === "撰写中" ? "bg-blue-500" : project.stage === "查新中" ? "bg-purple-500" : "bg-emerald-500"
                          }`} />
                          {project.stage}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-500 tabular-nums">
                        {project.lastModified}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => onContinueWork(project)}
                          className="bg-slate-900 hover:bg-indigo-600 hover:shadow-sm text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all active:scale-95 duration-150 cursor-pointer"
                        >
                          继续工作
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
