"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Trash2, RefreshCw, Database, FileText } from "lucide-react";
import { cn } from "@/utils/cn";

type KBState = { documents: string[]; total_chunks: number };

export function KnowledgeBaseManager() {
  const [state, setState] = useState<KBState>({ documents: [], total_chunks: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  async function loadKnowledgeBase() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/document");
      if (!res.ok) throw new Error("Failed to load");
      setState(await res.json());
    } catch {
      toast.error("無法載入知識庫清單");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteDocument(filename: string) {
    setDeletingFile(filename);
    try {
      const res = await fetch(`/api/document?filename=${encodeURIComponent(filename)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(`已從知識庫移除：${filename}`);
      await loadKnowledgeBase();
    } catch {
      toast.error("刪除失敗，請稍後再試");
    } finally {
      setDeletingFile(null);
    }
  }

  useEffect(() => { loadKnowledgeBase(); }, []);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Database className="h-4 w-4" />知識庫
        </div>
        <Button type="button" variant="ghost" size="icon" className="h-7 w-7"
          onClick={loadKnowledgeBase} disabled={isLoading} title="重新整理">
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
        </Button>
      </div>

      {state.documents.length > 0 && (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          {state.documents.length} 份文件 · {state.total_chunks} 個段落
        </div>
      )}

      {state.documents.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
          {isLoading ? "載入中..." : "知識庫目前沒有文件"}
        </div>
      ) : (
        <div className="space-y-1.5">
          {state.documents.map((filename) => (
            <div key={filename} className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2">
              <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate text-xs" title={filename}>{filename}</span>
              <Button type="button" variant="ghost" size="icon"
                className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => deleteDocument(filename)}
                disabled={deletingFile === filename} title="從知識庫移除">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        所有文件儲存於 DGX Spark 本地磁碟，僅在 On-premise 模式下使用。
      </div>
    </div>
  );
}
