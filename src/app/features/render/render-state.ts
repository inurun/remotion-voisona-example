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

export function useRenderState({ projectPath }: { projectPath: string | null }) {
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
    if (!projectPath) {
      throw new Error("Project path is required");
    }

    await postRenderStart(projectPath);
    void mutate();
  }

  return {
    renderState,
    startRender,
  };
}
