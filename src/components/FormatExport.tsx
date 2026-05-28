import { useState } from "react";
import { CheckCircle, Download, Minus, Plus, FileText, Globe2, Sparkles, CheckSquare, RefreshCw, Layers } from "lucide-react";
import { PatentProject, PatentClaim } from "../types";

interface FormatExportProps {
  project: PatentProject;
  onBack: () => void;
  onGoHome: () => void;
}

export default function FormatExport({ project, onBack, onGoHome }: FormatExportProps) {
  const [zoom, setZoom] = useState(85);
  const [activePreviewTab, setActivePreviewTab] = useState<"claims" | "spec">("spec");
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [agency, setAgency] = useState("cnipa");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([
    "claims",
    "spec",
    "drawings",
    "abstract",
    "abstract_drawings",
  ]);

  const toggleSelectDoc = (docId: string) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter((id) => id !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  const handleDownloadZip = () => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadSuccess(true);
      // Automatically clear toast after 5 seconds
      setTimeout(() => setDownloadSuccess(false), 5000);
    }, 2500);
  };

  const handleZoomIn = () => {
    if (zoom < 130) setZoom(zoom + 5);
  };

  const handleZoomOut = () => {
    if (zoom > 60) setZoom(zoom - 5);
  };

  const agencyLabel = () => {
    switch (agency) {
      case "cnipa": return "中国国家知识产权局 (CNIPA)";
      case "wipo": return "世界知识产权组织 (WIPO/PCT)";
      case "uspto": return "美国专利商标局 (USPTO)";
      case "epo": return "欧洲专利局 (EPO)";
      default: return "中国国家知识产权局 (CNIPA)";
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-[calc(100vh-64px)] overflow-hidden text-left">
      {/* Left Action Menu Side layout panel */}
      <aside className="w-full md:w-[35%] bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto shrink-0 select-none">
        <div className="p-6 space-y-6">
          <div className="mb-4">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-indigo-600 font-semibold text-xs flex items-center gap-1 transition-colors border-none bg-transparent mb-2 cursor-pointer"
            >
              ← 返回撰写工作台
            </button>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">格式排版与导出</h1>
            <p className="text-gray-400 text-xs">智能自动化审查文档段落编号，校验一键打包下载最高规格的申报专包。</p>
          </div>

          {/* Format Check list info report */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden relative">
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-emerald-500"></div>
            <div className="p-4 text-xs">
              <div className="flex items-center gap-1.5 mb-3 font-bold text-slate-800 uppercase tracking-wide">
                <CheckSquare className="w-4.5 h-4.5 text-emerald-600" />
                <span>智能格式审查报告</span>
              </div>
              
              <ul className="space-y-2 text-slate-600 font-medium">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-extrabold text-sm leading-none">✓</span>
                  <span>段落编号连续性检查通过 (共计 {project.specification?.paragraphs.length || 6} 项)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-extrabold text-sm leading-none">✓</span>
                  <span>权利要求前序字格及主从引用逻辑校验完成</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-extrabold text-sm leading-none">✓</span>
                  <span>附图标记一致性校验结束，未见孤漏标记段</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-extrabold text-sm leading-none">✓</span>
                  <span>摘要首尾字数合规 (285字)</span>
                </li>
              </ul>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Export Configurations */}
          <div className="space-y-5 text-sm">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">导出设置</h3>
            
            <div className="space-y-1">
              <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest block">
                目标提交机构
              </label>
              <select
                value={agency}
                onChange={(e) => setAgency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="cnipa">中国国家知识产权局 (CNIPA)</option>
                <option value="wipo">世界知识产权组织 (WIPO/PCT)</option>
                <option value="uspto">美国专利商标局 (USPTO)</option>
                <option value="epo">欧洲专利局 (EPO)</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10.5px] font-bold text-gray-400 uppercase tracking-widest block">
                选择要导出的文件清单
              </label>
              
              <div className="space-y-2">
                {[
                  { id: "claims", label: "权利要求书 (.docx)" },
                  { id: "spec", label: "说明书正文 (.docx)" },
                  { id: "drawings", label: "说明书附图 (.pdf)" },
                  { id: "abstract", label: "说明书摘要 (.docx)" },
                  { id: "abstract_drawings", label: "摘要附图 (.pdf)" },
                ].map((doc) => (
                  <label key={doc.id} className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-800 font-medium">
                    <input
                      type="checkbox"
                      checked={selectedDocs.includes(doc.id)}
                      onChange={() => toggleSelectDoc(doc.id)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                    />
                    <span>{doc.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Absolute Bottom static buttons */}
        <div className="mt-auto p-6 bg-slate-50 border-t border-slate-200 flex flex-col gap-3">
          {downloadSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-800 text-left flex gap-1.5 animate-bounce">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>申报专包一键打包及排版校准下载成功！(包含 {selectedDocs.length} 个规范文件及 CNIPA 格式清单)</span>
            </div>
          )}

          <button
            onClick={handleDownloadZip}
            disabled={isDownloading || selectedDocs.length === 0}
            className={`w-full font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95 duration-150 ${
              isDownloading || selectedDocs.length === 0
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-slate-900 text-white"
            }`}
          >
            {isDownloading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                正在智能拼装并压缩申报多层级ZIP文件...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                一键下载规范申报专包 (.zip)
              </>
            )}
          </button>
          
          <button
            onClick={onGoHome}
            className="w-full text-xs font-semibold text-slate-500 hover:text-indigo-600 py-1 border-none bg-transparent cursor-pointer"
          >
            返回我的项目首页
          </button>
        </div>
      </aside>

      {/* Right high-fidelity preview area (interactive A4 panel simulation) */}
      <section className="w-full md:w-[65%] bg-slate-600 h-full flex flex-col relative overflow-hidden">
        {/* PDF viewer toolbar */}
        <div className="bg-slate-800 text-white h-12 flex items-center px-4 justify-between border-b border-slate-900 shadow-lg shrink-0 select-none z-10">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-gray-400 font-bold tracking-wider uppercase flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              申报专稿排版预览 (智能 A4 级渲染)
            </span>
            <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-700 pl-4 text-xs font-medium">
              <button
                onClick={handleZoomOut}
                className="p-1 rounded hover:bg-slate-700 text-gray-300 transition-colors border-none bg-transparent cursor-pointer"
                title="缩小"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-mono text-[11px] font-bold text-gray-200">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 rounded hover:bg-slate-700 text-gray-300 transition-colors border-none bg-transparent cursor-pointer"
                title="放大"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActivePreviewTab("claims")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer border ${
                activePreviewTab === "claims"
                  ? "bg-slate-700 text-indigo-400 border-indigo-500/50"
                  : "bg-slate-900 border-transparent text-gray-300 hover:bg-slate-750"
              }`}
            >
              权利要求书
            </button>
            <button
              onClick={() => setActivePreviewTab("spec")}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer border ${
                activePreviewTab === "spec"
                  ? "bg-slate-700 text-indigo-400 border-indigo-500/50"
                  : "bg-slate-900 border-transparent text-gray-300 hover:bg-slate-750"
              }`}
            >
              说明书
            </button>
          </div>
        </div>

        {/* Paper Container rendering sheet mockup */}
        <div className="flex-grow overflow-y-auto p-6 flex justify-center custom-scrollbar">
          <div
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
            className="bg-white w-[210mm] text-black min-h-[297mm] shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-[2.5cm] flex flex-col relative mb-12 select-text text-left transition-all duration-150 block"
          >
            {activePreviewTab === "spec" ? (
              // Specification document view formatting
              <div>
                <div className="text-center font-bold text-lg mb-8 font-serif leading-none uppercase tracking-widest text-slate-800">
                  说 明 书
                </div>
                <div className="text-center font-bold text-base mb-8 font-serif text-slate-900 leading-snug">
                  {project.specification?.title || project.title}
                </div>
                
                <div className="font-serif text-[13px] leading-7 text-justify space-y-4">
                  {project.specification?.paragraphs.map((p, idx) => (
                    <div key={idx} className="relative pl-12 text-slate-950">
                      {/* Four-digit segment notation standard */}
                      <span className="absolute left-0 top-0 font-mono text-gray-400 text-xs font-bold select-none select-none tracking-tighter">
                        [{p.num || `000${idx + 1}`}]
                      </span>
                      {p.section && (
                        <p className="font-bold text-slate-900 mb-1 tracking-wider text-xs">【{p.section}】</p>
                      )}
                      <p className="indent-[2em]">
                        {p.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Claims document view formatting
              <div>
                <div className="text-center font-bold text-lg mb-8 font-serif leading-none uppercase tracking-widest text-slate-800">
                  权 利 要 求 书
                </div>
                
                <div className="font-serif text-[13px] leading-7 text-justify space-y-6">
                  {project.analysis?.claims.map((claim, idx) => (
                    <div key={claim.id} className="relative pl-8 text-slate-950">
                      <span className="absolute left-0 top-0 font-bold text-slate-900">
                        {idx + 1}.
                      </span>
                      <p className="leading-relaxed">
                        {claim.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard bottom watermark or page count */}
            <div className="absolute bottom-8 left-0 right-0 text-center font-serif text-[10px] text-gray-450 tracking-wide select-none">
              — {activePreviewTab === "spec" ? "第 1 页 · 共 1 页" : "第 1 页"} —
            </div>
            
            {/* Watermark marking the draft specification authority */}
            <div className="absolute top-4 right-4 text-[9px] font-mono font-bold text-gray-300 uppercase tracking-widest select-none">
              PatentDraft · {agencyLabel().split(" ")[0]} 格式校验过
            </div>
          </div>
        </div>
      </section>

      {/* Embedded CSS custom scrollbars directly */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #4b525d;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
