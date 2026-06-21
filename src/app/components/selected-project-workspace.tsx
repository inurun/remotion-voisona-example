"use client";

import { Clapperboard, Save } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/_shared/components/ui/button";
import type { DraftProject, SavedProject } from "@/_schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { AppContent } from "@/app/components/app-content";
import { RenderDialog } from "@/app/components/render-dialog";
import { useToastError } from "@/app/components/use-toast-error";
import { WorkspaceHeader } from "@/app/components/workspace-header";
import { useEditorActions } from "@/app/features/editor/editor-actions";
import { useEditorForm } from "@/app/features/editor/editor-form";
import { useEditorScreen } from "@/app/features/editor/editor-screen";
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

function getRenderExecuteLabel(saving: boolean, status: "idle" | "running" | "success" | "error") {
  if (saving) {
    return "Saving";
  }

  if (status === "running") {
    return "Rendering";
  }

  return "実行";
}

function ProjectWorkspace({
  editorActions,
  loadVoices,
  project,
  renderState,
  startRender,
  voices,
}: {
  editorActions: ReturnType<typeof useEditorActions>;
  loadVoices: () => Promise<void>;
  project: SavedProject;
  renderState: ReturnType<typeof useRenderState>["renderState"];
  startRender: ReturnType<typeof useRenderState>["startRender"];
  voices: ReturnType<typeof useVoices>["voices"];
}) {
  const [isRenderDialogOpen, setIsRenderDialogOpen] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const { form, pageFields, appendPage, createDraftTts, movePage, removePage } = useEditorForm({
    initialProject: project,
    voiceOptions: voices.options,
  });

  const saveCurrentProject = useCallback(
    async (draftProject: DraftProject) => {
      return await toast.promise(editorActions.saveProject(draftProject), {
        loading: "保存中...",
        success: "保存して音声を更新した。",
        error: (error) => getToastMessage(error, "Save failed"),
      });
    },
    [editorActions],
  );

  const editorContextValue = useEditorScreen({
    appendPage,
    createDraftTts,
    editorActions,
    form,
    movePage,
    onLoadVoices: loadVoices,
    pageFields,
    removePage,
    saveProject: saveCurrentProject,
    voices,
  });

  const canSave = editorContextValue.canRunTts && editorContextValue.pageFields.length > 0;
  const isRenderExecuteDisabled = !canSave || renderState.status === "running";
  const renderExecuteLabel = getRenderExecuteLabel(editorActions.saving, renderState.status);

  const handleSave = useCallback(() => {
    void form.handleSubmit(async (draftProject) => {
      await saveCurrentProject(draftProject);
    })();
  }, [form, saveCurrentProject]);

  const handleRenderExecute = useCallback(() => {
    setRenderError(null);

    void form.handleSubmit(async (draftProject) => {
      try {
        await saveCurrentProject(draftProject);
      } catch (error) {
        setRenderError(getToastMessage(error, "Save failed"));
        return;
      }

      try {
        await startRender();
        toast.success("Render を開始した。");
      } catch (error) {
        const message = getToastMessage(error, "Render failed");
        setRenderError(message);
        toast.error(message);
      }
    })();
  }, [form, saveCurrentProject, startRender]);

  return (
    <>
      <WorkspaceHeader
        actions={
          <>
            <Button
              type="button"
              size="icon"
              title="Render"
              aria-label="Render"
              onClick={() => setIsRenderDialogOpen(true)}
            >
              <Clapperboard />
            </Button>
            <Button
              type="button"
              size="icon"
              title={editorActions.saving ? "Saving" : "Save"}
              aria-label={editorActions.saving ? "Saving" : "Save"}
              disabled={!canSave}
              onClick={handleSave}
            >
              <Save className={editorActions.saving ? "animate-pulse" : undefined} />
            </Button>
          </>
        }
      />
      <AppContent editorContextValue={editorContextValue} form={form} project={project} />
      <RenderDialog
        executeLabel={renderExecuteLabel}
        isExecuteDisabled={isRenderExecuteDisabled}
        onExecute={handleRenderExecute}
        onOpenChange={setIsRenderDialogOpen}
        open={isRenderDialogOpen}
        renderError={renderError}
        renderState={renderState}
      />
    </>
  );
}

export function SelectedProjectWorkspace({ projectPath }: { projectPath: string | null }) {
  const { project, projectError, mutateProject } = useProject(projectPath);
  const { voices, loadVoices } = useVoices();
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

  if (!project) {
    return (
      <>
        <WorkspaceHeader />
        <EmptyProjectCard message={getProjectEmptyStateMessage(projectPath, projectError)} />
      </>
    );
  }

  return (
    <>
      <ProjectWorkspace
        editorActions={editorActions}
        loadVoices={loadVoices}
        project={project}
        renderState={renderState}
        startRender={startRender}
        voices={voices}
      />
    </>
  );
}
