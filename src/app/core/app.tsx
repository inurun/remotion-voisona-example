"use client";

import type React from "react";
import { Clapperboard, Download } from "lucide-react";
import { Button, buttonVariants } from "@/_shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { cn } from "@/_shared/lib/utils";
import Editor from "@/app/components/editor/editor";
import { PlayerPane } from "@/app/components/player/player";
import { useEditorActions } from "@/app/features/editor/editor-actions";
import { useProject } from "@/app/features/project/project.swr";
import { useRenderState } from "@/app/features/render/render-state";
import { useVoices } from "@/app/features/voisona/voices";

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

function LoadingShell() {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
      <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
        <LoadingCard className="h-[260px]" />
        <RenderLoadingCard />
      </aside>
      <LoadingCard className="min-h-[640px]" />
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive/20">
      <CardContent className="flex flex-col gap-4 py-6">
        <div className="text-sm text-destructive">{message}</div>
        <div>
          <Button onClick={onRetry} type="button" variant="secondary">
            Retry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="grid gap-2">
        <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
          Remotion + VoiSona Template
        </h1>
      </header>
      {children}
    </main>
  );
}

function LoadingCard({ className }: { className: string }) {
  return (
    <Card>
      <CardContent className={cn(className, "animate-pulse rounded-xl bg-muted/40")} />
    </Card>
  );
}

function RenderLoadingCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Render</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="h-10 w-10 animate-pulse rounded-xl bg-muted/40" />
        <div className="min-h-[220px] animate-pulse rounded-xl bg-muted/40" />
      </CardContent>
    </Card>
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
  startRender: ReturnType<typeof useRenderState>["startRender"];
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

function RenderCard({
  editorActions,
  renderState,
  startRender,
  voicesAvailable,
}: {
  editorActions: ReturnType<typeof useEditorActions>;
  renderState: ReturnType<typeof useRenderState>["renderState"];
  startRender: ReturnType<typeof useRenderState>["startRender"];
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

function AppContent({
  project,
  voices,
  voicesAvailable,
  loadVoices,
  editorActions,
  renderState,
  startRender,
}: {
  project: NonNullable<ReturnType<typeof useProject>["project"]>;
  voices: ReturnType<typeof useVoices>["voices"];
  voicesAvailable: boolean;
  loadVoices: ReturnType<typeof useVoices>["loadVoices"];
  editorActions: ReturnType<typeof useEditorActions>;
  renderState: ReturnType<typeof useRenderState>["renderState"];
  startRender: ReturnType<typeof useRenderState>["startRender"];
}) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
      <aside className="flex flex-col gap-4 xl:sticky xl:top-6">
        <PlayerPane project={project} />
        <RenderCard
          editorActions={editorActions}
          renderState={renderState}
          startRender={startRender}
          voicesAvailable={voicesAvailable}
        />
      </aside>

      <Editor
        initialProject={project}
        voices={voices}
        onLoadVoices={loadVoices}
        editorActions={editorActions}
      />
    </div>
  );
}

export default function App() {
  const { project, projectError, isProjectLoading, mutateProject, reloadProject } = useProject();
  const { voices, voicesAvailable, loadVoices } = useVoices();
  const editorActions = useEditorActions({
    onSavedProjectChange: (savedProject) => {
      void mutateProject(savedProject);
    },
  });
  const { renderState, startRender } = useRenderState({
    onError: editorActions.setError,
    onMessage: editorActions.setMessage,
  });

  if (projectError) {
    return (
      <AppLayout>
        <ErrorCard
          message={projectError}
          onRetry={() => {
            void reloadProject();
          }}
        />
      </AppLayout>
    );
  }

  if (isProjectLoading || !project) {
    return (
      <AppLayout>
        <LoadingShell />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AppContent
        project={project}
        voices={voices}
        voicesAvailable={voicesAvailable}
        loadVoices={loadVoices}
        editorActions={editorActions}
        renderState={renderState}
        startRender={startRender}
      />
    </AppLayout>
  );
}
