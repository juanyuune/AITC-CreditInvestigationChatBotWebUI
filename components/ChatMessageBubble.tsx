"use client";

import { cn } from "@/utils/cn";
import type { Message } from "ai/react";
import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronDown, Copy, Lock, Cloud, Zap, ThumbsUp, ThumbsDown, Check, Download } from "lucide-react";
import { copyText } from "@/utils/copyText";

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return "剛才";
  if (diffMin < 60) return `${diffMin}分鐘前`;
  if (diffHr < 24) return `${diffHr}小時前`;
  if (diffDay === 1) return "昨天";
  if (diffDay < 7) return `${diffDay}天前`;
  return date.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
}

function renderBoldMarkdown(content: string) {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;
  let partIndex = 0;
  while (currentIndex < content.length) {
    const startIndex = content.indexOf("**", currentIndex);
    if (startIndex === -1) { parts.push(content.slice(currentIndex)); break; }
    const endIndex = content.indexOf("**", startIndex + 2);
    if (endIndex === -1) { parts.push(content.slice(currentIndex)); break; }
    if (startIndex > currentIndex) parts.push(content.slice(currentIndex, startIndex));
    const boldText = content.slice(startIndex + 2, endIndex);
    if (boldText.length === 0) { parts.push("**"); currentIndex = startIndex + 2; continue; }
    parts.push(<strong key={`bold-${partIndex}`}>{boldText}</strong>);
    partIndex += 1;
    currentIndex = endIndex + 2;
  }
  return parts;
}

