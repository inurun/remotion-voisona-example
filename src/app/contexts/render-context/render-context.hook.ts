import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import useSWR from "swr";
import { toast } from "sonner";
import type { DraftProject } from "@/_schemas";
import { fetchJson } from "@/_shared/lib/fetch-json";
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { useProject } from "@/app/contexts/project-context/project-context";
import { requestSaveProject } from "@/app/features/editor/editor-api";

export type RenderState = {
  status: "idle" | "running" | "success" | "error";
  logs: string[];
  videoPath: string | null;
  updatedAt?: number;
  lastError: string | null;
};

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

async function postRenderStart(projectPath: string) {
  const response = await fetch("/api/render", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ projectPath }),
  });
  const data = (await response.json()) as { started?: boolean; error?: string };

  if (!response.ok || !data.started) {
    throw new Error(data.error ?? "Render start failed");
  }
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
  const { canRunTts, pageFields, saving } = useEditor();
  const { projectPath } = useProject();
  const { data, mutate } = useSWR<RenderState>("/api/render", fetchJson, {
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
    const eventSource = new EventSource("/api/render/stream");
    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data) as RenderState;
      setRenderState(payload);
      void mutate(payload, { revalidate: false });
    };

    return () => {
      eventSource.close();
    };
  }, [mutate]);

  const startRender = useCallback(async () => {
    if (!projectPath) {
      throw new Error("Project path is required");
    }

    await postRenderStart(projectPath);
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
        await startRender();
        toast.success("Render を開始した。");
      } catch (error) {
        setRenderError(JSON.stringify(error));
      }
    })();
  }, [handleSubmit, projectPath, startRender]);

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
