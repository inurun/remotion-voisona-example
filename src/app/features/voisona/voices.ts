"use client";

import useSWR from "swr";
import { type VoiceOption } from "@/_schemas";
import { fetchJson } from "@/_shared/lib/fetch-json";

export type VoiceState =
  | { status: "loading"; options: VoiceOption[]; error: string | null }
  | { status: "ready"; options: VoiceOption[]; error: string | null }
  | { status: "error"; options: VoiceOption[]; error: string };

export function useVoices() {
  const swr = useSWR<{ options: VoiceOption[] }>("/api/voisona/voices", fetchJson, {
    revalidateOnFocus: false,
  });

  const voices: VoiceState = swr.error
    ? {
        status: "error",
        options: [],
        error: swr.error instanceof Error ? swr.error.message : "Failed to load voices",
      }
    : swr.data
      ? {
          status: "ready",
          options: swr.data.options,
          error: null,
        }
      : {
          status: "loading",
          options: [],
          error: null,
        };

  return {
    voices,
    voicesAvailable: voices.status === "ready" && voices.options.length > 0,
    loadVoices: async () => {
      await swr.mutate();
    },
  };
}
