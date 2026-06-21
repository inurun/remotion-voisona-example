"use client";

import type React from "react";
import { Clapperboard, Download } from "lucide-react";
import { Button, buttonVariants } from "@/_shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { cn } from "@/_shared/lib/utils";
import { type useEditorActions } from "@/app/features/editor/editor-actions";
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

function RenderStartButton({
  disabled,
  startRender,
}: {
  disabled: boolean;
  startRender: () => Promise<void>;
}) {
  return (
    <Button
      type="button"
      size="icon"
      disabled={disabled}
      onClick={() => void startRender()}
      title="Render"
      aria-label="Render"
    >
      <Clapperboard />
    </Button>
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

export function RenderCard({
  editorActions,
  renderState,
  startRender,
  voicesAvailable,
}: {
  editorActions: ReturnType<typeof useEditorActions>;
  renderState: ReturnType<typeof useRenderState>["renderState"];
  startRender: () => Promise<void>;
  voicesAvailable: boolean;
}) {
  const videoHref = renderState.videoPath
    ? `${renderState.videoPath}?t=${renderState.logs.length}`
    : undefined;
  const renderDisabled =
    !voicesAvailable || editorActions.saving || renderState.status === "running";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">Render</CardTitle>
          <StatusChip status={renderState.status}>{renderState.status}</StatusChip>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          <RenderStartButton disabled={renderDisabled} startRender={startRender} />
          <RenderVideoLink videoHref={videoHref} />
        </div>
        <RenderLogs logs={renderState.logs} />
        <RenderError message={renderState.lastError} />
      </CardContent>
    </Card>
  );
}
