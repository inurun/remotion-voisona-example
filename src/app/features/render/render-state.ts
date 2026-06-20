"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetchJson } from "@/_shared/lib/fetch-json";

type RenderState = {
  status: "idle" | "running" | "success" | "error";
  logs: string[];
  videoPath: string | null;
  updatedAt?: number;
  lastError: string | null;
};

async function postRenderStart() {
  const response = await fetch("/api/render", {
    method: "POST",
  });
  const data = (await response.json()) as { started?: boolean; error?: string };

  if (!response.ok || !data.started) {
    throw new Error(data.error ?? "Render start failed");
  }
}

export function useRenderState({
  onError,
  onMessage,
}: {
  onError: (message: string | null) => void;
  onMessage: (message: string | null) => void;
}) {
  const { data, mutate } = useSWR<RenderState>("/api/render", fetchJson, {
    revalidateOnFocus: false,
  });
  const [renderState, setRenderState] = useState<RenderState>({
    status: "idle",
    logs: [],
    videoPath: null,
    lastError: null,
  });

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

  async function startRender() {
    onError(null);
    onMessage(null);

    try {
      await postRenderStart();
      onMessage("Render を開始した。");
      void mutate();
    } catch (renderError) {
      onError(renderError instanceof Error ? renderError.message : "Render failed");
    }
  }

  return {
    renderState,
    startRender,
  };
}
