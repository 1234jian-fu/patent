import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, CheckCircle, Trash2, Calendar, Globe, AlertCircle, Loader } from "lucide-react";
import { PatentProject } from "../types";

interface NoveltyQueryProps {
  onBack: () => void;
  onSubmit: (title: string, text: string, databases: string[], startDate: string, endDate: string) => void;
  loading: boolean;
}

export default function NoveltyQuery({ onBack, onSubmit, loading }: NoveltyQueryProps) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [databases, setDatabases] = useState<string[]>(["全球", "中国"]);
  const [startDate, setStartDate] = useState("2020-01-01");
  const [endDate, setEndDate] = useState("2026-05-28");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>({
    name: "智能负载均衡系统交底书_v2.docx",
    size: "42.8 KB"
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setUploadedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB"
      });
      // Set title if empty
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + " KB"
      });
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleDatabase = (db: string) => {
    if (databases.includes(db)) {
      setDatabases(databases.filter((d) => d !== db));
    } else {
      setDatabases([...databases, db]);
    }
  };

  const handleAutoFillDemo = () => {
    setTitle("一种基于人工智能的低能耗柔性OLED显示面板结构工艺");
    setText(`技术公开重点：
本发明涉及一种用于柔性OLED显示屏的高耐候聚酰亚胺(PI)复合树脂基底，具有超低能耗物理温度固化特性，工艺条件在 150~180℃ 即可。
主要技术成分：
1. 聚酰亚胺主体树脂成分A与纳米级氧化硅气溶胶增强填料成分B配比极具稳定性，优选固含量质量配比范围控制在极其精确的 3:1 (A与B质量比 = 3:1)。而通常工业常规比例是 1:1。
2. 缓冲层设计：在PI复合基底的中部上表面，依靠高能刻蚀反应制备蜂窝状由无数微气囊构成的缓冲释放阵列。该缓冲空间可避免折弯时产生滑移剪切，提升一倍以上弯折疲劳限制寿命。
3. 高效固化工艺：采用了极其独特的低温多段程序式逐步分子重整，使得即使不经历 250℃ 以上传统退火固化，也能通过 160℃ 的逐步交联制成结实柔性膜。能耗节约达 40% 以上，良率上升了 12%。`);
    setUploadedFile({
      name: "低能耗柔性OLED面板新型基底交底书_v1.docx",
      size: "74.2 KB"
    });
  };

  const handleSubmit = () => {
    let finalTitle = title.trim();
    if (!finalTitle) {
      finalTitle = uploadedFile ? uploadedFile.name.replace(/\.[^/.]+$/, "") : "未命名新型智能系统项目";
    }
    onSubmit(finalTitle, text, databases, startDate, endDate);
  };

  return (
    <div className="flex flex-col items-center justify-start max-w-3xl mx-auto w-full py-2">
      {/* Back Header */}
      <div className="w-full flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="text-gray-500 hover:text-indigo-600 font-semibold text-sm flex items-center gap-1 transition-colors border-none bg-transparent cursor-pointer"
        >
          ← 返回我的项目
        </button>
        <button
          onClick={handleAutoFillDemo}
          className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-bold px-3 py-1.5 rounded-lg transition-all"
        >
          ✨ 填入展示交底书 Demo
        </button>
      </div>

      {/* Header text */}
      <div className="w-full text-center md:text-left mb-6">
        <h1 className="text-2xl md:text-3.5xl font-extrabold text-slate-900 tracking-tight mb-2">
          新建创新性查询
        </h1>
        <p className="text-gray-500 text-sm md:text-base leading-relaxed">
          上传您的技术交底书文本或直接提供核心设计描述，强大的 Gemini 专家智能模型将自动提取核心发明特征并进行全球文献比对。
        </p>
      </div>

      {/* Title Field */}
      <div className="w-full mb-6">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          项目技术名称
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="请输入技术项目名称 (例如: 一种基于人工智能的低能耗柔性OLED显示面板结构)"
          className="w-full px-4 py-3 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white rounded-xl placeholder-slate-400 text-slate-800 text-sm outline-none transition-all"
        />
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-2xl p-8 mb-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group relative ${
          isDragOver
            ? "border-indigo-500 bg-indigo-50/50"
            : "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".docx,.pdf,.txt"
          className="hidden"
        />
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform duration-200 text-indigo-600">
          <Upload className="w-6 h-6" />
        </div>
        <p className="font-semibold text-sm text-slate-800 mb-1">
          点击或将 Word/PDF 交底书文档拖拽到此处
        </p>
        <p className="text-gray-400 text-xs">支持 .docx, .pdf, .txt 格式 (可填Demo自动填充)</p>
      </div>

      {/* Uploaded Files state indicator */}
      {uploadedFile && (
        <div className="w-full bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
              <FileText className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-900 truncate max-w-sm md:max-w-md">
                {uploadedFile.name}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>已就绪 · 已通过文档排版解析 ({uploadedFile.size})</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleRemoveFile}
            className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="移除文件"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Textarea for direct text content */}
      <div className="w-full mb-6">
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          交底书详细说明 (可手写输入)
        </label>
        <textarea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="请在上方上传文件、或者直接在此处粘贴或撰写技术交底书。请包含技术特征、主要结构配比、参数以及工艺流等核心发明点，有助于 AI 模型极度精准比对创新性特征..."
          className="w-full px-4 py-3 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white rounded-xl placeholder-slate-400 text-slate-800 text-sm outline-none transition-all resize-y"
        ></textarea>
      </div>

      {/* Search Options Card */}
      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="w-1 h-4 bg-indigo-600 rounded-full"></div>
          <h2 className="font-semibold text-sm text-slate-900">检索参数设置</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* DB Scope */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              检索数据库范围
            </label>
            <div className="flex flex-wrap gap-4">
              {["全球", "中国", "美国", "欧洲"].map((db) => (
                <label key={db} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={databases.includes(db)}
                    onChange={() => toggleDatabase(db)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                  />
                  <span className="text-sm text-slate-800 font-medium">{db}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              时间跨度 (公开日)
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white rounded-lg text-xs outline-none text-slate-800"
                />
              </div>
              <span className="text-gray-400 text-xs">-</span>
              <div className="relative flex-grow">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white rounded-lg text-xs outline-none text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="w-full flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={loading || (!text.trim() && !title.trim())}
          className={`font-semibold px-8 py-3.5 rounded-xl shadow-md flex items-center gap-2 active:scale-95 transition-all text-sm cursor-pointer ${
            loading || (!text.trim() && !title.trim())
              ? "bg-slate-200 text-slate-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-slate-900 text-white"
          }`}
        >
          {loading ? (
            <>
              <Loader className="w-4.5 h-4.5 animate-spin" />
              正在提取核心发明特征并开启查新...
            </>
          ) : (
            <>
              🚀 提取核心特征并开启智能查新
            </>
          )}
        </button>
      </div>

      <div className="w-full mt-4 flex items-center gap-2 bg-amber-50 rounded-xl p-3 border border-amber-100 text-left text-xs text-amber-800">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>提取查新通过对文献的结构、配比、工艺顺序提取后多维全网库检索比对。推荐尝试一键填入 “Demo-柔性OLED工艺” 进行直观测试。</span>
      </div>
    </div>
  );
}
