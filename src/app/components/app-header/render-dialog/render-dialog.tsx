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
import { useRender } from "@/app/features/render";
import type { RenderState } from "@/app/features/render";

function getStatusChipClass(status: RenderState["status"]) {
  return {
    error: "border-destructive/20 bg-destructive/10 text-destructive",
    idle: "border-border bg-secondary text-secondary-foreground",
    loading: "border-primary/20 bg-primary/10 text-primary",
    ready: "border-emerald-600/20 bg-emerald-600/10 text-emerald-700",
    running: "border-primary/20 bg-primary/10 text-primary",
    success: "border-emerald-600/20 bg-emerald-600/10 text-emerald-700",
  }[status];
}

function getVideoHref(renderState: RenderState) {
  if (!renderState.videoPath) {
    return undefined;
  }

  return `${renderState.videoPath}?t=${renderState.logs.length}`;
}

function RenderVideoLink({ videoHref }: { videoHref?: string }) {
  if (!videoHref) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
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
    </div>
  );
}

export function RenderDialog() {
  const {
    handleRenderExecute,
    renderDialogOpen,
    renderError,
    renderExecuteDisabled,
    renderExecuteLabel,
    renderState,
    setRenderDialogOpen,
  } = useRender();
  const videoHref = getVideoHref(renderState);
  const errorMessage = renderError ?? renderState.lastError;

  return (
    <Dialog open={renderDialogOpen} onOpenChange={setRenderDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between gap-3 pr-10">
            <DialogTitle>Render</DialogTitle>
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                getStatusChipClass(renderState.status),
              )}
            >
              {renderState.status}
            </span>
          </div>
          <DialogDescription>保存済みの最新内容から動画を書き出す。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <RenderVideoLink videoHref={videoHref} />
          <div className="min-h-[220px] max-h-[320px] overflow-auto rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs leading-6 text-foreground">
            <pre className="m-0 whitespace-pre-wrap wrap-break-word">
              {renderState.logs.join("\n") || "No logs yet."}
            </pre>
          </div>
          {errorMessage && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>閉じる</DialogClose>
          <Button type="button" disabled={renderExecuteDisabled} onClick={handleRenderExecute}>
            <Clapperboard />
            {renderExecuteLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
