import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { applyVoisonaTextTransforms } from "@/_shared/lib/text";
import { getWavDurationSeconds } from "@/_shared/lib/wav";
import type { ServerEnv } from "@/server/core/env";
import { TTS_DIR } from "@/server/_shared/storage";
import {
  getConfiguredVoicesPath,
  getVoisonaBase,
  getVoisonaHeaders,
  waitForVoisonaRequest,
} from "./client";
import {
  synthesizeRequestSchema,
  type SynthesizeRequest,
  type SynthesizeResponse,
  textAnalysisRequestSchema,
} from "./contract";
import { collectVoiceOptions, dedupeVoiceOptions } from "./voice-options";

const inFlightSyntheses = new Map<string, Promise<SynthesizeResponse>>();

export async function analyzeVoisonaText(
  serverEnv: ServerEnv,
  input: { text: string; language?: string },
) {
  const { text, language } = textAnalysisRequestSchema.parse(input);
  const response = await fetch(`${getVoisonaBase(serverEnv)}/text-analyses`, {
    method: "POST",
    headers: getVoisonaHeaders(serverEnv),
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
  }>(serverEnv, "text-analyses", uuid);

  if (!result.analyzed_text) {
    throw new Error("VoiSona text analysis succeeded without analyzed_text");
  }

  return {
    analyzedText: result.analyzed_text,
  };
}

export async function synthesizeVoisona(input: {
  serverEnv: ServerEnv;
  text: string;
  analyzedText?: string;
  voiceName: string;
  voiceVersion?: string;
}) {
  const { serverEnv, ...payload } = input;
  const parsed = synthesizeRequestSchema.parse(payload);
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

  const task = createSynthesisTask({
    audioSrc,
    outputPath,
    parsed,
    serverEnv,
    transformedText,
  });

  inFlightSyntheses.set(outputPath, task);

  try {
    return await task;
  } finally {
    if (inFlightSyntheses.get(outputPath) === task) {
      inFlightSyntheses.delete(outputPath);
    }
  }
}

async function getCachedSynthesisResult(outputPath: string, audioSrc: string) {
  try {
    await fs.access(outputPath);
    return {
      outputPath,
      audioSrc,
      durationSec: await getWavDurationSeconds(outputPath),
    } satisfies SynthesizeResponse;
  } catch {
    return null;
  }
}

function getSpeechSynthesisBody(
  parsed: SynthesizeRequest,
  transformedText: string,
  outputPath: string,
) {
  return {
    language: "ja_JP",
    ...(parsed.analyzedText ? { analyzed_text: parsed.analyzedText } : { text: transformedText }),
    destination: "file",
    can_overwrite_file: true,
    output_file_path: outputPath,
    voice_name: parsed.voiceName,
    ...(parsed.voiceVersion ? { voice_version: parsed.voiceVersion } : {}),
    force_enqueue: true,
  };
}

async function requestSpeechSynthesis(
  serverEnv: ServerEnv,
  parsed: SynthesizeRequest,
  transformedText: string,
  outputPath: string,
) {
  const response = await fetch(`${getVoisonaBase(serverEnv)}/speech-syntheses`, {
    method: "POST",
    headers: getVoisonaHeaders(serverEnv),
    body: JSON.stringify(getSpeechSynthesisBody(parsed, transformedText, outputPath)),
  });

  if (!response.ok) {
    throw new Error(`VoiSona synthesis request failed: ${await response.text()}`);
  }

  return (await response.json()) as { uuid: string };
}

function createSynthesisTask({
  audioSrc,
  outputPath,
  parsed,
  serverEnv,
  transformedText,
}: {
  audioSrc: string;
  outputPath: string;
  parsed: SynthesizeRequest;
  serverEnv: ServerEnv;
  transformedText: string;
}) {
  return (async () => {
    await fs.mkdir(TTS_DIR, { recursive: true });

    const cached = await getCachedSynthesisResult(outputPath, audioSrc);
    if (cached) {
      return cached;
    }

    const { uuid } = await requestSpeechSynthesis(serverEnv, parsed, transformedText, outputPath);
    await waitForVoisonaRequest(serverEnv, "speech-syntheses", uuid);

    return {
      outputPath,
      audioSrc,
      durationSec: await getWavDurationSeconds(outputPath),
    } satisfies SynthesizeResponse;
  })();
}

function getVoicesFetchError(candidatePath: string, error: unknown) {
  return `${candidatePath}: ${error instanceof Error ? error.message : String(error)}`;
}

function getEmptyVoicesResult(candidatePath: string) {
  return { error: `${candidatePath}: empty_response` };
}

function getFailedVoicesResult(candidatePath: string, status: number) {
  return { error: `${candidatePath}: http_${status}` };
}

function collectVoicesResult(
  candidatePath: string,
  json: Parameters<typeof collectVoiceOptions>[0],
) {
  const options: Parameters<typeof dedupeVoiceOptions>[0] = [];
  collectVoiceOptions(json, options);
  const deduped = dedupeVoiceOptions(options);

  return deduped.length > 0 ? { options: deduped } : getEmptyVoicesResult(candidatePath);
}

async function fetchVoicesFromCandidate(serverEnv: ServerEnv, candidatePath: string) {
  try {
    const response = await fetch(`${getVoisonaBase(serverEnv)}${candidatePath}`, {
      headers: getVoisonaHeaders(serverEnv),
      cache: "no-store",
    });

    if (!response.ok) {
      return getFailedVoicesResult(candidatePath, response.status);
    }

    const json = (await response.json()) as Parameters<typeof collectVoiceOptions>[0];
    return collectVoicesResult(candidatePath, json);
  } catch (error) {
    return { error: getVoicesFetchError(candidatePath, error) };
  }
}

export async function listVoisonaVoices(serverEnv: ServerEnv) {
  const configuredVoicesPath = getConfiguredVoicesPath(serverEnv);
  const candidatePaths = configuredVoicesPath
    ? [configuredVoicesPath]
    : ["/voice-libraries", "/voices", "/voice-library-versions"];

  const errors: string[] = [];

  for (const candidatePath of candidatePaths) {
    const result = await fetchVoicesFromCandidate(serverEnv, candidatePath);
    if ("options" in result) {
      return result.options;
    }

    errors.push(result.error);
  }

  throw new Error(`Unable to fetch VoiSona voices (${errors.join(", ")})`);
}
