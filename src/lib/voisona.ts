import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import { getWavDurationSeconds } from "@/lib/wav";
import { TTS_DIR } from "@/lib/storage";
import { applyVoisonaTextTransforms } from "@/lib/text";
import { voiceOptionSchema, type VoiceOption } from "@/lib/schema";

const inFlightSyntheses = new Map<
  string,
  Promise<{ audioSrc: string; outputPath: string; durationSec: number }>
>();

function normalizeEnvValue(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }

  return trimmed;
}

export const VOISONA_BASE =
  normalizeEnvValue(process.env["VOISONA_BASE"]) ??
  "http://localhost:32766/api/talk/v1";

const configuredVoicesPath = normalizeEnvValue(process.env["VOISONA_VOICES_PATH"]);

function getCredentials() {
  const username = normalizeEnvValue(process.env["VOISONA_USERNAME"]);
  const password = normalizeEnvValue(process.env["VOISONA_PASSWORD"]);

  if (!username || !password) {
    throw new Error(
      "VOISONA_USERNAME and VOISONA_PASSWORD must be set in .env.local.",
    );
  }

  return { username, password };
}

function getHeaders() {
  const { username, password } = getCredentials();
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
  };
}

async function waitForVoisonaRequest<T extends { state: string }>(
  endpoint: "speech-syntheses" | "text-analyses",
  uuid: string,
) {
  let attempts = 120;

  while (attempts-- > 0) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const response = await fetch(`${VOISONA_BASE}/${endpoint}/${uuid}`, {
      headers: getHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      continue;
    }

    const result = (await response.json()) as T;
    if (result.state === "succeeded") {
      return result;
    }

    if (result.state === "failed") {
      throw new Error(`VoiSona ${endpoint} failed: ${JSON.stringify(result)}`);
    }
  }

  throw new Error(`VoiSona ${endpoint} timed out`);
}

const analyzeSchema = z.object({
  text: z.string().min(1),
  language: z.string().default("ja_JP"),
});

export async function analyzeVoisonaText(input: { text: string; language?: string }) {
  const { text, language } = analyzeSchema.parse(input);
  const response = await fetch(`${VOISONA_BASE}/text-analyses`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      language,
      text: applyVoisonaTextTransforms(text),
      force_enqueue: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`VoiSona text analysis request failed: ${await response.text()}`);
  }

  const { uuid } = (await response.json()) as { uuid: string };
  const result = await waitForVoisonaRequest<{
    state: string;
    analyzed_text?: string;
  }>("text-analyses", uuid);

  if (!result.analyzed_text) {
    throw new Error("VoiSona text analysis succeeded without analyzed_text");
  }

  return {
    analyzedText: result.analyzed_text,
  };
}

const synthesizeSchema = z.object({
  text: z.string().min(1),
  analyzedText: z.string().optional(),
  voiceName: z.string().min(1),
  voiceVersion: z.string().optional(),
});

export async function synthesizeVoisona(input: {
  text: string;
  analyzedText?: string;
  voiceName: string;
  voiceVersion?: string;
}) {
  const parsed = synthesizeSchema.parse(input);
  const transformedText = applyVoisonaTextTransforms(parsed.text);
  const cacheKey = crypto
    .createHash("md5")
    .update(
      JSON.stringify({
        text: transformedText,
        analyzedText: parsed.analyzedText,
        voiceName: parsed.voiceName,
        voiceVersion: parsed.voiceVersion,
      }),
    )
    .digest("hex");
  const outputPath = path.join(TTS_DIR, `${cacheKey}.wav`);
  const audioSrc = `/tts/${cacheKey}.wav`;

  const existing = inFlightSyntheses.get(outputPath);
  if (existing) {
    return existing;
  }

  const task = (async () => {
    await fs.mkdir(TTS_DIR, { recursive: true });

    try {
      await fs.access(outputPath);
      return {
        outputPath,
        audioSrc,
        durationSec: await getWavDurationSeconds(outputPath),
      };
    } catch {
      // Cache miss.
    }

    const response = await fetch(`${VOISONA_BASE}/speech-syntheses`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        language: "ja_JP",
        ...(parsed.analyzedText
          ? { analyzed_text: parsed.analyzedText }
          : { text: transformedText }),
        destination: "file",
        can_overwrite_file: true,
        output_file_path: outputPath,
        voice_name: parsed.voiceName,
        ...(parsed.voiceVersion ? { voice_version: parsed.voiceVersion } : {}),
        force_enqueue: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`VoiSona synthesis request failed: ${await response.text()}`);
    }

    const { uuid } = (await response.json()) as { uuid: string };
    await waitForVoisonaRequest("speech-syntheses", uuid);

    return {
      outputPath,
      audioSrc,
      durationSec: await getWavDurationSeconds(outputPath),
    };
  })();

  inFlightSyntheses.set(outputPath, task);

  try {
    return await task;
  } finally {
    if (inFlightSyntheses.get(outputPath) === task) {
      inFlightSyntheses.delete(outputPath);
    }
  }
}

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

function toDisplayName(voiceName: string, voiceVersion?: string) {
  const base = voiceName.replace(/_ja_JP$/u, "").replaceAll("-", " ");
  return voiceVersion ? `${base} v${voiceVersion}` : base;
}

function collectVoiceOptions(value: JsonValue, output: VoiceOption[]) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectVoiceOptions(entry, output);
    }
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, JsonValue>;
  const voiceName =
    typeof record["voice_name"] === "string"
      ? record["voice_name"]
      : typeof record["voiceName"] === "string"
        ? record["voiceName"]
        : undefined;
  const voiceVersion =
    typeof record["voice_version"] === "string"
      ? record["voice_version"]
      : typeof record["voiceVersion"] === "string"
        ? record["voiceVersion"]
        : undefined;
  const displayName =
    typeof record["display_name"] === "string"
      ? record["display_name"]
      : typeof record["displayName"] === "string"
        ? record["displayName"]
        : undefined;

  if (voiceName) {
    output.push(
      voiceOptionSchema.parse({
        voiceName,
        ...(voiceVersion ? { voiceVersion } : {}),
        displayName: displayName ?? toDisplayName(voiceName, voiceVersion),
      }),
    );
  }

  for (const nested of Object.values(record)) {
    collectVoiceOptions(nested, output);
  }
}

export async function listVoisonaVoices() {
  const candidatePaths = configuredVoicesPath
    ? [configuredVoicesPath]
    : ["/voice-libraries", "/voices", "/voice-library-versions"];

  const errors: string[] = [];

  for (const candidatePath of candidatePaths) {
    try {
      const response = await fetch(`${VOISONA_BASE}${candidatePath}`, {
        headers: getHeaders(),
        cache: "no-store",
      });

      if (!response.ok) {
        errors.push(`${candidatePath}: http_${response.status}`);
        continue;
      }

      const json = (await response.json()) as JsonValue;
      const options: VoiceOption[] = [];
      collectVoiceOptions(json, options);

      const deduped = Array.from(
        new Map(
          options.map((option) => [
            `${option.voiceName}:${option.voiceVersion ?? ""}`,
            option,
          ]),
        ).values(),
      ).sort((a, b) => a.displayName.localeCompare(b.displayName));

      if (deduped.length > 0) {
        return deduped;
      }

      errors.push(`${candidatePath}: empty_response`);
    } catch (error) {
      errors.push(
        `${candidatePath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  throw new Error(`Unable to fetch VoiSona voices (${errors.join(", ")})`);
}