function parseDispatchMeta(message: Message, dataSources: any[]) {
  const meta = dataSources.find((s) => s._aitc_meta);
  if (meta?._aitc_meta) return meta._aitc_meta;
  const annotations = (message as any).annotations;
  if (Array.isArray(annotations)) {
    const found = annotations.find((a: any) => a?.dispatch_decision);
    if (found) return found;
  }
  return null;
}

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  dataSources: any[];
  onCopy?: (message: Message) => void;
  loadingStep?: string;
  loadingElapsed?: number;
  company?: string;
  period?: string;
  reportId?: string;
}) {
  const isUser = props.message.role === "user";
  const isThinking = !isUser && props.message.content.trim().length === 0;

  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadDone, setDownloadDone] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const base = process.env.NEXT_PUBLIC_CHATBOT_API_BASE_URL ?? "";
      // Extract company name from report content — more reliable than selector value
      const text = props.message.content;
      const companyMatch = text.match(/公司名稱[：:]\s*([^\n\r，,。]{3,30})/);
      const periodMatch = text.match(/20\d{2}Q[1-4]/);
      const extractedCompany = companyMatch ? companyMatch[1].trim() : (props.company ?? "信用調查報告");
      const extractedPeriod = periodMatch ? periodMatch[0] : (props.period ?? "");
      const res = await fetch(`${base}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: props.reportId ?? "",
          report_text: text,
          company: extractedCompany,
          period: extractedPeriod,
        }),
      });
      const data = await res.json();
      if (data.download_url) {
        const link = document.createElement("a");
        link.href = `${base}${data.download_url}`;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setDownloadDone(true);
        setTimeout(() => setDownloadDone(false), 3000);
      }
    } catch (e) {
      console.error("Export failed", e);
    }
    setDownloading(false);
  };

  const handleCopy = async () => {
    try {
      await copyText(props.message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
    props.onCopy?.(props.message);
  };

  const submitFeedback = async (rating: "up" | "down", comment = "") => {
    setFeedback(rating);
    setShowFeedbackInput(false);
    try {
      const base = process.env.NEXT_PUBLIC_CHATBOT_API_BASE_URL ?? "";
      await fetch(`${base}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: props.message.content,
          mode: "",
          model_used: "",
          rating: rating === "up" ? 1 : -1,
          comment,
        }),
      });
    } catch (e) { console.error("Feedback failed", e); }
  };

  const hasDataSources = !isThinking && props.dataSources && props.dataSources.length > 0;
  const dispatchMeta = parseDispatchMeta(props.message, props.dataSources);

  return (
    <div className={cn(
      "mb-8 flex max-w-[80%] flex-col",
      isUser ? "ml-auto items-end" : "mr-auto items-start",
    )}>

      {/* ── Message bubble ── */}
      <div className={cn(
        "flex items-start gap-3",
        isUser ? "flex-row-reverse" : "flex-row",
      )}>
        {/* Avatar — assistant only */}
        {!isUser && (
          <div className="flex-shrink-0 border bg-secondary rounded-full w-9 h-9 flex items-center justify-center text-base mt-0.5">
            {props.aiEmoji}
          </div>
        )}

        {/* Bubble content */}
        <div className={cn(
          "rounded-2xl px-4 py-3",
          isUser
            ? "bg-secondary text-secondary-foreground"
            : "bg-muted/40 text-foreground",
        )}>
          {isThinking ? (
            <div className="flex min-h-8 flex-col gap-2" aria-label="AI 思考中">
              {props.loadingStep ? (
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:300ms]" />
                  </div>
                  <span className="text-xs text-muted-foreground">{props.loadingStep}</span>
                  {props.loadingElapsed !== undefined && props.loadingElapsed > 0 && (
                    <span className="ml-auto text-xs font-mono text-muted-foreground/50">{props.loadingElapsed}s</span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="loading-dot" />
                  <span className="loading-dot [animation-delay:0.2s]" />
                  <span className="loading-dot [animation-delay:0.4s]" />
                </div>
              )}
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {renderBoldMarkdown(props.message.content)}
            </div>
          )}
        </div>
      </div>

      {/* ── Dispatch badge (model / speed / cache) ── */}
      {!isUser && !isThinking && dispatchMeta && (
        <div className="mt-2 ml-12 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium border",
            dispatchMeta.dispatch_decision !== "cloud"
              ? "border-slate-700 bg-slate-800 text-slate-300"
              : "border-sky-800 bg-sky-950 text-sky-300"
          )}>
            {dispatchMeta.dispatch_decision !== "cloud"
              ? <Lock className="h-3 w-3" />
              : <Cloud className="h-3 w-3" />}
            {dispatchMeta.dispatch_decision !== "cloud" ? "On-premise" : "Cloud"}
          </span>
          <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5">
            {dispatchMeta.model ?? "Qwen"}
          </span>
          {dispatchMeta.response_time_seconds && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5">
              <Zap className="h-3 w-3" />
              {Number(dispatchMeta.response_time_seconds).toFixed(1)}s
            </span>
          )}
          {dispatchMeta.cached && (
            <span className="rounded-full border border-green-800 bg-green-950 px-2 py-0.5 text-green-300">
              cached
            </span>
          )}
        </div>
      )}

      {/* ── Action bar: copy + thumbs — assistant only, after answer appears ── */}
      {!isUser && !isThinking && (
        <div className="mt-2 ml-12 flex items-center gap-0.5">
          {/* Copy */}
          <button
            type="button"
            onClick={handleCopy}
            title="複製"
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
              copied
                ? "text-green-400"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? "已複製" : "複製"}</span>
          </button>

          {/* Divider */}
          <span className="mx-1 h-3.5 w-px bg-border" />

          {/* Download Word */}
          <button
            type="button"
            onClick={handleDownload}
            title="匯出 Word 文件"
            disabled={downloading}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors",
              downloadDone
                ? "text-blue-400"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Download className="h-3.5 w-3.5" />
            <span>{downloading ? "匯出中..." : downloadDone ? "已下載" : "匯出"}</span>
          </button>

          {/* Divider */}
          <span className="mx-1 h-3.5 w-px bg-border" />

          {/* Thumbs up */}
          <button
            type="button"
            onClick={() => submitFeedback("up")}
            title="正確答案"
            className={cn(
              "rounded-md p-1.5 transition-colors",
              feedback === "up"
                ? "text-green-400"
                : "text-muted-foreground hover:text-green-400 hover:bg-muted/50"
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>

          {/* Thumbs down */}
          <button
            type="button"
            onClick={() => {
              if (feedback === "down") return;
              setShowFeedbackInput((v) => !v);
            }}
            title="答案有誤"
            className={cn(
              "rounded-md p-1.5 transition-colors",
              feedback === "down"
                ? "text-red-400"
                : "text-muted-foreground hover:text-red-400 hover:bg-muted/50"
            )}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>

          {/* Feedback status */}
          {feedback && (
            <span className="ml-1 text-xs text-muted-foreground">
              {feedback === "up" ? "已標記正確" : "已回報錯誤"}
            </span>
          )}
        </div>
      )}

      {/* ── Thumbs-down comment input ── */}
      {!isUser && showFeedbackInput && (
        <div className="mt-1.5 ml-12 flex items-center gap-2">
          <input
            autoFocus
            placeholder="說明錯誤原因（可選）"
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitFeedback("down", feedbackComment);
              if (e.key === "Escape") setShowFeedbackInput(false);
            }}
            className="text-xs border border-border rounded-md px-2.5 py-1 bg-background w-52 outline-none focus:border-foreground/30"
          />
          <button
            type="button"
            onClick={() => submitFeedback("down", feedbackComment)}
            className="text-xs text-red-400 hover:text-red-300 hover:underline"
          >
            送出
          </button>
          <button
            type="button"
            onClick={() => setShowFeedbackInput(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            取消
          </button>
        </div>
      )}

      {/* ── Data sources ── */}
      {hasDataSources && (
        <div className="mt-2 ml-12 w-full rounded-2xl border border-border bg-muted/40 px-3 py-2">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 text-left text-sm"
            onClick={() => setIsDataSourcesOpen((c) => !c)}
          >
            <span className="font-medium">數據來源標註</span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isDataSourcesOpen ? "rotate-180" : null)} />
          </button>
          {isDataSourcesOpen && (
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              {props.dataSources.filter((s) => !s._aitc_meta).map((source, index) => (
                <div key={`source-${index}`} className="rounded-xl border border-border bg-background/80 px-3 py-2">
                  <div className="font-medium text-foreground">
                    {index + 1}. {source.title ?? source.name ?? source.label ?? "資料來源"}
                  </div>
                  {source.content ?? source.pageContent
                    ? <div className="mt-1">{source.content ?? source.pageContent}</div>
                    : null}
                  {source.reference ?? source.period ?? source.path
                    ? <div className="mt-1">{source.reference ?? source.period ?? source.path}</div>
                    : null}
                </div>
              ))}
              <div className="flex justify-end pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDataSourcesOpen(false)}>
                  縮小
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
