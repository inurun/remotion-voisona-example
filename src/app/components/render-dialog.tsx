"use client";

import type React from "react";
import { Clapperboard, Download } from "lucide-react";
import { Button, buttonVariants } from "@/_shared/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/_shared/components/ui/dialog";
import { cn } from "@/_shared/lib/utils";
import { type useRenderState } from "@/app/features/render/render-state";
import { type useVoices } from "@/app/features/voisona/voices";

function getStatusChipClass(
  status:
    | ReturnType<typeof useRenderState>["renderState"]["status"]
    | ReturnType<typeof useVoices>["voices"]["status"],
) {
  return {
    error: "border-destructive/20 bg-destructive/10 text-destructive",
    idle: "border-border bg-secondary text-secondary-foreground",
    loading: "border-primary/20 bg-primary/10 text-primary",
    ready: "border-emerald-600/20 bg-emerald-600/10 text-emerald-700",
    running: "border-primary/20 bg-primary/10 text-primary",
    success: "border-emerald-600/20 bg-emerald-600/10 text-emerald-700",
  }[status];
}

function StatusChip({ children, status }: { children: React.ReactNode; status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        getStatusChipClass(
          status as
            | ReturnType<typeof useRenderState>["renderState"]["status"]
            | ReturnType<typeof useVoices>["voices"]["status"],
        ),
      )}
    >
      {children}
    </span>
  );
}

function RenderLogs({ logs }: { logs: string[] }) {
  return (
    <div className="min-h-[220px] max-h-[320px] overflow-auto rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs leading-6 text-foreground">
      <pre className="m-0 whitespace-pre-wrap break-words">{logs.join("\n") || "No logs yet."}</pre>
    </div>
  );
}

function RenderError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  );
}

function RenderVideoLink({ videoHref }: { videoHref?: string }) {
  if (!videoHref) {
    return null;
  }

  return (
    <a
      aria-label="latest.mp4"
      className={buttonVariants({ variant: "secondary", size: "icon" })}
      href={videoHref}
      rel="noreferrer"
      target="_blank"
      title="latest.mp4"
    >
      <Download />
    </a>
  );
}

export function RenderDialog({
  executeLabel,
  isExecuteDisabled,
  onExecute,
  onOpenChange,
  open,
  renderError,
  renderState,
}: {
  executeLabel: string;
  isExecuteDisabled: boolean;
  onExecute: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  renderError: string | null;
  renderState: ReturnType<typeof useRenderState>["renderState"];
}) {
  const videoHref = renderState.videoPath
    ? `${renderState.videoPath}?t=${renderState.logs.length}`
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-10">
            <DialogTitle>Render</DialogTitle>
            <StatusChip status={renderState.status}>{renderState.status}</StatusChip>
          </div>
          <DialogDescription>保存済みの最新内容から動画を書き出す。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <RenderVideoLink videoHref={videoHref} />
          </div>
          <RenderLogs logs={renderState.logs} />
          <RenderError message={renderError ?? renderState.lastError} />
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>閉じる</DialogClose>
          <Button type="button" disabled={isExecuteDisabled} onClick={onExecute}>
            <Clapperboard />
            {executeLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
