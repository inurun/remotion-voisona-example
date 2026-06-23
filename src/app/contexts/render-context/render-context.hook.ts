import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import useSWR from "swr";
import { toast } from "sonner";
import type { DraftProject } from "@/_schemas";
import {
  fetchRenderState,
  RENDER_STREAM_URL,
  renderKeys,
  startRender,
  type RenderState,
} from "@/app/core/api/render";
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";
import { useProject } from "@/app/contexts/project-context/project-context";
import { requestSaveProject } from "@/app/features/editor/editor-api";

export type { RenderState };

const initialRenderState: RenderState = {
  status: "idle",
  logs: [],
  videoPath: null,
  lastError: null,
};

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
  const { canRunTts } = useTts();
  const { pageFields } = usePage();
  const { projectPath } = useProject();
  const { data, mutate } = useSWR(renderKeys.snapshot(), fetchRenderState, {
    revalidateOnFocus: false,
  });
  const [renderState, setRenderState] = useState<RenderState>(initialRenderState);
  const [renderDialogOpen, setRenderDialogOpen] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setRenderState(data);
    }
  }, [data]);

  useEffect(() => {
    const eventSource = new EventSource(RENDER_STREAM_URL);
    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data) as RenderState;
      setRenderState(payload);
      void mutate(payload, { revalidate: false });
    };

    return () => {
      eventSource.close();
    };
  }, [mutate]);

  const startRenderJob = useCallback(async () => {
    if (!projectPath) {
      throw new Error("Project path is required");
    }

    await startRender(projectPath);
    void mutate();
  }, [mutate, projectPath]);

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
