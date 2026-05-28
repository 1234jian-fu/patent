import { Search, Edit, FileText, FileCheck, HelpCircle, ArrowRight } from "lucide-react";

interface ToolboxViewProps {
  onSelectNovelty: () => void;
  onSelectDraft: () => void;
}

export function ToolboxView({ onSelectNovelty, onSelectDraft }: ToolboxViewProps) {
  const tools = [
    {
      title: "智能创新性查新 (智能全球比对)",
      desc: "利用 AI 技术对您上传的交底书进行多语言检索，智能提取特征，多维打分并进行相似性公开文献比对。",
      icon: <Search className="w-5 h-5 text-indigo-600" />,
      action: onSelectNovelty,
      badge: "推荐"
    },
    {
      title: "在线权利要求书工作台",
      desc: "支持中国及全球法言法语规范的交互式编辑器，内置一键 AI 自动词条扩写和格式审查机制。",
      icon: <Edit className="w-5 h-5 text-emerald-600" />,
      action: onSelectDraft,
      badge: "热点"
    },
    {
      title: "检索参数及温度标定",
      desc: "快速建立您的习惯检索数据库，包括 CNIPA, USPTO, EPO, WIPO 数据库的一键偏属开关配置。",
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      action: onSelectNovelty,
    },
    {
      title: "智能格式及审查报告",
      desc: "检测段落不连续风险、引用层级缺失、附图标记一致性漏洞，助您直接通过CNIPA格式大考。",
      icon: <FileCheck className="w-5 h-5 text-purple-600" />,
      action: onSelectDraft,
    }
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full text-left py-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">专利工具箱</h1>
        <p className="text-gray-500 text-sm mt-1">
          探索更多专业级 AI 工具辅助您极速、精准地撰写高质量、无可宣告无效的专利文稿。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {tools.map((tool, idx) => (
          <div
            key={idx}
            className="bg-white border border-slate-200 hover:border-indigo-400 p-6 rounded-2xl hover:shadow-sm transition-all flex flex-col items-start gap-4 relative group"
          >
            {tool.badge && (
              <span className="absolute top-4 right-4 bg-orange-50 border border-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full select-none">
                {tool.badge}
              </span>
            )}

            <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors">
              {tool.icon}
            </div>

            <div>
              <h3 className="font-bold text-slate-950 text-base mb-1">{tool.title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{tool.desc}</p>
            </div>

            <button
              onClick={tool.action}
              className="text-xs text-indigo-600 font-bold flex items-center gap-1 group-hover:gap-1.5 transition-all mt-auto pt-2 bg-transparent border-none cursor-pointer"
            >
              了解详情 / 立即启用
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
