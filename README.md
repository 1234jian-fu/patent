# PatentDraft 专利起草专家

面向课题组的中国专利写作工作台，覆盖技术交底书解析、创新性查新、对比文件证据抓取、权利要求撰写建议、格式审查与导出预览。

## 核心能力

- 中国专利请求输入与对比文件 URL 抓取
- DeepSeek 驱动的创新性风险评估
- Top 对比文件、特征 1:1 对比和可主张创新点输出
- 集成 `handsomestWei/patent-disclosure-skill` 的专利点挖掘、交底书大纲、自检风险和交付命名规则
- 集成 MiniMax `minimax-docx` 工作流入口，并提供交底书 `.docx` 下载能力
- 五页一致工作流：工作台、创新性查询、查新结果、智能撰写、格式导出

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
