"use client";

import type { Message } from "ai";
import { type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import {
  ChevronDown,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  History,
  MessageSquarePlus,
  Paperclip,
  Settings,
  Square,
} from "lucide-react";

import { ChatMessageBubble } from "@/components/ChatMessageBubble";
import { IntermediateStep } from "./IntermediateStep";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { UploadDocumentsForm } from "./UploadDocumentsForm";
import { KnowledgeBaseManager } from "./KnowledgeBaseManager";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/utils/cn";

const STORAGE_KEY = "aitc-chatbot-sessions-v1";
const HISTORY_PANEL_STORAGE_KEY = "aitc-chatbot-history-panel-open-v1";
const SETTINGS_PANEL_STORAGE_KEY = "aitc-chatbot-settings-panel-open-v2";

type ChatSettings = {
  company: string;
  period: string;
  periodYear: string;
  periodQuarter: string;
  statementType: string;
  selectedModel: string;
};

type CompanyOption = {
  label: string;
  promptValue: string;
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

const COMPANY_OPTIONS: CompanyOption[] = [
  { label: "彰化商業銀行股份有限公司 / 2801 / 彰銀", promptValue: "彰化商業銀行股份有限公司(2801.TW)" },
  { label: "京城商業銀行股份有限公司 / 2809 / 京城銀", promptValue: "京城商業銀行股份有限公司(2809.TW)" },
  { label: "台中商業銀行股份有限公司 / 2812 / 台中銀", promptValue: "台中商業銀行股份有限公司(2812.TW)" },
  { label: "臺灣企業銀行股份有限公司 / 2834 / 臺企銀", promptValue: "臺灣企業銀行股份有限公司(2834.TW)" },
  { label: "聯邦商業銀行股份有限公司 / 2838 / 聯邦銀", promptValue: "聯邦商業銀行股份有限公司(2838.TW)" },
  { label: "遠東國際商業銀行股份有限公司 / 2845 / 遠東銀", promptValue: "遠東國際商業銀行股份有限公司(2845.TW)" },
  { label: "新光產物保險股份有限公司 / 2850 / 新產", promptValue: "新光產物保險股份有限公司(2850.TW)" },
  { label: "中央再保險股份有限公司 / 2851 / 中再保", promptValue: "中央再保險股份有限公司(2851.TW)" },
  { label: "第一產物保險股份有限公司 / 2852 / 第一保", promptValue: "第一產物保險股份有限公司(2852.TW)" },
  { label: "三商美邦人壽保險股份有限公司 / 2867 / 三商壽", promptValue: "三商美邦人壽保險股份有限公司(2867.TW)" },
  { label: "華南金融控股股份有限公司 / 2880 / 華南金", promptValue: "華南金融控股股份有限公司(2880.TW)" },
  { label: "富邦金融控股股份有限公司 / 2881 / 富邦金", promptValue: "富邦金融控股股份有限公司(2881.TW)" },
  { label: "國泰金融控股股份有限公司 / 2882 / 國泰金", promptValue: "國泰金融控股股份有限公司(2882.TW)" },
  { label: "開發金融控股股份有限公司 / 2883 / 開發金", promptValue: "開發金融控股股份有限公司(2883.TW)" },
  { label: "玉山金融控股股份有限公司 / 2884 / 玉山金", promptValue: "玉山金融控股股份有限公司(2884.TW)" },
  { label: "元大金融控股股份有限公司 / 2885 / 元大金", promptValue: "元大金融控股股份有限公司(2885.TW)" },
  { label: "兆豐金融控股股份有限公司 / 2886 / 兆豐金", promptValue: "兆豐金融控股股份有限公司(2886.TW)" },
  { label: "台新金融控股股份有限公司 / 2887 / 台新金", promptValue: "台新金融控股股份有限公司(2887.TW)" },
  { label: "新光金融控股股份有限公司 / 2888 / 新光金", promptValue: "新光金融控股股份有限公司(2888.TW)" },
  { label: "國票金融控股股份有限公司 / 2889 / 國票金", promptValue: "國票金融控股股份有限公司(2889.TW)" },
  { label: "永豐金融控股股份有限公司 / 2890 / 永豐金", promptValue: "永豐金融控股股份有限公司(2890.TW)" },
  { label: "中國信託金融控股股份有限公司 / 2891 / 中信金", promptValue: "中國信託金融控股股份有限公司(2891.TW)" },
  { label: "第一金融控股股份有限公司 / 2892 / 第一金", promptValue: "第一金融控股股份有限公司(2892.TW)" },
  { label: "三商投資控股股份有限公司 / 2905 / 三商", promptValue: "三商投資控股股份有限公司(2905.TW)" },
  { label: "合庫金融控股股份有限公司 / 5834 / 合庫金", promptValue: "合庫金融控股股份有限公司(5834.TW)" },
  { label: "上海商業儲蓄銀行股份有限公司 / 5876 / 上海商銀", promptValue: "上海商業儲蓄銀行股份有限公司(5876.TW)" },
];

function getCompanyPromptValue(companyLabel: string) {
  if (!companyLabel) return "";
  return (
    COMPANY_OPTIONS.find((option) => option.label === companyLabel)?.promptValue ??
    companyLabel
  );
}

function getPeriodPromptValue(settings: ChatSettings) {
  if (!settings.period) return "";

  if (settings.period === "年度") {
    if (!settings.periodYear) return "";
    return `${settings.periodYear}年度`;
  }

  if (settings.period === "季度") {
    if (!settings.periodYear || !settings.periodQuarter) return "";
    return `${settings.periodYear}年${settings.periodQuarter}`;
  }

  return settings.period;
}

function getBackendPeriodLabel(settings: ChatSettings) {
  if (!settings.period) return "";

  if (settings.period === "年度") {
    return settings.periodYear ? `${settings.periodYear}年度` : "年度";
  }

  if (settings.period === "季度") {
    if (settings.periodYear && settings.periodQuarter) {
      return `${settings.periodYear}年${settings.periodQuarter}`;
    }
    return "季度";
  }

  return settings.period;
}

function buildDirectChatApiUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_CHATBOT_API_BASE_URL;
  if (!baseUrl) return null;

  const path = process.env.NEXT_PUBLIC_CHATBOT_API_CHAT_PATH ?? "/chat";
  return `${baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}

function formatQuestionWithContext(question: string, settings: ChatSettings) {
  const trimmedQuestion = question.trim();
  if (!trimmedQuestion) return "";

  const company = getCompanyPromptValue(settings.company);
  const period = getPeriodPromptValue(settings);
  if (!company && !period) return trimmedQuestion;
  if (!company || !period) return trimmedQuestion;
  return `${company} ${period}${trimmedQuestion}`;
}

function getSelectedConditionSummary(settings: ChatSettings) {
  const company = getCompanyPromptValue(settings.company);
  const period = getPeriodPromptValue(settings);
  const modelMap: Record<string, string> = {
    qwen: "Qwen 2.5 · 14B",
    finr1: "Fin-R1 · 7B",
    mengzi: "Mengzi-BERT-fin",
    claude: "Claude Sonnet 4.6",
  };
  const modelLabel = modelMap[settings.selectedModel ?? "qwen"] ?? "Qwen 2.5 · 14B";

  if (!company && !period) {
    return `${modelLabel} · 未套用公司與期間條件`;
  }
  if (company && period) {
    return `${modelLabel} · ${company} / ${period}`;
  }
  return `${modelLabel} · 條件未完整`;
}

function createEmptySettings(): ChatSettings {
  return {
    company: "",
    period: "",
    periodYear: "",
    periodQuarter: "",
    statementType: "",
    selectedModel: "qwen",
  };
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function parseBase64JsonHeader<T>(value: string): T {
  const binaryString = atob(value);
  const bytes = Uint8Array.from(binaryString, (char) => char.charCodeAt(0));
  const decoded = new TextDecoder("utf-8").decode(bytes);
  return JSON.parse(decoded) as T;
}

function buildSessionTitle(messages: Message[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");
  if (!firstUserMessage?.content) return "新對話";
  return firstUserMessage.content.slice(0, 24);
}

function createEmptySession(): ChatSession {
  const now = new Date().toISOString();
  return {
    id: createId(),
    title: "新對話",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

function persistSessions(sessions: ChatSession[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function upsertSession(
  sessions: ChatSession[],
  sessionId: string,
  messages: Message[],
) {
  const now = new Date().toISOString();
  const existingSession = sessions.find((session) => session.id === sessionId);

  if (!existingSession) {
    return [
      {
        id: sessionId,
        title: buildSessionTitle(messages),
        createdAt: now,
        updatedAt: now,
        messages,
      },
      ...sessions,
    ];
  }

  return sessions
    .map((session) =>
      session.id === sessionId
        ? {
            ...session,
            title: buildSessionTitle(messages),
            updatedAt: now,
            messages,
          }
        : session,
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function formatConversationForCopy(messages: Message[]) {
  return messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .map(
      (message) =>
        `${message.role === "user" ? "使用者" : "助理"}: ${message.content}`,
    )
    .join("\n\n");
}

async function copyText(text: string, successMessage: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    toast.success(successMessage);
  } catch {
    toast.error("複製失敗");
  }
}

function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  presetQuestions?: string[];
  dataSourcesForMessages: Record<string, any[]>;
  aiEmoji?: string;
  className?: string;
  onCopyMessage: (message: Message) => void;
  onSelectPresetQuestion: (question: string) => void;
  loadingStep?: string;
  loadingElapsed?: number;
  company?: string;
  period?: string;
}) {
  return (
    <div className={cn("flex flex-col mx-auto pb-12 w-full", props.className)}>
      {props.messages.length === 0 ? (
        <div className="flex flex-col items-center gap-6">
          {props.emptyStateComponent}

          {props.presetQuestions?.length ? (
            <div className="flex w-full max-w-[900px] flex-col items-center gap-4">
              <div className="text-sm font-medium text-muted-foreground">
                常用問題模板
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                {props.presetQuestions.map((question) => (
                  <Button
                    key={question}
                    type="button"
                    variant="outline"
                    className="h-auto max-w-[280px] whitespace-normal rounded-full px-5 py-3 text-left"
                    onClick={() => props.onSelectPresetQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {props.messages.map((message, index) => {
        if (message.role === "system") {
          return <IntermediateStep key={message.id} message={message} />;
        }

        return (
          <ChatMessageBubble
            key={message.id}
            message={message}
            aiEmoji={props.aiEmoji}
            dataSources={props.dataSourcesForMessages[message.id] ?? []}
            onCopy={props.onCopyMessage}
            loadingStep={props.loadingStep}
            loadingElapsed={props.loadingElapsed}
            company={props.company}
            period={props.period}
            reportId={(message as any).report_id ?? ""}
          />
        );
      })}
    </div>
  );
}

export function ChatInput(props: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onStop?: () => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
  actions?: ReactNode;
  modelSelector?: ReactNode;
  loadingStep?: string;
  loadingElapsed?: number;
}) {
  const disabled = props.loading ? false : props.value.trim().length === 0;

  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        e.preventDefault();

        if (props.loading) {
          props.onStop?.();
        } else {
          props.onSubmit(e);
        }
      }}
      className={cn("mx-auto flex w-full flex-col", props.className)}
    >
      <div className="border border-input bg-secondary rounded-lg flex flex-col gap-2 w-full mx-auto">
        <input
          value={props.value}
          placeholder={props.placeholder}
          onChange={props.onChange}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              const form = e.currentTarget.closest("form");
              if (form) form.requestSubmit();
            }
          }}
          className="border-none outline-none bg-transparent p-4"
        />

        <div className="flex justify-between ml-4 mr-2 mb-2">
          <div className="flex gap-3">{props.children}</div>

          <div className="flex gap-2 self-end">
            {props.actions}
            <Button
              type="submit"
              className="self-end"
              variant={props.loading ? "destructive" : "default"}
              disabled={disabled}
            >
              {props.loading ? (
                <>
                  <Square className="h-4 w-4 fill-current" />
                  停止生成
                </>
              ) : (
                <span>送出</span>
              )}
            </Button>
          </div>
        </div>
      </div>


    </form>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="w-4 h-4" />
      <span>回到底部</span>
    </Button>
  );
}

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();

  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={cn("grid grid-rows-[1fr,auto]", props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

export function ChatLayout(props: { content: ReactNode; footer: ReactNode }) {
  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={props.content}
        footer={
          <div className="sticky bottom-8 px-2">
            <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
            {props.footer}
          </div>
        }
      />
    </StickToBottom>
  );
}

function ConversationHistory(props: {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onCreate: () => void;
  onDelete: (sessionId: string) => void;
  className?: string;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className={cn("flex h-full flex-col bg-muted/30", props.className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
        <div>
          <div className="text-sm font-semibold">對話歷史紀錄</div>
          <div className="text-xs text-muted-foreground">可切換過去案件或問答</div>
        </div>
        {props.onToggleCollapse ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={props.onToggleCollapse}
          >
            <ChevronLeft className="h-4 w-4" />
            收合
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" onClick={props.onCreate}>
            <MessageSquarePlus className="h-4 w-4" />
            新對話
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {props.sessions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            目前尚無歷史紀錄
          </div>
        ) : null}

        <div className="space-y-2">
          {props.sessions.map((session) => (
            <div
              key={session.id}
              className={cn(
                "group mx-auto flex w-full max-w-[262px] items-start overflow-hidden rounded-lg border transition-colors",
                session.id === props.activeSessionId
                  ? "border-primary bg-background"
                  : "border-transparent bg-background/60 hover:border-border",
              )}
            >
              <button
                type="button"
                onClick={() => props.onSelect(session.id)}
                className="flex-1 overflow-hidden px-3 py-3 text-left"
              >
                <div className="line-clamp-2 break-words text-sm font-medium leading-5">
                  {session.title}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {(() => {
                    const date = new Date(session.updatedAt);
                    const now = new Date();
                    const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
                    const diffHr = Math.floor(diffMin / 60);
                    const diffDay = Math.floor(diffHr / 24);
                    if (diffMin < 1) return "剛才";
                    if (diffMin < 60) return `${diffMin}分鐘前`;
                    if (diffHr < 24) return `${diffHr}小時前`;
                    if (diffDay === 1) return "昨天";
                    if (diffDay < 7) return `${diffDay}天前`;
                    return date.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" });
                  })()}
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("確定刪除此對話？")) props.onDelete(session.id);
                }}
                className="flex-shrink-0 self-center px-2 py-2 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400"
                title="刪除對話"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function YearPickerField(props: {
  value: string;
  onChange: (year: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const maxYear = new Date().getFullYear() + 3;
  const minYear = 1980;
  const yearOptions = Array.from({ length: maxYear - minYear + 1 }, (_, index) =>
    String(maxYear - index),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-between bg-background px-3 py-2 text-sm font-normal"
        >
          <span>{props.value} 年</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-3">
        <div className="mb-3 text-sm font-medium">選擇年度</div>
        <div className="grid max-h-[280px] grid-cols-3 gap-2 overflow-y-auto pr-1">
          {yearOptions.map((year) => (
            <Button
              key={year}
              type="button"
              variant={props.value === year ? "default" : "outline"}
              size="sm"
              className="w-full"
              onClick={() => {
                props.onChange(year);
                setOpen(false);
              }}
            >
              {year}
            </Button>
          ))}
        </div>
        <div className="pt-3 text-center text-xs text-muted-foreground">
          可選擇 {minYear} 年至 {maxYear} 年
        </div>
      </PopoverContent>
    </Popover>
  );
}

function SettingsPanel(props: {
  value: ChatSettings;
  onChange: (nextValue: ChatSettings) => void;
  className?: string;
  onToggleCollapse?: () => void;
  onExampleClick?: (example: string) => void;
}) {
  const quarterOptions = ["Q1", "Q2", "Q3", "Q4"];

  return (
    <div className={cn("flex h-full flex-col bg-muted/30", props.className)}>
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
        <div>
          <div className="text-sm font-semibold">查詢設定</div>
          <div className="text-xs text-muted-foreground">選擇公司、期間、模型</div>
        </div>
        {props.onToggleCollapse ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={props.onToggleCollapse}
          >
            收合
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 scrollbar-thin">
        <div className="space-y-2">
          <label className="text-sm font-medium">公司選擇器</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
            value={props.value.company}
            onChange={(event) =>
              props.onChange({ ...props.value, company: event.target.value })
            }
          >
            <option value="">空</option>
            {COMPANY_OPTIONS.map((option) => (
              <option key={option.label} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">期間選擇器</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
            value={props.value.period}
            onChange={(event) => {
              const nextPeriod = event.target.value;
              props.onChange({
                ...props.value,
                period: nextPeriod,
                periodYear: nextPeriod === "年度" || nextPeriod === "季度" ? "2025" : "",
                periodQuarter: nextPeriod === "季度" ? "Q1" : "",
              });
            }}
          >
            <option value="">空</option>
            <option value="年度">年度</option>
            <option value="季度">季度</option>
            <option value="近三年">近三年</option>
            <option value="近五年">近五年</option>
          </select>

          {props.value.period === "年度" ? (
            <YearPickerField
              value={props.value.periodYear}
              onChange={(year) => props.onChange({ ...props.value, periodYear: year })}
            />
          ) : null}

          {props.value.period === "季度" ? (
            <div className="grid grid-cols-2 gap-2">
              <YearPickerField
                value={props.value.periodYear}
                onChange={(year) =>
                  props.onChange({
                    ...props.value,
                    periodYear: year,
                  })
                }
              />

              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
                value={props.value.periodQuarter}
                onChange={(event) =>
                  props.onChange({
                    ...props.value,
                    periodQuarter: event.target.value,
                  })
                }
              >
                {quarterOptions.map((quarter) => (
                  <option key={quarter} value={quarter}>
                    {quarter}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">模型選擇器</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
            value={props.value.selectedModel}
            onChange={(event) => props.onChange({ ...props.value, selectedModel: event.target.value })}
          >
            <option value="qwen">Qwen 2.5 · 14B — 數據查詢</option>
            <option value="finr1">Fin-R1 · 7B — 財務計算</option>
            <option value="mengzi">Mengzi-BERT-fin — 快速分類</option>
            <option value="claude">Claude Sonnet 4.6 — 深度分析</option>
          </select>
          {/* Model description card — updates on selection */}
          {(() => {
            const MODEL_INFO: Record<string, { border: string; bg: string; badge: string; label: string; job: string; examples: string[] }> = {
              qwen:   { border: "border-blue-500/30", bg: "bg-blue-500/5", badge: "bg-blue-500/20 text-blue-300 border border-blue-500/30", label: "數據查詢", job: "查詢 XBRL 財務數值與多期比較", examples: ["兆豐金 2024Q3 負債比率", "富邦金近三年資產規模", "國泰金 EPS"] },
              finr1:  { border: "border-green-500/30", bg: "bg-green-500/5", badge: "bg-green-500/20 text-green-300 border border-green-500/30", label: "財務計算", job: "計算財務比率並判斷 FSC 合規狀態", examples: ["兆豐金 ROA 是否達標", "富邦金負債比率風險等級", "國泰金流動比率評估"] },
              mengzi: { border: "border-amber-500/30", bg: "bg-amber-500/5", badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30", label: "快速分類", job: "快速判斷財務健康狀態（偏高／正常／偏低）", examples: ["負債比率 91% 是否偏高", "EPS 1.98 元正常嗎", "流動比率 1.2 倍分類"] },
              claude: { border: "border-violet-500/30", bg: "bg-violet-500/5", badge: "bg-violet-500/20 text-violet-300 border border-violet-500/30", label: "深度分析", job: "出具完整 FSC 信用調查報告", examples: ["富邦金 2024Q3 信用調查報告", "國泰金財務風險評估", "兆豐金三期趨勢分析"] },
            };
            const m = MODEL_INFO[props.value.selectedModel];
            if (!m) return null;
            return (
              <div className={"rounded-lg border p-3 space-y-3 " + m.border + " " + m.bg}>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className={"rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide " + m.badge}>
                    {m.label}
                  </span>
                  <span className="text-[10px] text-foreground/30 font-mono">Agent</span>
                </div>
                {/* Job description */}
                <p className="text-[11px] text-foreground/75 leading-relaxed">{m.job}</p>
                {/* Divider */}
                <div className="border-t border-white/5" />
                {/* Example questions */}
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-foreground/40 uppercase tracking-widest mb-2">範例問題</p>
                  {m.examples.map((ex: string) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => props.onExampleClick?.(ex)}
                      className={"w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] text-foreground/55 transition-all duration-150 hover:text-foreground/90 hover:" + m.bg + " hover:border hover:" + m.border + " border border-transparent"}
                    >
                      <span className="flex-shrink-0 w-1 h-1 rounded-full bg-foreground/25 mt-px" />
                      <span className="leading-snug">{ex}</span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
          
        </div>



        {/* <div className="space-y-2">
          <label className="text-sm font-medium">財報類型選擇</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none"
            value={props.value.statementType}
            onChange={(event) =>
              props.onChange({
                ...props.value,
                statementType: event.target.value,
              })
            }
          >
            <option value="個體財報">個體財報</option>
            <option value="合併財報">合併財報</option>
            <option value="年報">年報</option>
            <option value="季報">季報</option>
          </select>
        </div> */}

      </div>
    </div>
  );
}

export function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent: ReactNode;
  presetQuestions?: string[];
  placeholder?: string;
  emoji?: string;
  showIngestForm?: boolean;
  showIntermediateStepsToggle?: boolean;
}) {
  const [showIntermediateSteps, setShowIntermediateSteps] = useState(
    !!props.showIntermediateStepsToggle,
  );
  const [intermediateStepsLoading, setIntermediateStepsLoading] =
    useState(false);
  const [dataSourcesForMessages, setDataSourcesForMessages] = useState<
    Record<string, any[]>
  >({});
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [draftSession, setDraftSession] = useState<ChatSession | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(true);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(true);
  const [settings, setSettings] = useState<ChatSettings>(createEmptySettings());
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [loadingElapsed, setLoadingElapsed] = useState<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const storedSessions = window.localStorage.getItem(STORAGE_KEY);
    if (!storedSessions) {
      const initialDraftSession = createEmptySession();
      setSessions([]);
      setDraftSession(initialDraftSession);
      setActiveSessionId(initialDraftSession.id);
      return;
    }

    try {
      const parsedSessions = JSON.parse(storedSessions) as ChatSession[];
      if (parsedSessions.length === 0) {
        const initialDraftSession = createEmptySession();
        setSessions([]);
        setDraftSession(initialDraftSession);
        setActiveSessionId(initialDraftSession.id);
        return;
      }

      const sortedSessions = parsedSessions.sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
      setSessions(sortedSessions);
      setDraftSession(null);
      setActiveSessionId(sortedSessions[0].id);
    } catch {
      const initialDraftSession = createEmptySession();
      setSessions([]);
      setDraftSession(initialDraftSession);
      setActiveSessionId(initialDraftSession.id);
    }
  }, []);

  useEffect(() => {
    const storedPanelState = window.localStorage.getItem(
      HISTORY_PANEL_STORAGE_KEY,
    );
    if (storedPanelState === null) return;

    setIsHistoryPanelOpen(storedPanelState === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      HISTORY_PANEL_STORAGE_KEY,
      String(isHistoryPanelOpen),
    );
  }, [isHistoryPanelOpen]);

  useEffect(() => {
    const storedPanelState = window.localStorage.getItem(
      SETTINGS_PANEL_STORAGE_KEY,
    );
    if (storedPanelState === null) return;

    setIsSettingsPanelOpen(storedPanelState === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      SETTINGS_PANEL_STORAGE_KEY,
      String(isSettingsPanelOpen),
    );
  }, [isSettingsPanelOpen]);

  const activeSession = useMemo(
    () =>
      sessions.find((session) => session.id === activeSessionId) ??
      (draftSession?.id === activeSessionId ? draftSession : null),
    [activeSessionId, draftSession, sessions],
  );

  const activeMessages = activeSession?.messages ?? [];
  const selectedConditionSummary = getSelectedConditionSummary(settings);
  const directChatApiUrl = buildDirectChatApiUrl();
  const openSidePanelsCount = Number(isHistoryPanelOpen) + Number(isSettingsPanelOpen);
  const contentMaxWidthClass =
    openSidePanelsCount === 2
      ? "max-w-[768px]"
      : openSidePanelsCount === 1
        ? "max-w-[960px]"
        : "max-w-[1100px]";
  const shellMaxWidthClass =
    openSidePanelsCount === 2
      ? "max-w-[1100px]"
      : openSidePanelsCount === 1
        ? "max-w-[1320px]"
        : "max-w-[1400px]";

  function replaceActiveSession(messages: Message[]) {
    if (!activeSessionId) return;

    const isSavedSession = sessions.some((session) => session.id === activeSessionId);

    if (!isSavedSession && messages.length === 0) {
      setDraftSession((currentDraftSession) =>
        currentDraftSession && currentDraftSession.id === activeSessionId
          ? { ...currentDraftSession, messages }
          : currentDraftSession,
      );
      return;
    }

    setSessions((currentSessions) => {
      const nextSessions = upsertSession(currentSessions, activeSessionId, messages);
      persistSessions(nextSessions);
      return nextSessions;
    });

    if (!isSavedSession) {
      setDraftSession(null);
    }
  }

  function createSession() {
    if (activeMessages.length === 0) {
      setInput("");
      setDataSourcesForMessages({});
      return;
    }

    const nextDraftSession = createEmptySession();
    setDraftSession(nextDraftSession);
    setActiveSessionId(nextDraftSession.id);
    setInput("");
    setDataSourcesForMessages({});
  }

  function selectSession(sessionId: string) {
    setActiveSessionId(sessionId);
    setInput("");
    setDataSourcesForMessages({});
  }

  function stopGenerating() {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
    setIntermediateStepsLoading(false);
  }

  async function streamAssistantReply(
    requestMessages: Message[],
    options?: { displayMessages?: Message[] },
  ) {
    if (!activeSessionId) return;

    const assistantMessageId = createId();
    const displayMessages =
      options?.displayMessages ??
      requestMessages.concat({
        id: assistantMessageId,
        role: "assistant",
        content: "",
      });

    replaceActiveSession(displayMessages);
    setIsLoading(true);
    setIntermediateStepsLoading(true);
    setDataSourcesForMessages({});
    setLoadingStep("分析問題中...");
    setLoadingElapsed(0);
    const _loadStart = Date.now();
    const _elapsedTimer = setInterval(() => {
      setLoadingElapsed(Math.floor((Date.now() - _loadStart) / 1000));
    }, 1000);
    const _stepTimeouts = [
      setTimeout(() => setLoadingStep("識別財務報表類型..."), 3000),
      setTimeout(() => setLoadingStep("查詢 XBRL 資料庫..."), 8000),
      setTimeout(() => setLoadingStep("比對財務欄位..."), 20000),
      setTimeout(() => setLoadingStep("生成回答..."), 45000),
    ];
    (window as any)._loadingTimer = _elapsedTimer;
    (window as any)._stepTimeouts = _stepTimeouts;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // ── Direct FastAPI call ──────────────────────────────────
      const question = requestMessages[requestMessages.length - 1]?.content?.toString() ?? "";
      const backendBase = process.env.NEXT_PUBLIC_CHATBOT_API_BASE_URL ?? "";
      let response: Response;

      if (backendBase) {
        // Call FastAPI directly: GET /chatbot/{question}
        const encoded = encodeURIComponent(question.trim());
        const mode = settings.selectedModel ?? "qwen";
        response = await fetch(`${backendBase}/chatbot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, mode }),
          signal: controller.signal,
        });
      } else {
        // Fallback to Next.js proxy
        response = await fetch(props.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/plain",
          },
          body: JSON.stringify({
            question,
            company: settings.company ?? "",
            period: getBackendPeriodLabel(settings),
            conversationId: activeSessionId,
            messages: requestMessages,
            settings,
            show_intermediate_steps: showIntermediateSteps,
          }),
          signal: controller.signal,
        });
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "聊天服務回傳失敗");
      }

      const dataSourcesHeader =
        response.headers.get("x-data-sources") ??
        response.headers.get("x-sources");
      if (dataSourcesHeader) {
        setDataSourcesForMessages({
          [assistantMessageId]: parseBase64JsonHeader<any[]>(dataSourcesHeader),
        });
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const json = await response.json();
        const assistantContent =
          typeof json?.answer === "string"
            ? json.answer
            : typeof json?.message === "string"
              ? json.message
              : JSON.stringify(json);
        const dataSources = Array.isArray(json?.data_sources) ? json.data_sources : [];

        if (!dataSourcesHeader && dataSources.length > 0) {
          setDataSourcesForMessages({
            [assistantMessageId]: dataSources,
          });
        }

        const finalMessages = requestMessages.concat({
          id: assistantMessageId,
          role: "assistant",
          content: assistantContent,
        });
        replaceActiveSession(finalMessages);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("找不到回應串流");

      const decoder = new TextDecoder();
      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantContent += decoder.decode(value, { stream: true });
        const nextMessages = requestMessages.concat({
          id: assistantMessageId,
          role: "assistant",
          content: assistantContent,
        });
        replaceActiveSession(nextMessages);
      }

      const finalMessages = requestMessages.concat({
        id: assistantMessageId,
        role: "assistant",
        content: assistantContent,
      });
      replaceActiveSession(finalMessages);
    } catch (error: any) {
      if (error?.name === "AbortError") {
        toast.message("已停止生成");
      } else {
        const fallbackMessages =
          displayMessages[displayMessages.length - 1]?.content?.length === 0
            ? displayMessages.slice(0, -1)
            : displayMessages;
        replaceActiveSession(fallbackMessages);
        toast.error("Error while processing your request", {
          description: error?.message ?? "未知錯誤",
        });
      }
    } finally {
      abortControllerRef.current = null;
      setIsLoading(false);
      setIntermediateStepsLoading(false);
      setLoadingStep("");
      setLoadingElapsed(0);
      if ((window as any)._loadingTimer) {
        clearInterval((window as any)._loadingTimer);
        (window as any)._loadingTimer = null;
      }
      if ((window as any)._stepTimeouts) {
        ((window as any)._stepTimeouts as ReturnType<typeof setTimeout>[]).forEach(clearTimeout);
        (window as any)._stepTimeouts = null;
      }
      if ((window as any)._stepTimeouts) {
        (window as any)._stepTimeouts.forEach((t: any) => clearTimeout(t));
        (window as any)._stepTimeouts = null;
      }
    }
  }

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading || intermediateStepsLoading || !activeSessionId) return;

    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    const outboundQuestion = formatQuestionWithContext(trimmedInput, settings);
    if (!outboundQuestion) return;

    const nextMessages = activeMessages.concat({
      id: createId(),
      content: outboundQuestion,
      role: "user",
    });
    setInput("");
    await streamAssistantReply(nextMessages);
  }

  async function sendPresetQuestion(question: string) {
    if (isLoading || intermediateStepsLoading || !activeSessionId) return;

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;
    const outboundQuestion = formatQuestionWithContext(trimmedQuestion, settings);
    if (!outboundQuestion) return;

    const nextMessages = activeMessages.concat({
      id: createId(),
      content: outboundQuestion,
      role: "user",
    });

    await streamAssistantReply(nextMessages);
  }

  function deleteSession(sessionId: string) {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== sessionId);
      persistSessions(next);
      // If deleting active session, switch to first remaining or create new
      if (sessionId === activeSessionId) {
        if (next.length > 0) {
          setActiveSessionId(next[0].id);
        } else {
          const newSession = createEmptySession();
          persistSessions([newSession]);
          setSessions([newSession]);
          setActiveSessionId(newSession.id);
        }
      }
      return next;
    });
  }
  function handleCopyMessage(message: Message) {
    copyText(message.content, "已複製回答");
  }

  function handleCopyConversation() {
    copyText(formatConversationForCopy(activeMessages), "已複製整段對話");
  }

  function clearCompanyConditions() {
    setSettings(createEmptySettings());
  }

  return (
    <div className="flex h-full bg-background">
      <aside
        className={cn(
          "hidden shrink-0 overflow-hidden border-r border-border bg-muted/20 transition-[width] duration-300 lg:flex",
          isHistoryPanelOpen ? "w-[300px]" : "w-0 border-r-0",
        )}
      >
        <div className="flex min-w-0 flex-1">
          <ConversationHistory
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={selectSession}
            onCreate={createSession}
            onDelete={deleteSession}
            className="flex-1"
            onToggleCollapse={() => setIsHistoryPanelOpen(false)}
          />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-border px-4 py-3">
          <div
            className={cn(
              "mx-auto flex items-center justify-between gap-3 transition-[max-width] duration-300",
              shellMaxWidthClass,
            )}
          >
            <div className="flex items-center gap-3">
              {!isHistoryPanelOpen ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="hidden lg:inline-flex"
                  onClick={() => setIsHistoryPanelOpen(true)}
                >
                  <ChevronRight className="h-4 w-4" />
                  歷史對話
                </Button>
              ) : null}

              <div>
                <div className="text-sm font-semibold">AITC Credit Investigation Chatbot</div>
                <div className="text-xs text-muted-foreground">
                  支援多輪對話、停止生成、複製與歷史紀錄
                </div>
                <div className="mt-2 inline-flex rounded-full border border-sky-300 bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900 shadow-sm dark:border-sky-800 dark:bg-sky-950 dark:text-sky-100">
                  {selectedConditionSummary}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="lg:hidden">
                    <History className="h-4 w-4" />
                    歷史紀錄
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0 sm:max-w-md">
                  <DialogHeader className="px-6 pt-6">
                    <DialogTitle>對話歷史紀錄</DialogTitle>
                    <DialogDescription>切換過去的案件與問答內容</DialogDescription>
                  </DialogHeader>
                  <div className="h-[60vh]">
                    <ConversationHistory
                      sessions={sessions}
                      activeSessionId={activeSessionId}
                      onSelect={selectSession}
                      onCreate={createSession}
                      onDelete={deleteSession}
                      className="border-r border-border"
                    />
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearCompanyConditions}
              >
                清除公司條件
              </Button>

              <Button type="button" variant="outline" size="sm" onClick={handleCopyConversation}>
                <Copy className="h-4 w-4" />
                複製完整對話
              </Button>

              <Button type="button" variant="outline" size="sm" onClick={createSession}>
                <MessageSquarePlus className="h-4 w-4" />
                新對話
              </Button>

              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden lg:inline-flex"
                onClick={() => setIsSettingsPanelOpen((current) => !current)}
              >
                <Settings className="h-4 w-4" />
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="icon" className="lg:hidden">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="p-0 sm:max-w-md">
                  <DialogHeader className="px-6 pt-6">
                    <DialogTitle>查詢設定</DialogTitle>
                    <DialogDescription>選擇公司、期間、模型</DialogDescription>
                  </DialogHeader>
                  <div className="h-[60vh]">
                    <SettingsPanel
                      value={settings}
                      onChange={setSettings}
                      className="h-full"
                      onExampleClick={(ex) => setInput(ex)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <main className="relative flex-1">
          <ChatLayout
            content={
              <ChatMessages
                aiEmoji={props.emoji}
                messages={activeMessages}
                emptyStateComponent={props.emptyStateComponent}
                presetQuestions={props.presetQuestions}
                dataSourcesForMessages={dataSourcesForMessages}
                className={contentMaxWidthClass}
                onCopyMessage={handleCopyMessage}
                loadingStep={loadingStep}
                loadingElapsed={loadingElapsed}
                company={settings.company}
                period={getPeriodPromptValue(settings)}
                onSelectPresetQuestion={sendPresetQuestion}
              />
            }
            footer={
              <ChatInput
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onSubmit={sendMessage}
                onStop={stopGenerating}
                loading={isLoading || intermediateStepsLoading}
                placeholder={props.placeholder}
                className={contentMaxWidthClass}
                loadingStep={loadingStep}
                loadingElapsed={loadingElapsed}
              >
                {props.showIntermediateStepsToggle && (
                  <>
                    <Checkbox
                      id="show_intermediate_steps"
                      checked={showIntermediateSteps}
                      onCheckedChange={(isChecked) => {
                        setShowIntermediateSteps(!!isChecked);
                      }}
                    />
                    <label htmlFor="show_intermediate_steps">Show intermediate steps</label>
                  </>
                )}

                {props.showIngestForm && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Paperclip className="h-4 w-4" />
                        <span>Upload Documents</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Documents</DialogTitle>
                        <DialogDescription>
                          Upload files to use them as context in your chats.
                        </DialogDescription>
                      </DialogHeader>
                      <UploadDocumentsForm />
                    </DialogContent>
                  </Dialog>
                )}
              </ChatInput>
            }
          />
        </main>
      </div>

      <aside
        className={cn(
          "hidden shrink-0 overflow-hidden border-l border-border bg-muted/20 transition-[width] duration-300 lg:flex",
          isSettingsPanelOpen ? "w-[320px]" : "w-0 border-l-0",
        )}
      >
        <div className="flex min-w-0 flex-1">
          <SettingsPanel
            value={settings}
            onChange={setSettings}
            className="flex-1"
            onToggleCollapse={() => setIsSettingsPanelOpen(false)}
            onExampleClick={(ex) => setInput(ex)}
          />
        </div>
      </aside>
    </div>
  );
}
