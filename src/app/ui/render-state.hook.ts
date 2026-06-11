"use client";

import { useEffect, useState } from "react";

export type RenderState = {
  status: "idle" | "running" | "success" | "error";
  logs: string[];
  videoPath: string | null;
  lastError: string | null;
};

export function useRenderState({
  onError,
  onMessage,
}: {
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
}) {
  const [renderState, setRenderState] = useState<RenderState>({
    status: "idle",
    logs: [],
    videoPath: null,
    lastError: null,
  });

  useEffect(() => {
    const eventSource = new EventSource("/api/render/stream");
    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data) as RenderState;
      setRenderState(payload);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  async function startRender() {
    onError(null);
    onMessage(null);

    try {
      const response = await fetch("/api/render", {
        method: "POST",
      });
      const data = (await response.json()) as { started?: boolean; error?: string };
      if (!response.ok || !data.started) {
        throw new Error(data.error ?? "Render start failed");
      }
      onMessage("Render を開始した。");
    } catch (renderError) {
      onError(renderError instanceof Error ? renderError.message : "Render failed");
    }
  }

  return {
    renderState,
    startRender,
  };
}
