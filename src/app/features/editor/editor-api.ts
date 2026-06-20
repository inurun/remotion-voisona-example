"use client";

import { type DraftProject, type DraftTts, type SavedProject } from "@/_schemas";

type ApiErrorResponse = {
  error?: string;
};

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function toHttpError(response: Response, payload: ApiErrorResponse, fallback: string) {
  return new Error(payload.error ?? `HTTP ${response.status}` ?? fallback);
}

function getPreviewPayload(item: DraftTts) {
  const analyzedText = item.speech?.analyzedText?.trim();
  const voiceVersion = item.voiceVersion?.trim();

  return {
    text: item.readText?.trim() || item.text,
    ...(analyzedText ? { analyzedText } : {}),
    voiceName: item.voiceName,
    ...(voiceVersion ? { voiceVersion } : {}),
  };
}

export async function requestTextAnalysis(item: DraftTts) {
  const response = await fetch("/api/voisona/text-analysis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: item.readText?.trim() || item.text,
      language: "ja_JP",
    }),
  });
  const data = await readJson<{ analyzedText?: string; error?: string }>(response);

  if (!response.ok || !data.analyzedText) {
    throw toHttpError(response, data, "Analyze failed");
  }

  return data.analyzedText;
}

export async function requestPreviewSynthesis(item: DraftTts) {
  const response = await fetch("/api/voisona/synthesize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(getPreviewPayload(item)),
  });
  const data = await readJson<{ audioSrc?: string; error?: string }>(response);

  if (!response.ok || !data.audioSrc) {
    throw toHttpError(response, data, "Preview failed");
  }

  return data.audioSrc;
}

export async function requestSaveProject(project: DraftProject) {
  const response = await fetch("/api/project", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(project),
  });
  const data = await readJson<SavedProject | { error: string }>(response);

  if (!response.ok || !("pages" in data)) {
    throw toHttpError(response, data, "Save failed");
  }

  return data;
}
