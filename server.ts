import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000");

  // JSON body parser with proper limit
  app.use(express.json({ limit: "15mb" }));

  // Initialize Gemini AI
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
        apiKey: apiKey,
      })
    : null;

  // System Instruction
  const SYSTEM_INSTRUCTION = `
你是一位專業的資料分析師。
你的任務是接收一段 CSV 或表格結構的原始數據，理解其欄位意義，並提出精確的摘要報告與洞察。

請務必嚴格遵循以下 Markdown 輸出格式：

### 1. 📊 資料概況與欄位理解
簡要說明這份資料的主題是什麼，並列出關鍵欄位的意義。

### 2. ⚠️ 異常與缺值檢查
檢查資料中是否有空白（例如缺少數量或金額）、極端值（例如不合理的高價），並將發現的異常項目條列出來。若無異常，說明「未發現明顯異常」。

### 3. 📈 統計與趨勢洞察
請回答以下問題的總結：
- **總計概況**：銷售數量或總金額的大概加總。
- **分類表現**：哪個業務員或哪項產品表現最好？
- **業務建議**：從數據中給出 1-2 個可以執行的商業建議。

請以 Markdown 格式輸出，所有繁體中文部分必須使用**繁體中文**回覆，不要包含任何額外的問候語或結語。
`;

  // API Analyze route
  app.post("/api/analyze", async (req: any, res: any) => {
    try {
      const { csvData } = req.body;

      if (!csvData || csvData.trim() === "") {
        return res.status(400).json({ error: "輸入為空，請貼上有效的 CSV 格式資料。" });
      }

      if (!ai) {
        return res.status(500).json({
          error: "伺服器未檢測到 GEMINI_API_KEY。請確認環境變數中已設定此金鑰。",
        });
      }

      // We call the recommended gemini-3.5-flash for basic/intermediate text analytics tasks
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `以下是使用者貼入的 CSV 數據報表：\n\n\`\`\`csv\n${csvData}\n\`\`\`\n\n請根據系統指令 (System Instruction) 提供完整、詳盡、專業且精美的數據分析報告與具體商業洞察建議。`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.1, // Low temperature for factual structured analysis
        },
      });

      const reportText = response.text;
      return res.json({ result: reportText });
    } catch (err: any) {
      console.error("Gemini Analyze Error:", err);
      // Clean error presentation
      return res.status(500).json({
        error: `分析失敗：${err.message || "未知伺服器內部錯誤"}`,
      });
    }
  });

  // Vite middleware for development vs static asset serving for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: any, res: any) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
