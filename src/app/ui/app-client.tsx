"use client";

import { useState } from "react";
import { Clapperboard, Download } from "lucide-react";

import { useEditorActions } from "@/app/ui/editor-actions.hook";
import { EditorWorkspace } from "@/app/ui/editor-pane";
import { PlayerPane } from "@/app/ui/player-pane";
import { useRenderState } from "@/app/ui/render-state.hook";
import { useVoices } from "@/app/ui/voices.hook";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type SavedProject } from "@/lib/schema";
import { cn } from "@/lib/utils";

function getStatusChipClass(
  status:
    | ReturnType<typeof useRenderState>["renderState"]["status"]
    | ReturnType<typeof useVoices>["voices"]["status"],
) {
  if (status === "error") {
    return "border-destructive/20 bg-destructive/10 text-destructive";
  }

  if (status === "running" || status === "loading") {
    return "border-primary/20 bg-primary/10 text-primary";
  }

  if (status === "success" || status === "ready") {
    return "border-emerald-600/20 bg-emerald-600/10 text-emerald-700";
  }

  return "border-border bg-secondary text-secondary-foreground";
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

export function AppClient({ initialProject }: { initialProject: SavedProject }) {
  const [savedProject, setSavedProject] = useState(initialProject);
  const { voices, voicesAvailable, loadVoices } = useVoices();
  const editorActions = useEditorActions({
    onSavedProjectChange: setSavedProject,
  });
  const { renderState, startRender } = useRenderState({
    onError: editorActions.setError,
    onMessage: editorActions.setMessage,
  });

  const videoHref = renderState.videoPath
    ? `${renderState.videoPath}?t=${renderState.logs.length}`
    : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
          Remotion + VoiSona Template
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          ページごとの本文と TTS を編集して、音声 preview と render まで一通り試せるテンプレ。
        </p>
      </header>

      <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
        <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
          <PlayerPane project={savedProject} />

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-xl">Render</CardTitle>
                <StatusChip status={renderState.status}>{renderState.status}</StatusChip>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="icon"
                  disabled={
                    !voicesAvailable || editorActions.saving || renderState.status === "running"
                  }
                  onClick={() => {
                    void startRender();
                  }}
                  title="Render"
                  aria-label="Render"
                >
                  <Clapperboard />
                </Button>
                {videoHref ? (
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
                ) : null}
              </div>
              <div className="min-h-[220px] max-h-[320px] overflow-auto rounded-xl border border-border bg-muted/30 p-4 font-mono text-xs leading-6 text-foreground">
                <pre className="m-0 whitespace-pre-wrap break-words">
                  {renderState.logs.join("\n") || "No logs yet."}
                </pre>
              </div>
              {renderState.lastError ? (
                <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {renderState.lastError}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>

        <EditorWorkspace
          initialProject={savedProject}
          voices={voices}
          onLoadVoices={loadVoices}
          editorActions={editorActions}
        />
      </div>
    </main>
  );
}
