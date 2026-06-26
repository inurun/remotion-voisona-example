import { useCallback, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import type { DraftProject } from "@/_schemas";
import { saveProject } from "@/app/features/project/api/project-api";
import { useEditor } from "@/app/features/editor";
import { usePage } from "@/app/features/page";
import { useProject } from "@/app/features/project";
import { startRender, type RenderState } from "@/app/features/render/api/render-api";
import { useRenderStateQuery } from "@/app/features/render/swr/use-render-query";
import { useVoices } from "@/app/features/voices";

export type { RenderState };

function getRenderExecuteLabel(saving: boolean, status: RenderState["status"]) {
  if (saving) {
    return "Saving";
  }

  if (status === "running") {
    return "Rendering";
  }

  return "実行";
}

export type RenderContextValue = {
  renderState: RenderState;
  renderDialogOpen: boolean;
  renderError: string | null;
  renderExecuteDisabled: boolean;
  renderExecuteLabel: string;
  openRenderDialog: () => void;
  setRenderDialogOpen: (open: boolean) => void;
  handleRenderExecute: () => void;
};

export function useRenderProviderValue(): RenderContextValue {
  const { handleSubmit } = useFormContext<DraftProject>();
  const { isPending: saving } = useEditor();
  const { options } = useVoices();
  const { pageFields } = usePage();
  const { projectPath } = useProject();
  const { renderState, reloadRenderState } = useRenderStateQuery();
  const [renderDialogOpen, setRenderDialogOpen] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  const startRenderJob = useCallback(async () => {
    if (!projectPath) {
      throw new Error("Project path is required");
    }

    await startRender(projectPath);
    void reloadRenderState();
  }, [projectPath, reloadRenderState]);

  const canSave = options.length > 0 && !saving && pageFields.length > 0;
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

        await toast.promise(saveProject(projectPath, draftProject), {
          loading: "保存中...",
          success: "保存して音声を更新した。",
          error: "Save failed",
        });
      } catch (error) {
        setRenderError(JSON.stringify(error));
        return;
      }

      try {
        await startRenderJob();
        toast.success("Render を開始した。");
      } catch (error) {
        setRenderError(JSON.stringify(error));
      }
    })();
  }, [handleSubmit, projectPath, startRenderJob]);

  return {
    renderState,
    renderDialogOpen,
    renderError,
    renderExecuteDisabled,
    renderExecuteLabel,
    openRenderDialog,
    setRenderDialogOpen,
    handleRenderExecute,
  };
}
