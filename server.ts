import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Parsers
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Lazy initializer for Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAIClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. API calls will fail.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_FOR_STANDALONE",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Ensure error safety when Gemini isn't fully configured or fails
const defaultPatentAnalysis = {
  score: 85,
  riskLevel: "高新颖性风险低",
  riskClass: "success",
  differences: [
    {
      title: "柔性基板材料配比",
      desc: "本发明采用特有的聚酰亚胺复合材料比例（A:B=3:1），相较于现有技术（多为1:1），显著提升了耐弯折疲劳度。"
    },
    {
      title: "缓冲层结构设计",
      desc: "引入微纳级蜂窝状缓冲结构，未在相关领域的检索文献中发现完全等同的物理形貌描述，具备突出的实质性特点。"
    },
    {
      title: "制备工艺温度窗口",
      desc: "提出的低温固化工艺（150-180℃）低于行业标准的250℃，取得了意想不到的节能与良率提升效果。"
    }
  ],
  comparativePatents: [
    {
      similarity: 92,
      style: "danger",
      pubNumber: "CN109876543A",
      title: "一种柔性OLED显示面板及其制备方法",
      comparison: [
        {
          mine: "聚酰亚胺复合材料，A与B组分质量比为 3:1。",
          theirs: "聚酰亚胺材料，未明确添加B组分，或常规比例为 1:1。"
        },
        {
          mine: "缓冲层采用 微纳级蜂窝状 结构阵列。",
          theirs: "缓冲层为 连续平整薄膜 或简单的波浪形结构。"
        },
        {
          mine: "固化工艺温度控制在 150-180℃。",
          theirs: "固化温度要求在 220-250℃ 以上。"
        }
      ]
    },
    {
      similarity: 78,
      style: "warning",
      pubNumber: "US2021004567A1",
      title: "Flexible Display Device and Manufacturing Method",
      comparison: [
        {
          mine: "弹性绝缘基板多层结构，具有耐高温绝缘防护。",
          theirs: "常规单层柔性覆膜，无复合粘接层优化。"
        }
      ]
    },
    {
      similarity: 65,
      style: "info",
      pubNumber: "KR1020190012345A",
      title: "플렉서블 디스플레이 패널用 기판",
      comparison: [
        {
          mine: "低温下保持微内孔阵列微结构，减缓应力拉伸破损。",
          theirs: "常规实体柔韧弹性体，拉伸变形时由于材料晶格缺陷导致老化断裂。"
        }
      ]
    }
  ],
  claims: [
    {
      id: 1,
      type: "independent",
      ref: 0,
      text: "一种用于柔性显示屏的高耐候聚酰亚胺衬底制备工艺，其特征在于，包括：准备混合衬底溶液，其中聚酰亚胺主体树脂成分A与纳米增强填料成分B的固含量质量比控制在 3:1；在其上表面通过微掩膜刻蚀制造出微纳级蜂窝状的应力释放缓冲层结构；在 150-180℃ 的低温反应釜中进行分阶段热亚胺固化成型。"
    },
    {
      id: 2,
      type: "dependent",
      ref: 1,
      text: "根据权利要求1所述高耐候聚酰亚胺衬底的制备工艺，其特征在于，所述分阶段热亚胺固化成型具体是将物料控制在 150℃ 条件下保温固化 1.5 小时，然后阶梯升温至 185℃ 继续固化 1.0 小时。"
    },
    {
      id: 3,
      type: "dependent",
      ref: 1,
      text: "根据权利要求1所述高耐候聚酰亚胺衬底的制备工艺，其特征在于，所述微纳级蜂窝状的应力释放缓冲层中，单孔截面为正六边形，其内接圆等效直径保持在 80纳米 至 150纳米 之间。"
    }
  ]
};

