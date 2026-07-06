"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Upload, FileText, Database } from "lucide-react";
import { cn } from "@/utils/cn";

type UploadMode = "session" | "knowledge";

export function UploadDocumentsForm() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<UploadMode>("session");
  const [isUploading, setIsUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.match(/\.(pdf|docx|xlsx|txt)$/i)) {
      toast.error("不支援的檔案格式", { description: "請上傳 PDF、Word、Excel 或純文字檔案" });
      return;
    }
    if (selected.size > 50 * 1024 * 1024) {
      toast.error("檔案過大", { description: "最大支援 50MB" });
      return;
    }
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/document?mode=${mode}`, { method: "POST", body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error ?? "上傳失敗"); }
      const data = await res.json();
      toast.success(
        mode === "session"
          ? `文件已上傳，切分為 ${data.chunks ?? 0} 個段落，本次對話可使用`
          : `文件已加入知識庫，切分為 ${data.chunks ?? 0} 個段落`
      );
      setFile(null);
      const input = document.getElementById("aitc-file-input") as HTMLInputElement;
      if (input) input.value = "";
    } catch (error: any) {
      toast.error("上傳失敗", { description: error?.message ?? "請稍後再試" });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 p-1">
      <div className="flex gap-2">
        {(["session", "knowledge"] as UploadMode[]).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-colors",
              mode === m ? "border-primary bg-primary/5 text-primary" : "border-border bg-background text-muted-foreground hover:border-border/80"
            )}>
            {m === "session" ? <FileText className="h-5 w-5" /> : <Database className="h-5 w-5" />}
            <span className="font-medium">{m === "session" ? "本次對話" : "知識庫"}</span>
            <span className="text-xs opacity-70">{m === "session" ? "僅此次問答可用" : "永久儲存，所有對話可用"}</span>
          </button>
        ))}
      </div>

      <div className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-8 transition-colors",
        file ? "border-primary bg-primary/5" : "border-border"
      )}>
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-center text-sm">
          {file
            ? <span className="font-medium text-foreground">{file.name}</span>
            : <span className="text-muted-foreground">點選選擇或拖曳檔案至此</span>}
        </div>
        <div className="text-xs text-muted-foreground">支援 PDF、Word、Excel、純文字，最大 50MB</div>
        <input id="aitc-file-input" type="file" accept=".pdf,.docx,.xlsx,.txt"
          onChange={handleFileChange} className="hidden" />
        <Button type="button" variant="outline" size="sm"
          onClick={() => document.getElementById("aitc-file-input")?.click()}>
          選擇檔案
        </Button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100">
        <span className="font-semibold">所有上傳文件均為私有資料</span>，僅在 DGX Spark 本地處理，不會傳送至任何雲端服務。
      </div>

      <Button type="button" onClick={handleUpload} disabled={!file || isUploading} className="w-full">
        {isUploading ? "上傳中..." : mode === "session" ? "上傳供本次對話使用" : "加入知識庫"}
      </Button>
    </div>
  );
}
