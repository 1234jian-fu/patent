import dotenv from "dotenv";
import { execFile } from "child_process";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import express from "express";
import fs from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";
import { fileURLToPath } from "url";

dotenv.config({ path: ".env.local" });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const execFileAsync = promisify(execFile);
const MINIMAX_DOCX_DIR =
  process.env.MINIMAX_DOCX_DIR || path.join(os.homedir(), ".agents", "skills", "minimax-docx");
const MINIMAX_DOCX_PROJECT = path.join(
  MINIMAX_DOCX_DIR,
  "scripts",
  "dotnet",
  "MiniMaxAIDocx.Cli",
  "MiniMaxAIDocx.Cli.csproj",
);
const MINIMAX_DOCX_XSD = path.join(MINIMAX_DOCX_DIR, "assets", "xsd", "wml-subset.xsd");

const CHINA_PATENT_DRAFTER_RULES = `
china-patent-drafter 真实 Skill 写法规则：
1. 默认生成中国发明专利草案，结构包括：发明名称、摘要、权利要求书、说明书（技术领域、背景技术、发明内容、附图说明、具体实施方式）、摘要图、可进一步强化的保护点建议、专业审查提示。
2. 先抽取并展示技术领域、现有技术缺陷、核心创新点、技术方案组成、关键步骤或结构、可保护点、可写入权利要求的技术特征、已提供依据和缺失信息。
3. 根据披露内容选择保护类别：方法、装置、系统、程序/算法/计算模型、存储介质/电子设备、应用场景。只有披露能支撑时才加入平行独权。
4. 先构建权利要求策略，再定稿说明书。至少 1 项独立权利要求；完整草案默认生成 6-12 项从属权利要求。独权覆盖核心发明构思，避免被单一原型、单一参数、单一实验条件或软件语言过度限定。
5. 方法、计算、仿真、控制、优化、算法类专利必须写可执行步骤，优先使用 S1-S5；不得只写“建立模型并计算结果”。从权逐级限定输入变量、预处理、更新规则、收敛/稳定判据、参数修正、输出指标和应用对象。
6. 权利要求使用中国专利表达：“其特征在于”“根据权利要求1所述的……”“其中……”“还包括……”。避免纯结果限定，每个效果必须对应技术手段或相互作用。
7. 摘要约 300 字内，写明技术领域、技术问题、核心方案和技术效果；不写广告语、授权结论、未定义缩写、未提供的实验结果。
8. 说明书必须支撑每个权利要求术语。发明内容形成“缺陷 -> 技术问题 -> 技术方案 -> 有益效果”闭环；具体实施方式要给出可实施步骤、结构、参数范围、控制流、软件实现或等效变形。
9. 摘要图默认根据发明类型选择：方法/算法用流程图，装置用结构示意图，系统用架构图；步骤编号和图中模块要与权利要求、说明书一致。
10. 强化保护时，在披露支持范围内加入替代结构、等效模块、可选步骤、参数范围、应用场景、存储介质/电子设备和商业重要变形。
11. 严禁编造实验数据、效率百分比、材料牌号、设备尺寸、专利号、检索结果、申请人、授权概率、法律结论或安全认证。缺失事实用“需补充”或“在一些实施例中/可选地/优选地”谨慎表达。
12. 每个实质性输出都应提醒：正式提交前建议由具备资质的专利代理师或专利律师结合现有技术检索、申请策略和最新 CNIPA 要求审查修改。
`;

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

interface DisclosureDraftRequest {
  title?: string;
  abstractText?: string;
  claims?: string[];
  descriptionSections?: Array<{ heading: string; content: string }>;
  mermaidSystemDiagram?: string;
  mermaidFlow?: string;
}

