import type { VoiceOption } from "@/_schemas";
import { api } from "./client";
import { parseApiJson } from "@/_shared/lib/fetch-json";

export const voisonaKeys = {
  voices: () => ["voisona", "voices"] as const,
};

export async function fetchVoices() {
  return parseApiJson<{ options: VoiceOption[] }>(await api.voisona.voices.$get());
}

export async function analyzeText(payload: { text: string; language?: string }) {
  return parseApiJson<{ analyzedText: string }>(
    await api.voisona["text-analysis"].$post({
      json: {
        language: "ja_JP",
        ...payload,
      },
    }),
  );
}

export async function synthesize(payload: {
  analyzedText?: string;
  text: string;
  voiceName: string;
  voiceVersion?: string;
}) {
  return parseApiJson<{ audioSrc: string }>(
    await api.voisona.synthesize.$post({
      json: payload,
    }),
  );
}
