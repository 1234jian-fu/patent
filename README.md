# PatentDraft 专利起草专家

面向课题组多人使用的中国专利写作网站，覆盖技术交底书解析、创新性查新、对比文件证据抓取、权利要求撰写建议、格式审查与导出预览。

## 核心能力

- 中国专利请求输入与对比文件 URL 抓取
- DeepSeek 驱动的创新性风险评估
- Top 对比文件、特征 1:1 对比和可主张创新点输出
- 集成 `handsomestWei/patent-disclosure-skill` 的专利点挖掘、交底书大纲、自检风险和交付命名规则
- 集成 `Oscima2026/china-patent-drafter-skill` 的中国发明专利写法规则：权利要求策略、摘要、说明书、摘要图、审查提示和保护点强化建议
- 集成 MiniMax `minimax-docx` 严格 DOCX 工作流入口；服务器安装 `.NET SDK` 后走 OpenXML 创建、merge-runs 与 XSD 校验，未安装时自动降级为 Node DOCX
- 五页一致工作流：工作台、创新性查询、查新结果、智能撰写、格式导出

当前版本先不包含登录、课题组权限和用户管理；部署给课题组使用时建议先放在内网或受控访问环境中。

## 本地运行

1. 安装依赖：
   ```bash
   npm install
   ```
2. 复制 `.env.example` 为 `.env.local`，填写 `DEEPSEEK_API_KEY`。
3. 启动开发服务：
   ```bash
   npm run dev
   ```
4. 打开 `http://localhost:3000`。

## 校验

```bash
npm run lint
npm run build
```

## DOCX 导出

- `GET /api/docx/status`：检测 MiniMax `minimax-docx` 与 `.NET SDK` 状态。
- `POST /api/patent/export-docx-minimax`：优先使用 MiniMax OpenXML 管线导出；未安装 `.NET SDK` 时自动降级为 Node DOCX。
- `POST /api/patent/export-docx`：直接使用 Node DOCX 兼容导出。
