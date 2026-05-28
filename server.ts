import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

type ChatRole = "system" | "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface DeepSeekChatOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormatJson?: boolean;
}

interface CrawledPatentDocument {
  url: string;
  source: string;
  title: string;
  excerpt: string;
  fetchedAt: string;
}

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

function getDeepSeekApiKey() {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not configured.");
  }
  return apiKey;
}

async function callDeepSeek(options: DeepSeekChatOptions) {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getDeepSeekApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: options.messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2000,
      ...(options.responseFormatJson ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DeepSeek API ${response.status}: ${body}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("DeepSeek API returned an empty response.");
  }

  return content;
}

function assertHttpUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }
  return url;
}

function detectPatentSource(hostname: string) {
  const host = hostname.toLowerCase();
  if (host.includes("cnipa.gov.cn") || host.includes("pss-system.cponline.cnipa.gov.cn")) return "CNIPA";
  if (host.includes("patentscope.wipo.int")) return "WIPO";
  if (host.includes("worldwide.espacenet.com") || host.includes("epo.org")) return "EPO";
  if (host.includes("patents.google.com")) return "Google Patents";
  if (host.includes("uspto.gov")) return "USPTO";
  return hostname;
}

function extractTitle(html: string) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return normalizeText(titleMatch?.[1] || "未识别标题").slice(0, 120);
}