function parseJsonObject(content: string) {
  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

function createDocxParagraphs(draft: DisclosureDraftRequest) {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: "技术交底书",
      heading: HeadingLevel.TITLE,
      spacing: { after: 360 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `案件名称：${draft.title || "未命名中国专利请求"}`, bold: true })],
      spacing: { after: 240 },
    }),
    new Paragraph({ text: "注意事项", heading: HeadingLevel.HEADING_1 }),
    new Paragraph("（1）交底书应使代理人能看懂，尤其是背景技术和详细技术方案应完整、清楚。"),
    new Paragraph("（2）技术公开程度应以本领域普通技术人员能够实施为准。"),
    new Paragraph({ text: "权利要求书草稿", heading: HeadingLevel.HEADING_1 }),
    ...(draft.claims || []).map((claim) => new Paragraph({ text: claim, spacing: { after: 160 } })),
    new Paragraph({ text: "说明书摘要", heading: HeadingLevel.HEADING_1 }),
    new Paragraph({ text: draft.abstractText || "", spacing: { after: 240 } }),
  ];

  for (const section of draft.descriptionSections || []) {
    paragraphs.push(new Paragraph({ text: section.heading, heading: HeadingLevel.HEADING_1 }));
    paragraphs.push(new Paragraph({ text: section.content, spacing: { after: 220 } }));
  }

  if (draft.mermaidSystemDiagram) {
    paragraphs.push(new Paragraph({ text: "系统框图 Mermaid 源码", heading: HeadingLevel.HEADING_1 }));
    paragraphs.push(new Paragraph(draft.mermaidSystemDiagram));
  }

  if (draft.mermaidFlow) {
    paragraphs.push(new Paragraph({ text: "流程图 Mermaid 源码", heading: HeadingLevel.HEADING_1 }));
    paragraphs.push(new Paragraph(draft.mermaidFlow));
  }

  return paragraphs;
}

async function createNodeDocxBuffer(draft: DisclosureDraftRequest) {
  const doc = new Document({
    creator: "PatentDraft",
    title: draft.title || "技术交底书",
    description: "PatentDraft generated patent disclosure document",
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: createDocxParagraphs(draft),
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: "Microsoft YaHei",
            size: 21,
          },
          paragraph: {
            spacing: { line: 360 },
          },
        },
      },
    },
  });

  return Packer.toBuffer(doc);
}

