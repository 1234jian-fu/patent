import { useState, useEffect, FormEvent } from "react";
import { Undo2, Redo2, Sparkles, AlertTriangle, Lightbulb, HelpCircle, ArrowRight, Plus, HelpCircle as HelpIcon, Trash2, CheckCircle2, RefreshCw } from "lucide-react";
import { PatentClaim, AIReviewSuggestion, PatentProject } from "../types";

interface ClaimEditorProps {
  project: PatentProject;
  onSaveAndNext: (updatedClaims: PatentClaim[]) => void;
  onBack: () => void;
}

export default function ClaimEditor({ project, onSaveAndNext, onBack }: ClaimEditorProps) {
  const [claims, setClaims] = useState<PatentClaim[]>([]);
  const [activeRightTab, setActiveRightTab] = useState<"disclosure" | "ai" | "tag font">("ai");
  const [disclosureText, setDisclosureText] = useState("");
  const [suggestions, setSuggestions] = useState<AIReviewSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [expandingClaimId, setExpandingClaimId] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [history, setHistory] = useState<PatentClaim[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Drawing Markups List
  const [drawingTags, setDrawingTags] = useState<{ id: string; name: string; label: string }[]>([
    { id: "1", name: "聚酰亚胺复合基底", label: "100" },
    { id: "2", name: "微纳级蜂窝缓冲层", label: "200" },
    { id: "3", name: "单孔凹腔结构", label: "210" },
    { id: "4", name: "柔性发光模组", label: "300" },
    { id: "5", name: "低温亚胺固化炉", label: "400" },
  ]);

  const [newTag, setNewTag] = useState({ name: "", label: "" });

  useEffect(() => {
    if (project.analysis && project.analysis.claims) {
      setClaims(project.analysis.claims);
      setHistory([project.analysis.claims]);
      setHistoryIndex(0);
    }
    setDisclosureText(project.disclosureText || "");
    fetchSuggestions(project.analysis?.claims || []);
  }, [project]);

  const fetchSuggestions = async (claimList: PatentClaim[]) => {
    if (claimList.length === 0) return;
    setLoadingSuggestions(true);
    try {
      const res = await fetch("/api/ai-claim-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claims: claimList }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (e) {
      console.error("Failed to load claims advice:", e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const updateClaimsWithHistory = (newClaims: PatentClaim[]) => {
    setClaims(newClaims);
    const updatedHist = history.slice(0, historyIndex + 1);
    setHistory([...updatedHist, newClaims]);
    setHistoryIndex(updatedHist.length);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setClaims(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setClaims(history[historyIndex + 1]);
    }
  };

  const handleClaimTextChange = (id: number, text: string) => {
    const updated = claims.map((c) => (c.id === id ? { ...c, text } : c));
    updateClaimsWithHistory(updated);
  };

  const handleAddClaim = (type: "independent" | "dependent") => {
    const newId = claims.length > 0 ? Math.max(...claims.map((c) => c.id)) + 1 : 1;
    let newClaim: PatentClaim;
    if (type === "independent") {
      newClaim = {
        id: newId,
        type: "independent",
        ref: 0,
        text: `一种用于...的新型系统，其特征在于，包括：数据计算模块，用于...从而完成主要优化工艺。`,
      };
    } else {
      // Points reference to the first independent claim typically
      const firstInd = claims.find((c) => c.type === "independent")?.id || 1;
      newClaim = {
        id: newId,
        type: "dependent",
        ref: firstInd,
        text: `根据权利要求${firstInd}所述的新型系统，其特征在于，所述...还具有如下特征...`,
      };
    }
    updateClaimsWithHistory([...claims, newClaim]);
  };

  const handleDeleteClaim = (id: number) => {
    const remaining = claims.filter((c) => c.id !== id);
    updateClaimsWithHistory(remaining);
  };

  // AI claims expand
  const handleAIExpand = async (id: number) => {
    setExpandingClaimId(id);
    const claim = claims.find((c) => c.id === id);
    if (!claim) return;

    try {
      const res = await fetch("/api/ai-expand-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimText: claim.text, promptText: aiPrompt }),
      });
      const data = await res.json();
      if (data.expandedText) {
        handleClaimTextChange(id, data.expandedText);
        setAiPrompt("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExpandingClaimId(null);
    }
  };

  const applyAISuggestion = (sug: AIReviewSuggestion) => {
    if (sug.original && claims.length > 0) {
      // Find the first claim matching the original warning segment
      const idx = claims.findIndex((c) => c.text.includes(sug.original!));
      if (idx !== -1) {
        const replacement = claims[idx].text.replace(sug.original, sug.suggestion);
        handleClaimTextChange(claims[idx].id, replacement);
        // Remove applied suggestion
        setSuggestions(suggestions.filter((s) => s.title !== sug.title));
        return;
      }
    }

    // Otherwise append as a new sub claim
    const firstInd = claims.find((c) => c.type === "independent")?.id || 1;
    const newId = claims.length > 0 ? Math.max(...claims.map((c) => c.id)) + 1 : 1;
    const newC: PatentClaim = {
      id: newId,
      type: "dependent",
      ref: firstInd,
      text: sug.suggestion.startsWith("根据权利要求") 
        ? sug.suggestion 
        : `根据权利要求${firstInd}所述的新型系统，其特征在于，${sug.suggestion}`,
    };
    updateClaimsWithHistory([...claims, newC]);
    setSuggestions(suggestions.filter((s) => s.title !== sug.title));
  };

  const handleAddTag = (e: FormEvent) => {
    e.preventDefault();
    if (!newTag.name || !newTag.label) return;
    setDrawingTags([...drawingTags, { id: Date.now().toString(), ...newTag }]);
    setNewTag({ name: "", label: "" });
  };

  const handleRemoveTag = (id: string) => {
    setDrawingTags(drawingTags.filter((t) => t.id !== id));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50 w-full text-left">
      {/* Sub-header Tracker Progress bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex-shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2 text-xs text-gray-400 font-medium">
          <span className="flex items-center text-emerald-600 gap-1 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" /> 
            1. 查新评估
          </span>
          <span className="text-gray-300">/</span>
          <span className="flex items-center text-indigo-600 gap-1 font-bold">
            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px]">
              2
            </span> 
            2. 权利要求书
          </span>
          <span className="text-gray-300">/</span>
          <span className="flex items-center text-gray-500">
            <span className="w-5 h-5 rounded-full border border-slate-300 text-gray-400 flex items-center justify-center font-bold text-[10px] mr-1">
              3
            </span> 
            3. 说明书正文
          </span>
          <span className="text-gray-300">/</span>
          <span className="flex items-center text-gray-500">
            <span className="w-5 h-5 rounded-full border border-slate-300 text-gray-400 flex items-center justify-center font-bold text-[10px] mr-1">
              4
            </span> 
            4. 排版审查与导出
          </span>
          
          <button onClick={onBack} className="text-xs text-slate-500 hover:text-indigo-600 ml-auto font-medium transition-colors">
            ← 修改交底书
          </button>
        </div>
      </div>

      {/* Main Split IDE workspace layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left editor segment */}
        <section className="w-[58%] md:w-[62%] bg-white border-r border-slate-200 flex flex-col relative h-full">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/40 shrink-0">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">权利要求书在线编辑器</h2>
              <p className="text-gray-400 text-xs mt-0.5">权利要求是专利的核心发权范围，请保持句法专业且逻辑排斥严密</p>
            </div>
            
            {/* Undo/Redo controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
                title="撤销 (Ctrl+Z)"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg transition-colors cursor-pointer"
                title="重做"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actual Claims List Panel */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin pb-28">
            {claims.length === 0 ? (
              <div className="text-center py-20 text-gray-400 text-sm">
                目前无权利要求，请点击下方添加按钮
              </div>
            ) : (
              claims.map((claim, idx) => (
                <div 
                  key={claim.id}
                  className="group relative bg-slate-50 border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all p-4 rounded-xl flex items-start gap-4"
                >
                  {/* Number index badge */}
                  <span className={`w-6 h-6 rounded-lg text-xs font-bold shrink-0 flex items-center justify-center ${
                    claim.type === "independent" 
                      ? "bg-indigo-600 text-white shadow-sm" 
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {idx + 1}
                  </span>

                  <div className="flex-grow flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                        claim.type === "independent"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {claim.type === "independent" ? "独立权利要求" : "从属权利要求"}
                      </span>
                      {claim.type === "dependent" && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          引用权利要求 {claims.findIndex((c) => c.id === claim.ref) + 1}
                        </span>
                      )}
                    </div>

                    <textarea
                      value={claim.text}
                      onChange={(e) => handleClaimTextChange(claim.id, e.target.value)}
                      rows={4}
                      className="w-full text-slate-800 text-sm leading-relaxed bg-white border border-slate-100 focus:border-indigo-400 rounded-lg p-3 outline-none resize-none shadow-inner"
                    />

                    {/* Expand utility section */}
                    <div className="mt-1">
                      {expandingClaimId === claim.id ? (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center gap-3 text-xs text-indigo-800">
                          <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-indigo-600" />
                          <span>Gemini AI 正在极速生成扩充，大约需要几秒钟，请稍等...</span>
                        </div>
                      ) : (
                        <div className="hidden group-hover:flex items-center gap-2 bg-slate-100 p-2 rounded-lg mt-1 w-full border border-slate-200/60">
                          <input
                            type="text"
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder="输入AI扩写要求 (例如: 补充具有正六边形截面、内径80-150nm尺寸)"
                            className="flex-grow bg-white border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-800 outline-none"
                          />
                          <button
                            onClick={() => handleAIExpand(claim.id)}
                            className="bg-indigo-600 hover:bg-slate-900 text-white font-semibold text-xs px-3 py-1 rounded cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <Sparkles className="w-3 h-3" />
                            AI 智能扩写
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right delete controller */}
                  <button
                    onClick={() => handleDeleteClaim(claim.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-all absolute right-2 top-2 cursor-pointer"
                    title="删除该条款"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}

            {/* Append claims buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => handleAddClaim("independent")}
                className="flex-1 py-3 border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30 text-indigo-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                新增主体独立权利要求 (Independent)
              </button>
              <button
                onClick={() => handleAddClaim("dependent")}
                className="flex-1 py-3 border-2 border-dashed border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                新增从属权利要求 (Dependent)
              </button>
            </div>
          </div>

          {/* Absolute floating bottom action block */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/95 border-t border-slate-100 flex justify-end z-10 backdrop-blur">
            <button
              onClick={() => onSaveAndNext(claims)}
              className="bg-indigo-600 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 active:scale-95"
            >
              <span>保存并生成说明书正文</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Right assistant display pane */}
        <section className="w-[42%] md:w-[38%] bg-slate-50 flex flex-col h-full border-l border-slate-200">
          {/* Header custom tabs */}
          <div className="flex bg-white border-b border-slate-200 flex-shrink-0 text-xs">
            <button
              onClick={() => setActiveRightTab("disclosure")}
              className={`flex-1 py-3.5 text-center font-bold relative transition-all cursor-pointer ${
                activeRightTab === "disclosure" ? "text-indigo-600 bg-slate-50/50" : "text-gray-500 hover:text-slate-800"
              }`}
            >
              技术交底书
              {activeRightTab === "disclosure" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
            </button>
            <button
              onClick={() => setActiveRightTab("ai")}
              className={`flex-1 py-3.5 text-center font-bold relative transition-all cursor-pointer flex items-center justify-center gap-1 ${
                activeRightTab === "ai" ? "text-indigo-600 bg-slate-50/50" : "text-gray-500 hover:text-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI 撰写建议
              {suggestions.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {suggestions.length}
                </span>
              )}
              {activeRightTab === "ai" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
            </button>
            <button
              onClick={() => setActiveRightTab("tag font")}
              className={`flex-1 py-3.5 text-center font-bold relative transition-all cursor-pointer ${
                activeRightTab === "tag font" ? "text-indigo-600 bg-slate-50/50" : "text-gray-500 hover:text-slate-800"
              }`}
            >
              附图标记
              {activeRightTab === "tag font" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
            </button>
          </div>

          {/* Tab active layout display */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Tech Disclosure Textarea view */}
            {activeRightTab === "disclosure" && (
              <div className="flex flex-col gap-2 h-full">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest pl-1">
                  原始技术交底书参考
                </div>
                <textarea
                  value={disclosureText}
                  onChange={(e) => setDisclosureText(e.target.value)}
                  className="w-full flex-grow text-slate-700 text-xs leading-relaxed bg-white border border-slate-250 p-4 rounded-xl shadow-inner min-h-[300px] outline-none"
                  placeholder="可在此处随时编辑您的技术交底书作为参考..."
                />
              </div>
            )}

            {/* AI Review Suggestions lists */}
            {activeRightTab === "ai" && (
              <div className="space-y-4">
                {loadingSuggestions ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center gap-3">
                    <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin" />
                    <span className="text-xs text-slate-500 font-semibold">Gemini 审查模块进行多维合规性评估...</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-emerald-800 text-xs flex gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                    <div className="text-left">
                      <p className="font-semibold">段落结构规范合规，未见显著风险</p>
                      <p className="mt-1 text-emerald-600">
                        目前权利要求书的法言法语极度符合专利审查通则，包含发明所属技术要件、前序及特征段。
                      </p>
                    </div>
                  </div>
                ) : (
                  suggestions.map((sug, i) => (
                    <div 
                      key={i} 
                      className={`border-l-4 rounded-r-xl p-4 bg-white shadow-sm border ${
                        sug.type === "warning" ? "border-amber-400 border-l-amber-500" : "border-slate-200 border-l-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-3 text-left">
                        {sug.type === "warning" ? (
                          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Lightbulb className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-grow">
                          <h4 className="font-bold text-sm text-slate-900 mb-1">{sug.title}</h4>
                          <p className="text-gray-500 text-xs leading-relaxed mb-3">
                            {sug.desc}
                          </p>
                          
                          {sug.original && (
                            <div className="bg-slate-50 border border-slate-150 p-2 rounded-lg text-[11px] font-mono text-slate-600 mb-3 leading-dashed line-through">
                              {sug.original}
                            </div>
                          )}
                          
                          <div className="bg-emerald-50/50 border border-emerald-100 p-2.5 rounded-lg text-xs font-mono text-emerald-800 mb-3 leading-relaxed">
                            <span className="font-semibold block text-[10px] text-emerald-600 mb-1">💡 推荐推荐写法：</span>
                            {sug.suggestion}
                          </div>

                          <button
                            onClick={() => applyAISuggestion(sug)}
                            className="bg-indigo-600 hover:bg-slate-950 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" />
                            应用建议 / 插入新条款
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Drawing Markups mapping */}
            {activeRightTab === "tag font" && (
              <div className="space-y-4 text-left">
                <div>
                  <h3 className="font-bold text-xs text-slate-800 mb-1">说明书附图标记参考词条</h3>
                  <p className="text-gray-400 text-[10.5px]">词条的一致性校验，防范在说明书中标记发生冲突，审查段落将自动进行合规性验证。</p>
                </div>

                {/* Form to add drawing tags */}
                <form onSubmit={handleAddTag} className="bg-white border border-slate-200 rounded-xl p-3 flex gap-2">
                  <input
                    type="text"
                    value={newTag.name}
                    onChange={(e) => setNewTag({ ...newTag, name: e.target.value })}
                    placeholder="标记项 (如 聚酰亚胺复合基底)"
                    className="flex-grow text-xs border border-slate-200 rounded px-2 py-1 bg-white outline-none"
                  />
                  <input
                    type="text"
                    value={newTag.label}
                    onChange={(e) => setNewTag({ ...newTag, label: e.target.value })}
                    placeholder="序号 (如 100)"
                    className="w-16 text-xs border border-slate-200 rounded px-2 py-1 bg-white outline-none text-center"
                  />
                  <button type="submit" className="bg-slate-900 border-none hover:bg-indigo-600 text-white p-1 rounded transition-colors flex items-center justify-center cursor-pointer">
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                {/* Tags lists */}
                <div className="bg-white border border-slate-200 rounded-xl p-2 divide-y divide-slate-100">
                  {drawingTags.map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between py-2 px-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] font-mono w-10 text-center">
                          {tag.label}
                        </span>
                        <span className="text-slate-800 font-semibold">{tag.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag.id)}
                        className="text-gray-400 hover:text-red-500 bg-transparent border-none cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