function normalizeText(text: string) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function crawlPatentDocument(rawUrl: string): Promise<CrawledPatentDocument> {
  const url = assertHttpUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "PatentDraft/1.0 novelty-assessment crawler",
        Accept: "text/html,application/xhtml+xml,application/xml,text/plain;q=0.9,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      throw new Error(`Fetch ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const title = extractTitle(html);
    const excerpt = normalizeText(html).slice(0, 9000);

    return {
      url: url.toString(),
      source: detectPatentSource(url.hostname),
      title,
      excerpt,
      fetchedAt: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

app.get("/api/ai/status", (_req, res) => {
  res.json({
    provider: "deepseek",
    configured: Boolean(process.env.DEEPSEEK_API_KEY),
    model: DEEPSEEK_MODEL,
    baseUrl: DEEPSEEK_BASE_URL,
  });
});

app.post("/api/deepseek/chat", async (req, res) => {
  try {
    const { prompt, systemPrompt, messages, temperature, responseFormatJson } = req.body;
    const normalizedMessages: ChatMessage[] = Array.isArray(messages)
      ? messages
      : [
          ...(systemPrompt ? [{ role: "system" as const, content: String(systemPrompt) }] : []),
          { role: "user", content: String(prompt || "") },
        ];

    if (!normalizedMessages.some((message) => message.content.trim())) {
      return res.status(400).json({ error: "Missing prompt or messages." });
    }

    const content = await callDeepSeek({
      messages: normalizedMessages,
      temperature,
      responseFormatJson,
    });

    res.json({ content });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/disclosure/analyze", async (req, res) => {
  try {
    const { title, disclosureText, projectContext } = req.body;
    const userContent = String(disclosureText || projectContext || "").trim();

    if (!userContent) {
      return res.status(400).json({ error: "Missing disclosureText or projectContext." });
    }

    const content = await callDeepSeek({
      responseFormatJson: true,
      temperature: 0.2,
      maxTokens: 3000,
      messages: [
        {
          role: "system",
          content:
            "你是中国专利交底书撰写专家。严格输出 JSON，不输出 Markdown。聚焦专利点挖掘、CNIPA 查新语义块、交底书章节和自检风险。",
        },
        {
          role: "user",
          content: `请根据 patent-disclosure-skill 工作流分析以下项目材料，并输出 JSON：

要求字段：
- title: 案件名称
- patentPoints: 3-5 个候选专利点，每项含 name、technicalProblem、technicalSolution、beneficialEffect
- cnipaSearchBlocks: 2-8 个适合国知局公布公告站分轮检索的中文语义块
- disclosureOutline: 技术交底书章节大纲，包含 technicalField、background、summary、embodiments、drawings
- selfCheckRisks: 逻辑闭环、参数一致性、术语一致性、可实施性风险
- nextActions: 给研发人员补材料的问题清单

案件名称：${title || "未命名专利项目"}

项目材料：
${userContent}`,
        },
      ],
    });

    res.json(JSON.parse(content));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/patent/novelty-assessment", async (req, res) => {
  try {
    const { title, inventionDisclosure, patentUrls, manualEvidence } = req.body;
    const urls = Array.isArray(patentUrls)
      ? patentUrls.map((item) => String(item).trim()).filter(Boolean).slice(0, 8)
      : [];

    if (!String(inventionDisclosure || "").trim()) {
      return res.status(400).json({ error: "Missing inventionDisclosure." });
    }

    const crawlerEvidence = await Promise.all(
      urls.map(async (url) => {
        try {
          return await crawlPatentDocument(url);
        } catch (error) {
          return {
            url,
            source: "抓取失败",
            title: "无法抓取该对比文件",
            excerpt: error instanceof Error ? error.message : String(error),
            fetchedAt: new Date().toISOString(),
          };
        }
      }),
    );

    const evidenceText = [
      ...crawlerEvidence.map(
        (doc, index) => `【对比文件${index + 1}】
来源：${doc.source}
URL：${doc.url}
标题：${doc.title}
正文摘录：${doc.excerpt}`,
      ),
      manualEvidence ? `【人工补充证据】\n${String(manualEvidence).slice(0, 9000)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const content = await callDeepSeek({
      responseFormatJson: true,
      temperature: 0.15,
      maxTokens: 4000,
      messages: [
        {
          role: "system",
          content:
            "你是中国专利创新性查新评估与技术交底书撰写专家。遵循 patent-disclosure-skill：先专利点挖掘，再查新与差异化，再交底书预览和自检。只能基于用户给出的技术方案和抓取到的对比文件证据作判断。严禁编造专利号、标题、URL、实验数据或占位符。若证据不足，必须明确写“证据不足，需补充检索”，并把 references 输出为空数组或仅输出用户证据中真实出现的文献。严格输出 JSON，不输出 Markdown。",
        },
        {
          role: "user",
          content: `请完成中国专利创新性评估。要求判断要有证据，不要泛泛而谈。

硬性规则：
- 不允许出现 CNXXXX、CNYYYY、对比文件1标题、[具体结构/方法]、[参数/步骤] 等占位符。
- 不允许把没有出现在证据中的专利号、标题、申请人、URL 写入 references。
- 每个 noveltyPoints 与 featureComparison 必须引用待申请方案或证据中的真实技术特征。
- 证据不足时，riskScore 可保守给出，但 conclusion、selfCheckRisks、claimSuggestions 要说明需要补充哪些检索材料。

输出 JSON 字段：
- riskScore: 0-100，越高表示创新性风险越高
- conclusion: 结论，说明是否建议进入撰写、需要补强哪里
- noveltyPoints: 3-5 个有证据支撑的创新点
- featureComparison: 数组，每项含 feature、evidence、noveltyJudgement
- references: Top 对比文件，每项含 publicationNumber、title、source、relevanceScore、keyDisclosure、url
- claimSuggestions: 3-6 条权利要求撰写建议，必须围绕差异特征
- disclosureOutline: 技术交底书预览大纲，含 background、technicalProblem、solution、beneficialEffects、protectedPoints
- selfCheckRisks: 内部自检风险，关注逻辑闭环、公式/参数一致性、术语一致性、可实施性

待申请主题：${title || "未命名中国专利请求"}

待申请技术方案：
${String(inventionDisclosure).slice(0, 12000)}

抓取到的中国专利/公开文献证据：
${evidenceText || "暂无外部网页证据；请基于待申请技术方案给出需补充的检索证据清单。"}`,
        },
      ],
    });

    res.json({
      ...JSON.parse(content),
      crawlerEvidence,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

async function configureApp() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PatentDraft Server] Running on http://localhost:${PORT}`);
    console.log(`[PatentDraft AI] Provider=deepseek Model=${DEEPSEEK_MODEL}`);
  });
}

configureApp().catch((error) => {
  console.error("Server boot failed:", error);
  process.exitCode = 1;
});
