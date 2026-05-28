import { useState, FormEvent } from "react";
import { User, Shield, Key, Bell, CheckCircle } from "lucide-react";

export function SettingsView() {
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiKeySet, setApiKeySet] = useState(true);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full text-left py-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">代理人设置</h1>
        <p className="text-gray-500 text-sm mt-1">定制您的专利起草偏好、AI审查敏感度以及数据库联动特性。</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          {/* User profile */}
          <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
            <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200">
              <img 
                alt="Avatar" 
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCr0n4xCiWy086IUHIv5oOEKWF_qCFamF6zsbYJfrm7Axkd42N9cZzg9jmXdxQS--854G741b019UFznthze9A_bS7-fOV117BfZ3g8U4-PIrkES_hlLzbosjIZN8fChWKR-CvEv0OaNzGJHQiCQj9SFoNUCeyRYMNpGQ47JLy-hNRMM03rdyZTtWASwFNRdwgZn9V1hST6-mED9J59edInVpNUjAcIyFS5kHyA2pHHpcX0lQ-1Nuck5nZB_PNVEwpZ9IJmazK51UNy"
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">测试用户 (2958241221@qq.com)</h3>
              <p className="text-gray-400 text-xs">高级专利代理师 · 知识产权合伙人</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Key className="w-3.5 h-3.5" />
              API 主要密钥管理
            </h4>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800">Gemini 专家智能 API 密钥：</span>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                  已自动安全联动
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                AI Studio 开发平台已自动为您安全注入专属的 <code className="bg-white px-1 py-0.5 border border-slate-150 rounded">GEMINI_API_KEY</code> 密钥。应用将极速、免登录地代理高级比对、扩写与正文组装。
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5" />
              中国国家知识产权局 (CNIPA) 申报偏好
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold">首选排版模板</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none">
                  <option>CNIPA 中文标准二栏 (0001排版段)</option>
                  <option>PCT/WIPO 世界标准正序排版</option>
                  <option>USPTO 英文摘要前置格式</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold">主从引用警告灵敏度</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none">
                  <option>极高（严格遵循中国细项通则审查标准）</option>
                  <option>适中（宽容泛词与同义指引词）</option>
                  <option>关闭</option>
                </select>
              </div>
            </div>
          </div>

          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-emerald-800 text-xs flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>偏好设置更新并成功保存至本地！</span>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-slate-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              保存修改
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
