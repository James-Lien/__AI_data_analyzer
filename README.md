# 📊 AI 數據分析與洞察工具 (通用部署版本)

本專案是一個高效、精美的繁體中文 **AI 數據分析與商業洞察工具**。使用者只需黏貼 CSV 格式的報表，系統即可在數秒內提煉出核心趨勢、計算關鍵 KPI、發現異常數據，並自動生成至少 3 條具體的商業改進建議（Actionable Insights）。

本專案已完成從 Google AI Studio 的專屬設定遷移，現在是一個**標準、通用且可部署**的 Web 應用程式，支援部署在各大雲端平台上。

---

## 🚀 部署指南 (Deployment Guide)

本專案採用 Node.js (Express) + React (Vite & TypeScript) 架構，後端將 API 伺服器與 Vite 靜態資源完美整合。您可以使用以下幾種方式進行部署：

### 1. 雲端託管平台 (一鍵部署，推薦)

您可以輕鬆地將此專案部署到 **Render**、**Railway**、**Heroku** 或 **Google Cloud Run**：

1. 將本專案推送至您的 GitHub 儲存庫。
2. 在您的雲端平台上建立一個新的 **Web Service**，並連結至該 GitHub 專案。
3. 配置以下環境變數 (Environment Variables)：
   - `GEMINI_API_KEY`: 您的 Gemini AI 金鑰（可至 [Google AI Studio](https://aistudio.google.com/) 取得）。
   - `NODE_ENV`: 設定為 `production`。
4. 設定建置與啟動指令：
   - **Build Command (建置指令)**: `npm install && npm run build`
   - **Start Command (啟動指令)**: `npm run start`

---

### 2. 使用 Docker 進行容器化部署

專案中已內建高規格的**多階段建置 (Multi-stage Build) Dockerfile**，能確保產出的容器映像檔（Image）極度輕量、安全且高效：

#### 建立 Docker 映像檔
```bash
docker build -t ai-data-analyzer .
```

#### 啟動 Docker 容器
```bash
docker run -d -p 3000:3000 --env GEMINI_API_KEY="您的金鑰" ai-data-analyzer
```
啟動後即可透過瀏覽器造訪 `http://localhost:3000`。

---

### 3. 自建 VPS 或伺服器部署

如果您使用的是一般的 Linux 伺服器：

1. 確保伺服器已安裝 **Node.js (v18+)**。
2. 複製專案代碼並安裝依賴套件：
   ```bash
   npm install
   ```
3. 設定環境變數（可在 `.env` 檔案中設定，或在系統環境中匯出）：
   ```bash
   export GEMINI_API_KEY="您的金鑰"
   export NODE_ENV="production"
   export PORT=3000
   ```
4. 建置專案：
   ```bash
   npm run build
   ```
5. 啟動服務（建議配合 `pm2` 等進程管理器維持背景運行）：
   ```bash
   # 使用 npm 直接啟動
   npm run start
   
   # 或者使用 PM2 啟動
   pm2 start dist/server.cjs --name "ai-data-analyzer"
   ```

---

## 💻 本地開發指南 (Local Development)

### 準備工作
1. 確保已安裝 Node.js。
2. 打開專案根目錄下的 `.env` 檔案並填入您的 `GEMINI_API_KEY`。

### 執行步驟
1. **安裝依賴**：
   ```bash
   npm install
   ```
2. **啟動開發伺服器** (支援 HMR 熱重載與 Express 後端)：
   ```bash
   npm run dev
   ```
3. 打開瀏覽器造訪 `http://localhost:3000`。

---

## 🛠️ 技術架構與指令集

### npm 指令說明
- `npm run dev`: 啟動開發環境，使用 `tsx` 執行後端並透過 Vite 提供前端中間件服務。
- `npm run build`: 前後端合併編譯。將前端進行 Vite production build，並將後端 `server.ts` 使用 `esbuild` 打包成單一的 `dist/server.cjs` 檔案。
- `npm run start`: 啟動已編譯的生產環境服務。
- `npm run lint`: 執行 TypeScript 靜態語法檢查。
- `npm run clean`: 清除建置生成的 `dist` 資料夾。

### 核心技術棧
- **Frontend**: React 19, TypeScript, TailwindCSS v4, Lucide Icons, Motion (Framer Motion)
- **Backend**: Node.js, Express, `@google/genai` (最新官方 Google GenAI SDK)
- **Bundler & Tooling**: Vite, esbuild, tsx