function sendDocx(res: express.Response, draft: DisclosureDraftRequest, buffer: Buffer) {
  const filename = encodeURIComponent(`${sanitizeFilename(draft.title || "技术交底书")}.docx`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${filename}`);
  res.send(buffer);
}

function sanitizeFilename(filename: string) {
  return filename.replace(/[\\/:*?"<>|\r\n]/g, "").trim().slice(0, 70) || "PatentDraft";
}

async function commandExists(command: string) {
  try {
    await execFileAsync(command, ["--version"], { timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

async function getMiniMaxDocxStatus() {
  const [dotnetReady, projectExists] = await Promise.all([
    commandExists("dotnet"),
    fs
      .access(MINIMAX_DOCX_PROJECT)
      .then(() => true)
      .catch(() => false),
  ]);

  let dotnetVersion = "";
  if (dotnetReady) {
    try {
      const { stdout } = await execFileAsync("dotnet", ["--version"], { timeout: 10_000 });
      dotnetVersion = stdout.trim();
    } catch {
      dotnetVersion = "";
    }
  }

  return {
    ready: dotnetReady && projectExists,
    dotnetReady,
    dotnetVersion,
    skillPath: MINIMAX_DOCX_DIR,
    projectPath: MINIMAX_DOCX_PROJECT,
    projectExists,
  };
}

function buildMiniMaxContentJson(draft: DisclosureDraftRequest) {
  return [
    { type: "heading", text: "注意事项", level: 1 },
    { type: "paragraph", text: "（1）交底书应使代理人能看懂，尤其是背景技术和详细技术方案应完整、清楚。" },
    { type: "paragraph", text: "（2）技术公开程度应以本领域普通技术人员能够实施为准。" },
    { type: "heading", text: "权利要求书草稿", level: 1 },
    ...(draft.claims || []).map((claim) => ({ type: "paragraph", text: claim })),
    { type: "heading", text: "说明书摘要", level: 1 },
    { type: "paragraph", text: draft.abstractText || "" },
    ...(draft.descriptionSections || []).flatMap((section) => [
      { type: "heading", text: section.heading, level: 1 },
      { type: "paragraph", text: section.content },
    ]),
    { type: "heading", text: "系统框图 Mermaid 源码", level: 1 },
    { type: "paragraph", text: draft.mermaidSystemDiagram || "需补充系统框图。" },
    { type: "heading", text: "流程图 Mermaid 源码", level: 1 },
    { type: "paragraph", text: draft.mermaidFlow || "需补充流程图。" },
  ];
}

async function runMiniMaxDocxExport(draft: DisclosureDraftRequest) {
  const status = await getMiniMaxDocxStatus();
  if (!status.ready) {
    throw new Error(
      status.dotnetReady
        ? "minimax-docx project is not available on this server."
        : ".NET SDK is not installed or dotnet is not available in PATH.",
    );
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "patentdraft-minimax-"));
  const contentPath = path.join(tempDir, "content.json");
  const outputPath = path.join(tempDir, `${sanitizeFilename(draft.title || "技术交底书")}.docx`);
  await fs.writeFile(contentPath, JSON.stringify(buildMiniMaxContentJson(draft), null, 2), "utf8");

  await execFileAsync(
    "dotnet",
    [
      "run",
      "--project",
      MINIMAX_DOCX_PROJECT,
      "--",
      "create",
      "--type",
      "report",
      "--page-size",
      "a4",
      "--margins",
      "standard",
      "--title",
      draft.title || "技术交底书",
      "--author",
      "PatentDraft",
      "--toc",
      "--content-json",
      contentPath,
      "--output",
      outputPath,
    ],
    { timeout: 120_000, cwd: MINIMAX_DOCX_DIR, windowsHide: true },
  );

  await execFileAsync("dotnet", ["run", "--project", MINIMAX_DOCX_PROJECT, "--", "merge-runs", "--input", outputPath], {
    timeout: 120_000,
    cwd: MINIMAX_DOCX_DIR,
    windowsHide: true,
  });

  await execFileAsync(
    "dotnet",
    ["run", "--project", MINIMAX_DOCX_PROJECT, "--", "validate", "--input", outputPath, "--xsd", MINIMAX_DOCX_XSD],
    { timeout: 120_000, cwd: MINIMAX_DOCX_DIR, windowsHide: true },
  );

  const buffer = await fs.readFile(outputPath);
  await fs.rm(tempDir, { recursive: true, force: true });
  return buffer;
}

function validateDraftDomain(draft: Record<string, unknown>, sourceText: string) {
  const serialized = JSON.stringify(draft);
  const bannedExamples = ["图像去噪", "U-Net", "深度学习网络"];
  const sourceAllowsTerm = (term: string) => sourceText.includes(term);
  const unrelatedTerms = bannedExamples.filter((term) => serialized.includes(term) && !sourceAllowsTerm(term));
  if (unrelatedTerms.length > 0) {
    throw new Error(`Draft appears unrelated to the input technology: ${unrelatedTerms.join(", ")}`);
  }
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

app.get("/api/docx/status", async (_req, res) => {
  try {
    const minimax = await getMiniMaxDocxStatus();
    res.json({
      minimax,
      fallback: {
        provider: "node-docx",
        ready: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
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
            `你是中国专利交底书撰写专家。严格输出 JSON，不输出 Markdown。聚焦专利点挖掘、CNIPA 查新语义块、交底书章节和自检风险。必须遵循以下规则：\n${CHINA_PATENT_DRAFTER_RULES}`,
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

    res.json(parseJsonObject(content));
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
            `你是中国专利创新性查新评估与技术交底书撰写专家。遵循 patent-disclosure-skill：先专利点挖掘，再查新与差异化，再交底书预览和自检。只能基于用户给出的技术方案和抓取到的对比文件证据作判断。严禁编造专利号、标题、URL、实验数据或占位符。若证据不足，必须明确写“证据不足，需补充检索”，并把 references 输出为空数组或仅输出用户证据中真实出现的文献。严格输出 JSON，不输出 Markdown。\n${CHINA_PATENT_DRAFTER_RULES}`,
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
      title: title || "未命名中国专利请求",
      ...parseJsonObject(content),
      crawlerEvidence,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/patent/draft-disclosure", async (req, res) => {
  try {
    const { assessment, inventionDisclosure } = req.body;
    const content = await callDeepSeek({
      responseFormatJson: true,
      temperature: 0.2,
      maxTokens: 5000,
      messages: [
        {
          role: "system",
          content:
            `你是中国专利技术交底书撰写专家。遵循 patent-disclosure-skill 的 Step 7 模板和 china-patent-drafter 写法规则，但输出 JSON。必须严格围绕用户给定的查新评估和技术材料撰写，禁止切换到无关技术领域，禁止输出示例案件，禁止编造不存在的对比文件、实验数据、参数或效果。正文不得写自检清单。\n${CHINA_PATENT_DRAFTER_RULES}`,
        },
        {
          role: "user",
          content: `请根据查新结论生成一版可编辑的中国发明专利技术交底书草稿。

硬性规则：
- title 必须使用查新评估中的案件名称或用户技术材料中的主题，不得改写成无关领域。
- claims、abstractText、descriptionSections 必须围绕查新评估中的 noveltyPoints、claimSuggestions 和用户补充技术材料。
- 不允许出现与输入无关的“图像去噪、U-Net、深度学习网络”等示例技术，除非输入材料明确包含这些内容。
- 若材料不足，写“需补充”，不要编造。

输出 JSON 字段：
- title: 案件名称
- abstractText: 说明书摘要，200-300 字
- claims: 5-8 条权利要求草稿，第一条为独立权利要求
- descriptionSections: 数组，每项含 heading、content，按以下章节：注意事项、一、现有技术及缺点、二、技术问题、三、技术方案详细阐述、四、有益效果、五、技术关键点和欲保护点、六、实施例
- mermaidSystemDiagram: mermaid flowchart 源码，只给系统框图
- mermaidFlow: mermaid flowchart 源码，只给流程图
- formatIssues: 需要用户补材料或格式修正的问题
- markdown: 完整 Markdown 交底书，包含上述章节、mermaid 围栏、权利要求草稿；文件名建议使用“案件名_YYYYMMDDHHmmss”

查新评估 JSON：
${JSON.stringify(assessment || {}, null, 2)}

用户补充技术材料：
${String(inventionDisclosure || "").slice(0, 12000)}`,
        },
      ],
    });

    const draft = parseJsonObject(content);
    validateDraftDomain(draft, `${JSON.stringify(assessment || {})}\n${String(inventionDisclosure || "")}`);
    res.json(draft);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/patent/assistant-action", async (req, res) => {
  try {
    const { action, assessment, draft } = req.body;
    const actionName = String(action || "说明书反向扩写");
    const content = await callDeepSeek({
      responseFormatJson: true,
      temperature: 0.2,
      maxTokens: 2600,
      messages: [
        {
          role: "system",
          content:
            `你是专利代理人助手。只基于给定查新结论和草稿行动，不编造证据。输出 JSON，不输出 Markdown 围栏。必须遵循中国专利权利要求和说明书写法规则。\n${CHINA_PATENT_DRAFTER_RULES}`,
        },
        {
          role: "user",
          content: `请执行 AI 助手动作：${actionName}

输出 JSON 字段：
- title: 本次动作标题
- content: 可直接放入工作台的建议或改写文本
- risks: 数组，列出仍需人工确认的问题

查新结论：
${JSON.stringify(assessment || {}, null, 2)}

当前草稿：
${JSON.stringify(draft || {}, null, 2)}`,
        },
      ],
    });

    res.json(parseJsonObject(content));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/patent/export-docx", async (req, res) => {
  try {
    const draft: DisclosureDraftRequest = req.body?.draft || {};
    res.setHeader("X-Docx-Provider", "node-docx");
    sendDocx(res, draft, await createNodeDocxBuffer(draft));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.post("/api/patent/export-docx-minimax", async (req, res) => {
  const draft: DisclosureDraftRequest = req.body?.draft || {};
  const allowFallback = req.body?.fallback !== false;

  try {
    const buffer = await runMiniMaxDocxExport(draft);
    res.setHeader("X-Docx-Provider", "minimax-docx");
    sendDocx(res, draft, buffer);
  } catch (error) {
    if (allowFallback) {
      res.setHeader("X-Docx-Provider", "node-docx");
      res.setHeader("X-Docx-Fallback-Reason", encodeURIComponent(error instanceof Error ? error.message : String(error)));
      sendDocx(res, draft, await createNodeDocxBuffer(draft));
      return;
    }

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
