import { Bell, ShieldAlert, Sparkles } from "lucide-react";

interface TopNavBarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onGoHome: () => void;
}

export default function TopNavBar({ currentTab, onTabChange, onGoHome }: TopNavBarProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="flex justify-between items-center h-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Logo and App Title */}
        <div className="flex items-center gap-8">
          <button 
            onClick={onGoHome}
            className="font-bold text-2xl tracking-tight text-slate-900 border-none bg-transparent cursor-pointer flex items-center gap-2 hover:opacity-90 active:scale-95 transition-transform"
          >
            <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
            <span className="bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent font-extrabold">
              专利起草专家
            </span>
          </button>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-6 h-16 items-center">
            <button
              onClick={() => onTabChange("dashboard")}
              className={`font-medium text-sm h-full flex items-center px-1 border-b-2 transition-all cursor-pointer ${
                currentTab === "dashboard" || currentTab === "edit" || currentTab === "novelty" || currentTab === "result" || currentTab === "format"
                  ? "text-indigo-600 border-indigo-600 font-semibold"
                  : "text-gray-500 border-transparent hover:text-indigo-600 hover:border-gray-200"
              }`}
            >
              我的项目
            </button>
            <button
              onClick={() => onTabChange("toolbox")}
              className={`font-medium text-sm h-full flex items-center px-1 border-b-2 transition-all cursor-pointer ${
                currentTab === "toolbox"
                  ? "text-indigo-600 border-indigo-600 font-semibold"
                  : "text-gray-500 border-transparent hover:text-indigo-600 hover:border-gray-200"
              }`}
            >
              工具箱
            </button>
            <button
              onClick={() => onTabChange("settings")}
              className={`font-medium text-sm h-full flex items-center px-1 border-b-2 transition-all cursor-pointer ${
                currentTab === "settings"
                  ? "text-indigo-600 border-indigo-600 font-semibold"
                  : "text-gray-500 border-transparent hover:text-indigo-600 hover:border-gray-200"
              }`}
            >
              设置
            </button>
          </nav>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-50 rounded-full transition-colors active:scale-95 duration-150 cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>
          
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden border border-gray-200 hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer">
              <img 
                alt="用户头像" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr0n4xCiWy086IUHIv5oOEKWF_qCFamF6zsbYJfrm7Axkd42N9cZzg9jmXdxQS--854G741b019UFznthze9A_bS7-fOV117BfZ3g8U4-PIrkES_hlLzbosjIZN8fChWKR-CvEv0OaNzGJHQiCQj9SFoNUCeyRYMNpGQ47JLy-hNRMM03rdyZTtWASwFNRdwgZn9V1hST6-mED9J59edInVpNUjAcIyFS5kHyA2pHHpcX0lQ-1Nuck5nZB_PNVEwpZ9IJmazK51UNy"
              />
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-gray-700">测试用户</span>
              <span className="text-[10px] text-gray-400">高级专利代理人</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
