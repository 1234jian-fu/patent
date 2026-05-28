import { ShieldAlert, Info, HelpCircle } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-50 border-t border-gray-200 w-full mt-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-8 max-w-7xl mx-auto gap-4 text-sm text-gray-500 w-full">
        <div className="font-medium text-gray-600 flex items-center gap-1">
          <span>© {currentYear} 专利起草专家 (PatentDraft)</span>
          <span className="text-gray-300">|</span>
          <span className="text-xs text-gray-400">专业级AI专利撰写工作台</span>
        </div>
        <div className="flex gap-6">
          <a className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium hover:underline text-xs" href="#privacy">
            隐私政策
          </a>
          <a className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium hover:underline text-xs" href="#terms">
            服务条款
          </a>
          <a className="text-gray-500 hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium hover:underline text-xs" href="#help">
            帮助中心
          </a>
        </div>
      </div>
    </footer>
  );
}
