"use client";

import { useEffect, useState } from "react";

import { type VoiceOption } from "@/lib/schema";

export type VoiceState =
  | { status: "loading"; options: VoiceOption[]; error: string | null }
  | { status: "ready"; options: VoiceOption[]; error: string | null }
  | { status: "error"; options: VoiceOption[]; error: string };

export function useVoices() {
  const [voices, setVoices] = useState<VoiceState>({
    status: "loading",
    options: [],
    error: null,
  });

  useEffect(() => {
    void loadVoices();
  }, []);

  async function loadVoices() {
    setVoices({
      status: "loading",
      options: [],
      error: null,
    });

    try {
      const response = await fetch("/api/voices", { cache: "no-store" });
      const data = (await response.json()) as { options: VoiceOption[] } | { error: string };

      if (!response.ok || !("options" in data)) {
        throw new Error("error" in data ? data.error : `HTTP ${response.status}`);
      }

      setVoices({
        status: "ready",
        options: data.options,
        error: null,
      });
    } catch (loadError) {
      setVoices({
        status: "error",
        options: [],
        error: loadError instanceof Error ? loadError.message : "Failed to load voices",
      });
    }
  }

  return {
    voices,
    voicesAvailable: voices.status === "ready" && voices.options.length > 0,
    loadVoices,
  };
}
