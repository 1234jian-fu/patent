---
title: PatentDraft
emoji: 🧾
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# PatentDraft 专利起草专家

面向课题组多人使用的中国专利写作网站，覆盖技术交底书解析、创新性查新、对比文件证据抓取、权利要求撰写建议、格式审查与导出预览。

## 核心能力

- 中国专利请求输入与对比文件 URL 抓取
- Word `.docx` 交底书/专利草稿上传解析，自动填入待申请技术方案并辅助生成查新词条
- 词条主导的多源公开查新：用确认后的关键词/词条检索 CNIPA、Google Patents、EPO、WIPO，Word 文件不作为爬取必需条件
- DeepSeek 驱动的创新性风险评估
- CNIPA 自动查新入口：生成语义检索块，调用 `patent-disclosure-skill` 国知局公布公告检索脚本并回填证据
- Top 对比文件、特征 1:1 对比和可主张创新点输出
- 查新结果页支持一键下载 Word 版创新性查新报告
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

## Hugging Face Spaces 部署

本项目按 Docker Space 部署，线上端口为 `7860`。Docker 镜像会自动安装 Node、Python、Playwright Chromium，并拉取 `handsomestWei/patent-disclosure-skill` 用于 CNIPA 查新脚本。

部署前在 Hugging Face Space 的 Settings -> Variables and secrets 中添加：

- `DEEPSEEK_API_KEY`：必填，作为 Secret 保存。
- `DEEPSEEK_BASE_URL`：可选，默认使用 DeepSeek OpenAI 兼容接口。
- `DEEPSEEK_MODEL`：可选，默认使用项目内配置。

不要上传 `.env.local` 或任何真实 API Key。仓库已通过 `.gitignore` 与 `.dockerignore` 排除 `.env*`。

使用 `hf` CLI 时可执行：

```bash
hf repos create <你的命名空间>/patentdraft --type space --space-sdk docker --private --exist-ok
hf upload <你的命名空间>/patentdraft . --type space --exclude ".env*" --exclude "node_modules/*" --exclude "dist/*" --exclude ".git/*" --commit-message "Deploy PatentDraft Docker Space"
```

## 校验

```bash
npm run lint
npm run build
```

## DOCX 导出

- `GET /api/docx/status`：检测 MiniMax `minimax-docx` 与 `.NET SDK` 状态。
- `POST /api/patent/export-docx-minimax`：优先使用 MiniMax OpenXML 管线导出；未安装 `.NET SDK` 时自动降级为 Node DOCX。
- `POST /api/patent/export-docx`：直接使用 Node DOCX 兼容导出。
- `POST /api/patent/export-novelty-report-docx`：根据当前查新结果导出 Word 版创新性查新报告。

## CNIPA 查新

- `POST /api/patent/import-disclosure`：上传课题组 Word `.docx` 交底书/专利草稿，解析正文、推断标题并填入查新输入。
- `POST /api/patent/search-blocks`：根据技术方案生成 2-8 个国知局检索语义块。
- `POST /api/patent/public-patent-search`：以关键词/词条为输入，同步生成 CNIPA、Google Patents、EPO、WIPO 的公开检索入口并尝试抓取页面证据；无需上传 Word 文件。
- `POST /api/patent/cnipa-search`：兼容旧入口，按词条分轮调用 `patent-disclosure-skill/tools/cnipa_epub_search.py`，并补充 Google Patents、EPO、WIPO 公开源抓取。
- `GET /api/cnipa/status`：检测 Python 与检索脚本是否就绪。若未安装 Playwright 或依赖，前端会显示失败原因，仍可使用人工证据或对比文件 URL 继续评估。
