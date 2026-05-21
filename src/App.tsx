import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { 
  FileSpreadsheet, 
  Upload, 
  Play, 
  Copy, 
  Check, 
  Download, 
  HelpCircle, 
  RefreshCw, 
  FileText, 
  AlertCircle, 
  Sparkles, 
  Table as TableIcon,
  BookOpen,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CSV_EXAMPLES, CsvExample } from "./data/examples";

export default function App() {
  const [csvText, setCsvText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<"text" | "table">("text");

  // 預覽表格分頁
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 載入步驟特效，在載入中每 2.5 秒切換一句引導訊息，優化使用者體驗
  useEffect(() => {
    let interval: any;
    if (isLoading) {
      const steps = [
        "正在解析 CSV 欄位與結構特徵...",
        "正在計算數據極值、均值與分布規律...",
        "正在關聯變數並挖掘核心趨勢...",
        "正在編排商業洞察與可執行建議...",
        "精心撰寫多維度數據分析報告中..."
      ];
      let currentStepIdx = 0;
      setLoadingStep(steps[0]);

      interval = setInterval(() => {
        currentStepIdx = (currentStepIdx + 1) % steps.length;
        setLoadingStep(steps[currentStepIdx]);
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // CSV 解析函數，支援氣味相投的簡易預覽
  const parseCsv = (text: string) => {
    if (!text || text.trim() === "") return { headers: [], rows: [] };
    const lines = text.trim().split("\n");
    if (lines.length === 0) return { headers: [], rows: [] };

    // 考慮有可能含有雙引號的值
    const parseLine = (line: string) => {
      const result = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines
      .slice(1)
      .map((line) => parseLine(line))
      .filter((row) => row.length > 0 && row.some((cell) => cell !== ""));
    return { headers, rows };
  };

  const parsedData = parseCsv(csvText);

  // 處理上傳檔案讀取
  const handleFile = (file: File) => {
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv") || file.name.endsWith(".txt"))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvText(text);
        setError(null);
        setCurrentPage(1);
        setPreviewTab("table"); // 載入後預設切換至精美的 tabular view
      };
      reader.readAsText(file);
    } else {
      setError("不支援的檔案格式，請上傳 .csv 或符合純文字結構的 .txt 檔案。");
    }
  };

  // 拖曳處理
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // 點擊選擇檔案
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // 載入預設範例
  const loadExample = (example: CsvExample) => {
    setCsvText(example.data);
    setError(null);
    setCurrentPage(1);
    setPreviewTab("table");
  };

  // 開始呼叫後端 API 進行 AI 分析
  const handleAnalyze = async () => {
    if (!csvText.trim()) {
      setError("請先貼上 CSV 數據、上傳檔案或選擇範例數據。");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisResult("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ csvData: csvText }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "分析請求遭遇未預期的錯誤");
      }

      setAnalysisResult(data.result);
      
      // 平滑捲動至結果區
      setTimeout(() => {
        const resultSection = document.getElementById("analysis-result-section");
        if (resultSection) {
          resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "連線至 AI 伺服器時發生異常，請稍後重試。");
    } finally {
      setIsLoading(false);
    }
  };

  // 一鍵複製
  const handleCopy = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 一鍵下載 Markdown 報告
  const handleDownload = () => {
    if (!analysisResult) return;
    const blob = new Blob([analysisResult], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `AI_數據分析報告_${new Date().toISOString().split('T')[0]}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 取得分頁預覽數據
  const paginatedRows = parsedData.rows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  const totalPages = Math.ceil(parsedData.rows.length / rowsPerPage);

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-slate-200">
      
      {/* 頂部導航欄 (沉浸式暗色科技 header) */}
      <header id="app-header" className="sticky top-0 z-40 bg-black/60 border-b border-white/10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-black p-2 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                AI 數據分析與洞察工具
                <span className="text-xs bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/20">
                  GEMINI 3.5 FLASH
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">適用於 CSV 報表結構的高階商業透視器</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-mono text-emerald-400/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              系統就緒
            </span>
            <span className="hidden md:inline px-2.5 py-0.5 bg-white/5 border border-white/10 rounded text-slate-300">
              地區：台灣/繁中語系
            </span>
          </div>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 工具簡介卡與橫幅 (暗色炫酷漸層) */}
        <div className="mb-8 p-6 bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-black rounded-2xl border border-white/10 shadow-[inner_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden">
          <div className="relative z-10 max-w-3xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-3 font-mono">
              <Sparkles className="h-3 w-3 text-emerald-400" /> ADVANCED NEURAL RAZOR
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2 text-white">
              貼上 CSV，即刻釋出高密度的決策洞察值
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              專為行銷、銷售、客服與運營數據設計的高智慧大腦。您只需粘貼表格原始文字，AI 便會自動提煉趨勢、估算核心 KPI、診斷異常點，並為您列舉出至少 3 項可以直接落實的前瞻改進策略。
            </p>
          </div>
          {/* 背景抽象網格裝飾 */}
          <div className="absolute top-0 right-0 h-full w-1/3 opacity-5 pointer-events-none hidden md:block">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* 雙欄核心工作區 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* 左欄：數據輸入與整合區 (佔 7 隔) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* 區塊 1：貼心範例載入 */}
            <div className="bg-white/[0.03] p-6 rounded-2xl border border-white/10 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-4 w-4 text-emerald-400" />
                <h3 className="font-semibold text-slate-100 text-sm">點選預設繁體中文示範報表</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CSV_EXAMPLES.map((example) => (
                  <button
                    key={example.id}
                    onClick={() => loadExample(example)}
                    className="p-3 text-left bg-black/30 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] rounded-xl transition duration-200 group relative flex flex-col justify-between cursor-pointer"
                    id={`load-example-${example.id}`}
                  >
                    <div>
                      <h4 className="font-medium text-xs text-slate-200 mb-1 group-hover:text-emerald-400 flex items-center justify-between">
                        {example.title.split(' ')[1]} 
                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {example.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 區塊 2：數據輸入區 */}
            <div className="bg-white/[0.03] rounded-2xl border border-white/10 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                  <h3 className="font-semibold text-white">數據輸入區 (CSV 格式)</h3>
                </div>
                
                {/* 預覽切換選項 (僅在有資料時展示) */}
                {csvText.trim() && (
                  <div className="bg-black/50 p-0.5 rounded-lg border border-white/10 flex self-start sm:self-auto">
                    <button
                      onClick={() => setPreviewTab("text")}
                      className={`px-3 py-1 text-xs rounded-md transition font-medium cursor-pointer ${
                        previewTab === "text"
                          ? "bg-emerald-500 text-black shadow"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      原始 CSV
                    </button>
                    <button
                      onClick={() => setPreviewTab("table")}
                      className={`px-3 py-1 text-xs rounded-md transition font-medium flex items-center gap-1 cursor-pointer ${
                        previewTab === "table"
                          ? "bg-emerald-500 text-black shadow"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <TableIcon className="h-3 w-3" /> 表格預覽 ({parsedData.rows.length} 筆)
                    </button>
                  </div>
                )}
              </div>

              <div className="p-6">
                
                {/* 拖曳區或普通顯示 */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative rounded-xl border border-dashed transition-all duration-200 bg-black/20 ${
                    dragActive
                      ? "border-emerald-500 bg-emerald-500/[0.03]"
                      : "border-white/10 hover:border-white/20"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-file-uploader"
                  />

                  {/* 標籤頁 1：原始編輯器 */}
                  {previewTab === "text" || !csvText.trim() ? (
                    <div className="relative">
                      <textarea
                        value={csvText}
                        onChange={(e) => {
                          setCsvText(e.target.value);
                          if (error && e.target.value.trim()) setError(null);
                        }}
                        placeholder="請將您從 Excel / Google Sheets 匯出的 CSV 內容貼於此處...&#10;或是點擊下方拖放 CSV 檔案！&#10;&#10;格式例:&#10;日期,產品,銷量,單價&#10;2026-05-01,充電線,150,300&#10;2026-05-02,無線耳機,80,2500"
                        className="w-full h-80 p-4 font-mono text-xs focus:outline-none focus:ring-0 border-0 resize-none bg-transparent placeholder-slate-600 leading-relaxed text-emerald-100/90"
                        id="csv-textarea-input"
                      />
                      
                      {!csvText.trim() && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
                          <Upload className="h-10 w-10 text-slate-600 mb-2 opacity-60" />
                          <p className="text-xs font-medium text-slate-300">將您的 .csv 檔案拖曳至此處代入</p>
                          <p className="text-[10px] text-slate-500 mt-1">或者點擊下方按鈕選取檔案，採用 UTF-8 編碼</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 標籤頁 2：炫酷的即時結構化前端表格預覽 */
                    <div className="p-4 rounded-xl min-h-[320px] flex flex-col justify-between">
                      {parsedData.headers.length > 0 ? (
                        <div className="overflow-x-auto border border-white/10 rounded-lg">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="bg-white/5 border-b border-white/10">
                                {parsedData.headers.map((header, i) => (
                                  <th key={i} className="py-2.5 px-3 text-slate-200 font-semibold border-r border-white/5">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {paginatedRows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/[0.02]">
                                  {parsedData.headers.map((_, colIndex) => (
                                    <td key={colIndex} className="py-2.5 px-3 text-slate-300 font-mono text-[11px] max-w-[200px] truncate border-r border-white/5">
                                      {row[colIndex] || "-"}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                          <AlertCircle className="h-8 w-8 text-slate-600 mb-2" />
                          <p className="text-xs">無法成功解析此 CSV。請確認第一列是否具備正確的表頭資訊。</p>
                        </div>
                      )}

                      {/* 表格分頁控制 */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-3">
                          <span className="text-[11px] text-slate-400">
                            顯示第 {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, parsedData.rows.length)} 筆（共 {parsedData.rows.length} 筆）
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              className="px-2.5 py-1 text-[11px] rounded border border-white/10 hover:bg-white/5 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                            >
                              上一頁
                            </button>
                            <span className="text-[11px] font-medium px-2 text-slate-300 font-mono">
                              {currentPage} / {totalPages}
                            </span>
                            <button
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              className="px-2.5 py-1 text-[11px] rounded border border-white/10 hover:bg-white/5 text-slate-300 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                            >
                              下一頁
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 底部檔案拖曳提示與按鈕區 */}
                  <div className="p-3 bg-white/[0.02] border-t border-white/10 flex items-center justify-between text-xs rounded-b-xl">
                    <button
                      type="button"
                      onClick={onButtonClick}
                      className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 py-1.5 px-3 rounded-lg hover:bg-white/5 transition cursor-pointer"
                      id="select-file-btn"
                    >
                      <Upload className="h-3.5 w-3.5" /> 點此選擇電腦中的 CSV 檔案
                    </button>
                    {csvText.trim() && (
                      <button
                        onClick={() => {
                          setCsvText("");
                          setPreviewTab("text");
                        }}
                        className="text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded-lg hover:bg-white/5 transition cursor-pointer"
                      >
                        清空內容
                      </button>
                    )}
                  </div>
                </div>

                {/* 錯誤資訊顯示 */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3.5 bg-red-950/20 border border-red-900/30 text-rose-300 rounded-xl text-xs flex items-start gap-2.5"
                    id="error-display-banner"
                  >
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">運算發生狀況</p>
                      <p className="mt-0.5 text-rose-300/80 leading-relaxed">{error}</p>
                    </div>
                  </motion.div>
                )}

                {/* 強效 AI 分析按鈕 (Emerald 綠色陰影發光) */}
                <div className="mt-6">
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !csvText.trim()}
                    className={`w-full py-4 px-6 rounded-xl font-bold tracking-wider flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer ${
                      isLoading || !csvText.trim()
                        ? "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_30px_rgba(16,185,129,0.2)]"
                    }`}
                    id="start-analysis-btn"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" />
                        <span>AI 深度矩陣運算中... 請稍候</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-emerald-100" />
                        <span>開始 AI 分析</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>

            {/* 指令配置卡 (設計圖中的 System Instruction 示意配置) */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 shadow-lg">
              <h3 className="text-xs font-semibold mb-3 text-slate-300 uppercase tracking-wider">SYSTEM INSTRUCTION 系統設定常數</h3>
              <div className="p-3 bg-black/40 rounded-xl text-[11px] font-mono leading-relaxed text-slate-400 border border-white/5">
                我們已在後端注入專屬的資料分析指令集：規範 AI 必須做為資深商業決策專家，精準運用繁體中文語境，在 3秒內整合並輸出「數據總覽與摘要」、「趨勢與關鍵洞察」、「最少 3 條具體改善建議 (Actionable Recommendations)」，並以高規格 Markdown 結構進行美化。
              </div>
            </div>

          </div>

          {/* 右欄：AI 分析結果與報告展現區 (佔 5 隔) */}
          <div className="lg:col-span-5">
            <div 
              id="analysis-result-section" 
              className="bg-white/[0.02] rounded-2xl border border-white/10 shadow-lg overflow-hidden min-h-[580px] flex flex-col justify-between sticky top-24"
            >
              
              {/* 報告頁首 */}
              <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h2 className="font-semibold text-white text-sm sm:text-base">
                    分析結果與洞察報告
                  </h2>
                </div>
                
                {/* 如果分析成果存在，提供報告控制 */}
                {analysisResult && (
                  <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10">
                    <button
                      onClick={handleCopy}
                      title="複製 Markdown 報告"
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
                      id="copy-report-btn"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={handleDownload}
                      title="下載 Markdown 完整報告"
                      className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded transition cursor-pointer"
                      id="download-report-btn"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 報告卡片本體 */}
              <div className="p-6 flex-1 flex flex-col justify-center overflow-y-auto">
                
                <AnimatePresence mode="wait">
                  {isLoading ? (
                    
                    /* Loading 動畫展示：呼吸狀態與變更的提示步驟 */
                    <motion.div
                      key="loading-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <div className="relative mb-6">
                        <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center animate-ping absolute opacity-45"></div>
                        <div className="h-16 w-16 bg-black/40 rounded-full border border-emerald-500/30 flex items-center justify-center relative">
                          <RefreshCw className="h-8 w-8 text-emerald-400 animate-spin" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-white text-sm mb-1.5">大腦正在高速運算分析中...</h4>
                      <p className="text-xs text-emerald-400 font-mono animate-pulse min-h-[16px]">
                        {loadingStep}
                      </p>
                      
                      <div className="max-w-[250px] mt-6 bg-black/55 border border-white/10 rounded-lg p-3 text-[10px] text-slate-500">
                        正在調動先進 AI 的多維數值統計關聯律。此步驟可能需要額外數秒，以確保產出報告之細緻、扎實與正確。
                      </div>
                    </motion.div>

                  ) : analysisResult ? (
                    
                    /* 成果展示模式 */
                    <motion.div
                      key="result-state"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-left w-full animate-fadeIn"
                    >
                      {copied && (
                        <div className="mb-4 p-2.5 bg-emerald-950/30 border border-emerald-800/45 rounded-lg text-xs text-emerald-300 flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-emerald-400 animate-bounce" /> 已成功複製！可直接粘貼至辦公文件或簡報中。
                        </div>
                      )}
                      
                      {/* Markdown 渲染主題區 */}
                      <div className="markdown-body">
                        <ReactMarkdown>{analysisResult}</ReactMarkdown>
                      </div>

                    </motion.div>

                  ) : (
                    
                    /* 靜態引導展示（在尚未分析或空資料時） */
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center py-16 text-center"
                    >
                      <div className="bg-white/5 p-4 rounded-full mb-4 border border-white/5">
                        <FileText className="h-10 w-10 text-slate-500" />
                      </div>
                      <h4 className="font-semibold text-slate-200 text-sm mb-1.5">主動分析儀表板</h4>
                      <p className="text-xs max-w-xs text-slate-400 leading-relaxed">
                        請在左側貼上您的 CSV 數據、上傳本地檔案、或直接點擊上方繁中範例報表。點擊「開始 AI 分析」後，此處將化身為您的專屬資料科學顧問。
                      </p>
                      <div className="mt-5 inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                        <Sparkles className="h-3 w-3" /> 一鍵匯出為高階標準 MARKDOWN 報告
                      </div>
                    </motion.div>

                  )}
                </AnimatePresence>

              </div>

              {/* 報告頁尾 */}
              <div className="p-4 border-t border-white/10 bg-black/30 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
                <span>輸出格式：標準 Markdown 結構</span>
                {analysisResult && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                  >
                    <Copy className="h-3 w-3" /> 點此快速複製整篇報告
                  </button>
                )}
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* 頁尾資訊 */}
      <footer className="border-t border-white/5 py-8 mt-16 text-center text-xs text-slate-500 bg-black/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex gap-6 uppercase tracking-widest font-mono text-[10px] text-slate-500">
            <span>地區: GLOBAL-ASIA-01</span>
            <span>回應頻寬: FAST-STREAM</span>
          </div>
          <p>© 2026 AI 數據分析與洞察工具. Powered by Advanced Neural Reasoning</p>
        </div>
      </footer>

      {/* 背景綠光特效 */}
      <div className="fixed -bottom-10 -right-10 w-64 h-64 bg-emerald-600/5 rounded-full blur-[80px] pointer-events-none z-0"></div>
    </div>
  );
}
