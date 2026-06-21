"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { AppLoadingOverlay } from "@/app/components/app-loading-overlay";
import { AppContent } from "@/app/components/app-content";
import { useToastError } from "@/app/components/use-toast-error";
import { useEditorActions } from "@/app/features/editor/editor-actions";
import { useProject } from "@/app/features/project/project.swr";
import { useRenderState } from "@/app/features/render/render-state";
import { useVoices } from "@/app/features/voisona/voices";

function EmptyProjectCard({ message }: { message: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Project</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          {message}
        </div>
      </CardContent>
    </Card>
  );
}

function getProjectEmptyStateMessage(projectPath: string | null, projectError: string | null) {
  if (!projectPath) {
    return "Project を選択すると編集を開始できる。";
  }

  if (projectError) {
    return "Project not found";
  }

  return "Project を読み込めない。";
}

function getToastMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function SelectedProjectWorkspace({ projectPath }: { projectPath: string | null }) {
  const { project, projectError, isProjectLoading, mutateProject } = useProject(projectPath);
  const { voices, voicesAvailable, loadVoices } = useVoices();
  const editorActions = useEditorActions({
    projectPath,
    onError: (message) => {
      toast.error(message);
    },
    onSavedProjectChange: (savedProject) => {
      void mutateProject(savedProject);
    },
    onSuccess: (message) => {
      toast.success(message);
    },
  });
  const { renderState, startRender } = useRenderState({ projectPath });

  useToastError(projectPath ? projectError : null, "project-load-error");
  useToastError(voices.status === "error" ? voices.error : null, "voices-load-error");

  const handleStartRender = useCallback(async () => {
    try {
      await startRender();
      toast.success("Render を開始した。");
    } catch (error) {
      toast.error(getToastMessage(error, "Render failed"));
    }
  }, [startRender]);

  if (!project) {
    return (
      <>
        <EmptyProjectCard message={getProjectEmptyStateMessage(projectPath, projectError)} />
        <AppLoadingOverlay visible={isProjectLoading} />
      </>
    );
  }

  return (
    <>
      <AppContent
        project={project}
        voices={voices}
        voicesAvailable={voicesAvailable}
        loadVoices={loadVoices}
        editorActions={editorActions}
        renderState={renderState}
        startRender={handleStartRender}
      />
      <AppLoadingOverlay visible={isProjectLoading} />
    </>
  );
}