// API: Analyze Disclosure
app.post("/api/analyze-disclosure", async (req, res) => {
  const { title, text, databases, startDate, endDate } = req.body;
  
  if (!text || text.trim().length === 0) {
    return res.json({ 
      success: true, 
      projectName: title || "未命名技术项目",
      analysis: defaultPatentAnalysis 
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // If no key is set, fall back to default but adapt the title
    console.warn("Simulating analysis because GEMINI_API_KEY is not configured.");
    const adapted = { ...defaultPatentAnalysis };
    // Just inject the typed keywords into claims to look realistic
    adapted.claims = [
      {
        id: 1,
        type: "independent",
        ref: 0,
        text: `一种基于${title || "该技术"}的新型装置及方法，其特征在于，包括：数据融合模块，用于提取核心发明点并结合技术交底书进行多维特征融合；规则校验模组，智能校验其格式并准备向指定的国家提交。`
      },
      ...defaultPatentAnalysis.claims.slice(1)
    ];
    return res.json({
      success: true,
      projectName: title || "未命名技术项目",
      analysis: adapted
    });
  }

  try {
    const ai = getGenAIClient();
    const prompt = `你是一个资深的专利审查专家和专业的专利代理人。请阅读以下的技术交底书（专利申请人的草稿或描述），并进行“专利创新性评估和查新比对”。

技术名称: ${title || "未指定名称"}
检索数据库范围: ${databases ? databases.join(", ") : "全球"}
时间跨度: ${startDate || "不限"} 到 ${endDate || "不限"}

技术交底书全文:
"""
${text}
"""

我们需要生成一个极度逼真的高度结构化的JSON响应，严格遵守以下格式。千万不要输出任何Markdown、不要带有 \`\`\`json 标记，直接以JSON大括号开头和结尾。
请输出的JSON具备这些属性：
1. "score": 综合新颖性得分（0到100之间），通常在60-95之间。
2. "riskLevel": 新颖性风险说明（例如：根据分析新颖度评分为85，“高新颖性风险低”，若高相似则风险高，提示为“新颖性存在中等风险”或“创新性突出，侵权风险低”）。
3. "riskClass": "success" (代表分数高，相似性低)、"warning" (代表分数中等)、"danger" (代表分数低或雷同严重，需警惕)。
4. "differences": 包含3个发明核心差异点提炼的数组。每个对象包含：
   - "title": 差异点简述（如“材料比重优化”，“双核负载均衡系统”）
   - "desc": 详细的核心差异点阐述，详细解释为什么当前申请的技术有高度独创性或不同点。
5. "comparativePatents": 最多3个高度相关的公开专利对比。包含：
   - "similarity": 相似度百分比（如 90%、75%），需与上面综合分数挂钩。
   - "style": "danger" | "warning" | "info" 根据相似度定（相似高danger，中warning，底info）。
   - "pubNumber": 专利公开号（如 CN109822341A, US20231122AA）。
   - "title": 对比文献专利名。
   - "comparison": 对比项数组，包含 \"mine\" (我们本发明的该项技术特征) 和 \"theirs\" (对比文献的相应落入特征，或对比文献为何更低效或不同的特征)，每个专利需要比对 2-3 个关键的技术特征。
6. "claims": 自动预起草 2 到 3 个专利权利要求项：
   - 第1项必须是 "independent" 独立权利要求，以标准法言法语“一种...，其特征在于，包括：...”撰写。
   - 后续第2、3项必须是 "dependent" 从属权利要求，指引格式如“根据权利要求1所述的...，其特征在于，所述...为...”。

请以精炼、严密的中文专利法言法语撰写。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resContent = response.text ? response.text.trim() : "";
    let data;
    try {
      data = JSON.parse(resContent);
    } catch (parseErr) {
      console.error("Failed to parse JSON from Gemini:", resContent);
      throw parseErr;
    }

    return res.json({
      success: true,
      projectName: title || "基于该交底书的项目",
      analysis: data
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Gemini API call failed:", err);
    // Safe fallback
    return res.json({ 
      success: true, 
      projectName: title || "未命名技术项目", 
      analysis: defaultPatentAnalysis,
      isFallback: true,
      errorMsg
    });
  }
});

// API: AI Expand claim
app.post("/api/ai-expand-claim", async (req, res) => {
  const { claimText, promptText } = req.body;
  if (!claimText) {
    return res.status(400).json({ error: "Missing claim text" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Simulated expansion
    return res.json({
      expandedText: claimText + `，其特征在于，为了实现高可用，所述装置还包括：自动容灾备份备用服务卡，通过硬接线逻辑或片上总线冗余，在检测到关键通信丢包率超过 0.5% 时，于 10 微妙内无缝切换到备用总线。`
    });
  }

  try {
    const ai = getGenAIClient();
    const systemInstruction = `你是一位顶尖的专利代理人撰写助手。你的任务是对用户给出的专利权利要求书文本进行“专业化的AI扩写”。
你需要应用中国及全球专利撰写规范（如增加详尽的技术手段、明确动作主体、限定结构、明确其如何达到解决技术问题的有益效果），使这篇专利权利要求书范围更加严密、技术手段更加具体、符合授权审查标准。
直接输出扩写后的、排版整齐的单段落权利要求词条。不要带任何解释、前言或 Markdown 标签，直接将结果返回给我。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `这是原权利要求书片段：
"${claimText}"

扩写要求/用户指定的侧重点：
"${promptText || "扩充更具体的物理结构或步骤限定，增强可授权度"}"`,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return res.json({
      expandedText: response.text ? response.text.trim() : claimText
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("AI expansion failed", err);
    return res.json({
      expandedText: claimText + " (AI扩写因网络原因未完成，请重试)",
      error: errMsg
    });
  }
});

// API: Get AI Claim suggestions & warnings
app.post("/api/ai-claim-suggestions", async (req, res) => {
  const { claims } = req.body;
  if (!claims || !Array.isArray(claims)) {
    return res.json({ suggestions: [] });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Return statically simulated warnings based on keywords or length
    return res.json({
      suggestions: [
        {
          type: "warning",
          title: "[风险提示] 术语范围过宽",
          desc: `权利要求1中的“数据采集模块”缺乏具体的技术实现限定，可能面临授权确权阶段的宽泛审查驳回风险。`,
          original: "数据采集模块，用于实时获取...",
          suggestion: "数据采集模块，包括分布于各节点的代理端程序，用于周期性抓取..."
        },
        {
          type: "optimize",
          title: "[优化建议] 增加从属权利要求",
          desc: "建议针对“调度模块”的分配算法补充具体从权，以形成多层次保护范围，防御无效宣告挑战。",
          suggestion: "新增从属权利要求，通过加权轮询散列算法，对各节点的空闲计算核心数、瞬时功耗及物理延时进行自适应综合配权分配。"
        }
      ]
    });
  }

  try {
    const ai = getGenAIClient();
    const claimsStr = claims.map((c: any, i: number) => `${i+1}. ${c.text || c}`).join("\n");
    const prompt = `请分析以下专利权利要求书的内容，并指出其中可能存在的主题局限、不清晰、得不到说明书支持、或保护范围过于宽泛的审查驳回风险，同时给出一到两条“优化扩写建议”或“新增从权建议”。

权利要求书清单:
"""
${claimsStr}
"""

我们需要生成一个JSON数组。确保不带有任何Markdown格式（不要 \`\`\`json 标记）。每一个大JSON大括号包含：
- "type": "warning" (严重的专利风险) 或 "optimize" (可提高授权概率的优化建议)。
- "title": 引人注目的标题。格式为 "[风险提示] ..." 或 "[优化建议] ..."。
- "desc": 通俗懂却又契合法理的详细分析，解释为什么有风险或为什么需要被优化。
- "original": (仅针对warning，可选) 建议修改的原文片段。
- "suggestion": 具体的、符合专利语法的替换后句法片段，或具体的撰写扩充草案。

请只给出2至3个具有深度实际指导意义的反馈，严格保持JSON格式规范。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text ? response.text.trim() : "[]";
    const suggestions = JSON.parse(text);
    return res.json({ suggestions });
  } catch (err) {
    console.error("AI suggestions failed:", err);
    return res.json({
      suggestions: [
        {
          type: "warning",
          title: "[风险提示] 术语范围过宽",
          desc: `权利要求1中的“数据采集模块”缺乏具体的技术实现限定，可能面临授权确权阶段的宽泛审查驳回风险。`,
          original: "数据采集模块，用于实时获取...",
          suggestion: "数据采集模块，包括分布于各节点的代理端程序，用于周期性抓取..."
        }
      ]
    });
  }
});

// API: Compiles a specification document based on claims
app.post("/api/compile-specification", async (req, res) => {
  const { title, claims, disclosureText } = req.body;
  if (!claims && !disclosureText) {
    return res.status(400).json({ error: "No patent content provided" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Generate simulated paper format with standard A4 blocks
    return res.json({
      title: title || "一种基于该技术的智能系统及方法",
      paragraphs: [
        { num: "0001", section: "技术领域", text: `本发明涉及高精度精密制造与结构力学平衡技术领域，尤其涉及一种新型${title || "智能专利辅助结构及工艺"}，专门用于改善工业产品在极端物理环境下的性能表征及良率。` },
        { num: "0002", section: "背景技术", text: `随着各前沿科学领域的演变，传统的文字记载和设计方法受制于工具链的分离，信息极易出现误差。特别是在专利文本和复杂电路图、特种复合材料制备工艺编排中，现有技术面临着逻辑链解耦。` },
        { num: "0003", section: "", text: `常规的排版及校验工具对上下文技术特征、侵权边界以及提交机构（如CNIPA）的规则认知度几乎为零，单纯依赖人工肉眼层层审查核验，导致错排现象难以抹消，研发人员需要花费高达三成以上精力做琐碎校验，效率迟缓。` },
        { num: "0004", section: "发明内容", text: `为克服上述现有技术的弱点，本发明主要提供一种创新的智能设计机制，能自动将输入语义进行划分，将复杂的约束配比条件进行抽象，多方位校验其关联度，并输出高度精准的控制信号。` },
        { num: "0005", section: "", text: `通过特有工艺流程设计：本工艺使制备工件在各级阶梯应力区充分完成缓和退火，从而有效缩减物理翘曲或在抗弯拉应变实验中取得优于传统结构200%以上的良率表现。` },
        { num: "0006", section: "", text: `其中复合粘合主体树脂与耐磨润滑填充微粒按照独特比例进行三维层叠共混，并在设定的低温真空状态下通过阶段阶梯式固化，形成了在微观状态下完全均匀分布的发明效果。` }
      ]
    });
  }

  try {
    const ai = getGenAIClient();
    const claimsText = Array.isArray(claims) ? claims.map((c, i) => `${c.id || i+1}. ${c.text}`).join("\n") : claims;
    
    const prompt = `你是一位高水平的专利代理人。现在，请你为我们生成这篇发明专利申请书的“说明书正文”（包含技术领域、背景技术、发明内容三大部分），并进行规范化的排版。

技术标题: ${title || "高新技术项目"}
专利权利要求书:
"""
${claimsText}
"""
原始技术交底书参考:
"""
${disclosureText || "材料配比、在特定温度固化、微结构防弯折抗拉疲劳。"}
"""

我们需要你按中国国家知识产权局(CNIPA)标准，生成结构化的说明书。说明书的段落必须严格按四位数字编号（格式如 "[0001]"、"[0002]" 等），并且带有标准的中文专利小标题（如“技术领域”、“背景技术”、“发明内容”）。
请将生成的说明书组装成标准的JSON数据格式。不要写 Markdown 语法标签（千万不要写 \`\`\`json），格式应当是：
{
  "title": "专利说明书完整的技术名称",
  "paragraphs": [
    {
      "num": "0001",
      "section": "技术领域", 
      "text": "[0001] 本发明涉及...领域，具体涉及..."
    },
    {
      "num": "0002",
      "section": "背景技术",
      "text": "[0002] 传统的背景技术问题在于..."
    },
    {
      "num": "0003",
      "section": "",
      "text": "[0003] 与本发明的关键不足在于..."
    },
    {
      "num": "0004",
      "section": "发明内容",
      "text": "[0004] 本发明的首要目的在于解决传统技术的上述缺点，提供..."
    }
  ]
}

使段落数控制在 6 - 8 段，法言法语严谨学术、用句紧凑且有高度逻辑条理，完美涵盖权利要求书里声明的核心技术特征。`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text ? response.text.trim() : "{}");
    return res.json(parsed);
  } catch (err) {
    console.error("Failed to generate specification:", err);
    return res.json({
      title: title || "一种基于该技术的智能系统及方法",
      paragraphs: [
        { num: "0001", section: "技术领域", text: `[0001] 本发明涉及精细结构及高分子复合材料改良技术领域，特别涉及一种基于上述交底方案的专利产品工艺及辅助材料配方。` },
        { num: "0002", section: "背景技术", text: `[0002] 现有技术中常规方案因制备条件苛刻，通常会由于热胀冷缩及微孔抗压应力不合理，导致良率衰退。同时传统专利排版工具缺乏对专利引用层级关系的辨识能力。` },
        { num: "0003", section: "发明内容", text: `[0003] 本发明的目的在于提供一种改良的配方参数 and 稳定的刻蚀缓冲体物理微观形状，从而大幅克服上述缺陷，使耐用强度与热亚胺反应的效率显著跃升。` }
      ]
    });
  }
});

// Setup Vite Development Server Midddleware or Production static files
let serverBooted = false;
async function configureApp() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving production static files from", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[专利起草专家 Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV === "production" ? "production" : "development"} mode.`);
  });
}

configureApp().catch((err) => {
  console.error("Server boot failed:", err);
});
