import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import type { DraftProject } from "@/_schemas";
import { requestSaveProject } from "@/app/features/editor/editor-api";
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { getProjectPathFromLocation } from "@/app/features/project/project-path";
import { useRenderState } from "@/app/features/render/render-state";

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

export function useAppHeader() {
  const { handleSubmit } = useFormContext<DraftProject>();
  const { canRunTts, onSave, pageFields, saving } = useEditor();
  const projectPath = getProjectPathFromLocation(window.location.pathname);
  const { renderState, startRender } = useRenderState({ projectPath });
  const [renderDialogOpen, setRenderDialogOpen] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const canSave = canRunTts && pageFields.length > 0;
  const renderExecuteDisabled = !canSave || renderState.status === "running";
  const renderExecuteLabel = getRenderExecuteLabel(saving, renderState.status);

  const openRenderDialog = useCallback(() => {
    setRenderDialogOpen(true);
  }, []);

  const handleRenderExecute = useCallback(() => {
    setRenderError(null);
    void handleSubmit(async (draftProject) => {
      try {
        if (!projectPath) {
          throw new Error("Project path is required");
        }

        await toast.promise(requestSaveProject(projectPath, draftProject), {
          loading: "保存中...",
          success: "保存して音声を更新した。",
          error: (error) => getToastMessage(error, "Save failed"),
        });
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
  }, [handleSubmit, projectPath, startRender]);

  return {
    canSave,
    onSave,
    openRenderDialog,
    renderDialogOpen,
    renderError,
    renderExecuteDisabled,
    renderExecuteLabel,
    renderState,
    saving,
    setRenderDialogOpen,
    handleRenderExecute,
  };
}
