import useSWR from "swr";
import { type VoiceOption } from "@/_schemas";
import { fetchJson } from "@/_shared/lib/fetch-json";

export type VoiceState =
  | { status: "loading"; options: VoiceOption[]; error: string | null }
  | { status: "ready"; options: VoiceOption[]; error: string | null }
  | { status: "error"; options: VoiceOption[]; error: string };

function toVoiceState(data: { options: VoiceOption[] } | undefined, error: unknown): VoiceState {
  if (error) {
    return {
      status: "error",
      options: [],
      error: error instanceof Error ? error.message : "Failed to load voices",
    };
  }

  if (!data) {
    return {
      status: "loading",
      options: [],
      error: null,
    };
  }

  return {
    status: "ready",
    options: data.options,
    error: null,
  };
}

export function useVoices() {
  const swr = useSWR<{ options: VoiceOption[] }>("/api/voisona/voices", fetchJson, {
    revalidateOnFocus: false,
  });
  const voices = toVoiceState(swr.data, swr.error);

  return {
    voices,
    voicesAvailable: voices.status === "ready" && voices.options.length > 0,
    loadVoices: async () => {
      await swr.mutate();
    },
  };
}
