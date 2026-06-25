import type { DraftTts } from "@/_schemas";
import { api } from "@/_shared/lib/api-client";
import { parseApiJson } from "@/_shared/lib/fetch-json";
import { getPreviewPayload } from "@/app/features/tts/lib/tts-preview-payload";

async function analyzeText(payload: { text: string; language?: string }) {
  return parseApiJson<{ analyzedText: string }>(
    await api.voisona["text-analysis"].$post({
      json: {
        language: "ja_JP",
        ...payload,
      },
    }),
  );
}

async function synthesize(payload: {
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

export async function requestTextAnalysis(item: DraftTts) {
  const data = await analyzeText({
    text: item.readText?.trim() || item.text,
  });

  if (!data.analyzedText) {
    throw new Error("Analyze failed");
  }

  return data.analyzedText;
}

export async function requestPreviewSynthesis(item: DraftTts) {
  const data = await synthesize(getPreviewPayload(item));

  if (!data.audioSrc) {
    throw new Error("Preview failed");
  }

  return data.audioSrc;
}
