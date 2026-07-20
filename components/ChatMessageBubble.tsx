"use client";

import { cn } from "@/utils/cn";
import type { Message } from "ai/react";
import { useState } from "react";
import { Button } from "./ui/button";
import { ChevronDown, Copy, Lock, Cloud, Zap } from "lucide-react";

function renderMath(text: string): string {
  return text
    .replace(/\\\[[\s\S]*?\\\]/g, (match) => `<div class="math-block">${match.slice(2,-2).trim()}</div>`)
    .replace(/\\\([\s\S]*?\\\)/g, (match) => `<span class="math-inline">${match.slice(2,-2).trim()}</span>`);
}

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
  const parts = [];
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

function DispatchBadge(props: {
  decision: string;
  model: string;
  responseTime: number;
  cached: boolean;
}) {
  const isPrivate = props.decision !== "cloud";
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
        isPrivate
          ? "border border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          : "border border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"
      )}>
        {isPrivate ? <Lock className="h-3 w-3" /> : <Cloud className="h-3 w-3" />}
        {isPrivate ? "On-premise" : "Cloud"}
      </span>
      <span className="rounded-full border border-border bg-muted/50 px-2.5 py-1">
        {props.model}
      </span>
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-1">
        <Zap className="h-3 w-3" />
        {props.responseTime.toFixed(1)}s
      </span>
      {props.cached && (
        <span className="rounded-full border border-green-300 bg-green-50 px-2.5 py-1 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          cached
        </span>
      )}
    </div>
  );
}

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
  dataSources: any[];
  onCopy?: (message: Message) => void;
}) {
  const isThinking = props.message.role === "assistant" && props.message.content.trim().length === 0;
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
  const hasDataSources = !isThinking && props.dataSources && props.dataSources.length > 0;
  const dispatchMeta = parseDispatchMeta(props.message, props.dataSources);
  const showDispatchBadge = props.message.role === "assistant" && !isThinking && dispatchMeta;

  return (
    <div className={cn(
      "mb-8 flex max-w-[80%] flex-col",
      props.message.role === "user" ? "ml-auto items-end" : "mr-auto items-start",
    )}>
      <div className={cn(
        "flex rounded-[24px]",
        props.message.role === "user" ? "bg-secondary px-4 py-2 text-secondary-foreground" : null,
      )}>
        {props.message.role === "assistant" && !isThinking && dispatchMeta && (
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
              {dispatchMeta.dispatch_decision === "private" ? "🔒" : "☁️"}
              {dispatchMeta.model ?? "Qwen"}
              {dispatchMeta.response_time_seconds && (
                <span className="text-muted-foreground/60">· {dispatchMeta.response_time_seconds}s</span>
              )}
            </span>
            {props.dataSources?.filter((s) => !s._aitc_meta && s.source).slice(0,1).map((src, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground">
                📋 {src.source}{src.title ? ` · ${src.title.slice(0,20)}` : ""}
              </span>
            ))}
          </div>
        )}
        {props.message.role !== "user" && (
          <div className="mr-4 border bg-secondary -mt-2 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
            {props.aiEmoji}
          </div>
        )}
        <div className="whitespace-pre-wrap flex flex-col">
          {isThinking ? (
            <div className="flex min-h-8 items-center gap-2 text-muted-foreground" aria-label="AI 思考中">
              <span className="loading-dot" />
              <span className="loading-dot [animation-delay:0.2s]" />
              <span className="loading-dot [animation-delay:0.4s]" />
            </div>
          ) : (
            <span>{renderBoldMarkdown(props.message.content)}</span>
          )}
        </div>
      </div>

      {showDispatchBadge && (
        <DispatchBadge
          decision={dispatchMeta.dispatch_decision ?? "private"}
          model={dispatchMeta.model ?? "qwen3.6:27b"}
          responseTime={dispatchMeta.response_time_seconds ?? 0}
          cached={dispatchMeta.cached ?? false}
        />
      )}

      {!isThinking ? (
        <Button type="button" variant="ghost" size="icon"
          className="mt-1 h-8 w-8 rounded-full text-muted-foreground"
          onClick={() => props.onCopy?.(props.message)}
          aria-label="複製訊息" title="複製">
          <Copy className="h-4 w-4" />
        </Button>
      ) : null}

      {hasDataSources ? (
        <div className="mt-2 w-full rounded-2xl border border-border bg-muted/40 px-3 py-2">
          <button type="button"
            className="flex w-full items-center justify-between gap-3 text-left text-sm"
            onClick={() => setIsDataSourcesOpen((current) => !current)}>
            <span className="font-medium">數據來源標註</span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", isDataSourcesOpen ? "rotate-180" : null)} />
          </button>
          {isDataSourcesOpen ? (
            <div className="mt-3 space-y-2 text-xs text-muted-foreground">
              {props.dataSources.filter((s) => !s._aitc_meta).map((source, index) => (
                <div key={`data-source-${index}`} className="rounded-xl border border-border bg-background/80 px-3 py-2">
                  <div className="font-medium text-foreground">
                    {index + 1}. {source.title ?? source.name ?? source.label ?? "資料來源"}
                  </div>
                  {source.content ?? source.pageContent ? <div className="mt-1">{source.content ?? source.pageContent}</div> : null}
                  {source.reference ?? source.period ?? source.path ? <div className="mt-1">{source.reference ?? source.period ?? source.path}</div> : null}
                </div>
              ))}
              <div className="flex justify-end pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsDataSourcesOpen(false)}>縮小</Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
