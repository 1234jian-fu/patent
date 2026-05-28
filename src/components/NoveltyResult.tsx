import { useState } from "react";
import { ArrowLeft, Award, Sparkles, ChevronDown, ChevronUp, CheckCircle, FileText, AlertTriangle, Play } from "lucide-react";
import { PatentProject } from "../types";

interface NoveltyResultProps {
  project: PatentProject;
  onBack: () => void;
  onProceedDraft: () => void;
}

export default function NoveltyResult({ project, onBack, onProceedDraft }: NoveltyResultProps) {
  const analysis = project.analysis;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  if (!analysis) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <p className="text-slate-800 font-semibold mb-2">未完成该项目的查新评估</p>
        <button onClick={onBack} className="bg-slate-900 text-white rounded-lg px-4 py-2 text-sm font-semibold">
          返回主座
        </button>
      </div>
    );
  }

  const toggleExpand = (index: number) => {
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else {
      setExpandedIndex(index);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left">
      {/* Top Banner & Main Action Menu */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-gray-100 gap-4">
        <button
          onClick={onBack}
          className="flex items-center text-slate-500 hover:text-indigo-600 font-semibold text-sm gap-1 transition-colors border-none bg-transparent cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          返回交底书修改
        </button>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-gray-400 text-xs hidden md:inline">查新评估结果:</span>
          <span className="font-semibold text-sm max-w-xs truncate text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg" title={project.title}>
            {project.title}
          </span>
          <button
            onClick={onProceedDraft}
            className="bg-indigo-600 hover:bg-slate-900 text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer hover:shadow"
          >
            <Play className="w-4 h-4 fill-current" />
            基于此结果直接撰写
          </button>
        </div>
      </div>

      {/* Split-view Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: AI Innovativeness Analysis */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
            {/* Header border stripe */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                AI 创新性评估结论
              </h2>
            </div>
            
            <div className="p-6">
              {/* Score card */}
              <div className="flex items-center justify-between p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl mb-6">
                <div>
                  <div className="text-gray-500 text-xs font-semibold mb-0.5">综合新颖性得分</div>
                  <div className="font-extrabold text-4xl text-indigo-700 flex items-baseline">
                    {analysis.score}
                    <span className="text-sm font-medium text-indigo-500 ml-1">%</span>
                  </div>
                </div>
                
                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 ${
                  analysis.riskClass === "danger"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : analysis.riskClass === "warning"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}>
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{analysis.riskLevel}</span>
                </div>
              </div>

              {/* Differences List */}
              <div>
                <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  核心新颖差异点提炼
                </h3>
                
                <ul className="space-y-5">
                  {analysis.differences.map((diff, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-indigo-50 font-bold text-xs text-indigo-600 flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-grow">
                        <p className="font-semibold text-sm text-slate-900">{diff.title}</p>
                        <p className="text-gray-500 text-xs leading-relaxed mt-1">
                          {diff.desc}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Comparative Patent Documents */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 bg-slate-50/50 flex justify-between items-center relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700"></div>
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-slate-500" />
                检索库高度相关对比文件 (Top 3)
              </h2>
            </div>
            
            <div className="p-6 flex-grow flex flex-col gap-4">
              {analysis.comparativePatents.map((doc, index) => {
                const isExpanded = expandedIndex === index;
                return (
                  <div 
                    key={index} 
                    className={`border rounded-xl overflow-hidden transition-all duration-150 ${
                      isExpanded ? "border-indigo-200 shadow-sm bg-white" : "border-slate-200 hover:border-slate-300 bg-slate-50/40"
                    }`}
                  >
                    {/* Collapsed Header Clickable */}
                    <div 
                      onClick={() => toggleExpand(index)}
                      className="p-4 cursor-pointer flex items-start justify-between select-none"
                    >
                      <div className="flex-grow">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            doc.style === "danger" 
                              ? "bg-red-50 text-red-700 border-red-100" 
                              : doc.style === "warning"
                              ? "bg-amber-50 text-amber-700 border-amber-100"
                              : "bg-blue-50 text-blue-700 border-blue-100"
                          }`}>
                            相似度: {doc.similarity}%
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">公开号: {doc.pubNumber}</span>
                        </div>
                        <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                          {doc.title}
                        </h3>
                      </div>
                      
                      <button className="text-gray-400 hover:text-slate-800 p-1 bg-transparent border-none cursor-pointer mt-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Expandable Technical Target Feature Table */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/80 p-4">
                        <div className="font-bold text-[10px] uppercase tracking-wider text-gray-400 mb-3">
                          🔬 技术特征比对表
                        </div>
                        
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                <th className="py-2.5 px-3 w-1/2">本发明的核心特征 (Mine)</th>
                                <th className="py-2.5 px-3 w-1/2 border-l border-slate-200">对比文件特征 (Theirs)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {doc.comparison.map((row, rIdx) => (
                                <tr key={rIdx} className="align-top hover:bg-slate-50">
                                  <td className="py-2.5 px-3 text-slate-800 font-medium">
                                    {row.mine}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-600 border-l border-slate-200">
                                    {row.theirs}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
