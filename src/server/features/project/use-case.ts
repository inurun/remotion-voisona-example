import {
  type ProjectFileSummary,
  type DraftProject,
  type DraftTts,
  savedProjectSchema,
  type SavedProject,
} from "@/_schemas";
import { sumBy } from "remeda";
import {
  listSavedProjects,
  parseDraftPayload,
  readSavedProject,
  createSavedProject,
  writeSavedProject,
} from "@/server/_shared/storage";
import type { ServerEnv } from "@/server/core/env";
import { getVoisonaReadText } from "@/server/features/voisona/text";
import { analyzeVoisonaText, synthesizeVoisona } from "@/server/features/voisona/use-case";

const AUDIO_PADDING_SECONDS = 0.1;

function getTtsComparisonInput(item: DraftTts) {
  return {
    text: item.text,
    readText: getVoisonaReadText(item.text, item.readText),
    voiceName: item.voiceName?.trim() || "",
    voiceVersion: item.voiceVersion?.trim() || "",
    analyzedText: item.speech?.analyzedText?.trim() || "",
  };
}

function validatePage(page: DraftProject["pages"][number]) {
  if (!page.richText.trim()) {
    throw new Error(`richText is required for page ${page.id}`);
  }

  if (page.tts.length === 0) {
    throw new Error(`at least one tts is required for page ${page.id}`);
  }
}

function validateTts(item: DraftTts) {
  if (!item.text.trim()) {
    throw new Error(`text is required for tts ${item.id}`);
  }

  if (!item.voiceName?.trim()) {
    throw new Error(`voiceName is required for tts ${item.id}`);
  }
}

function getPreviousComparisonInput(previous: SavedProject["pages"][number]["tts"][number]) {
  return {
    text: previous.text,
    readText: previous.readText ?? "",
    voiceName: previous.voiceName ?? "",
    voiceVersion: previous.voiceVersion ?? "",
    analyzedText: normalizeAnalyzedText(previous.speech.analyzedText),
  };
}

function normalizeAnalyzedText(value?: string) {
  return value?.trim() || "";
}

function shouldReusePreviousTts(
  item: DraftTts,
  previous?: SavedProject["pages"][number]["tts"][number],
) {
  if (!previous) {
    return false;
  }

  return (
    JSON.stringify(getPreviousComparisonInput(previous)) ===
    JSON.stringify(getTtsComparisonInput(item))
  );
}

async function resolveAnalyzedText(
  serverEnv: ServerEnv,
  nextInput: ReturnType<typeof getTtsComparisonInput>,
  options: { forceAnalyze: boolean },
) {
  if (!options.forceAnalyze && nextInput.analyzedText) {
    return nextInput.analyzedText;
  }

  const analysis = await analyzeVoisonaText(serverEnv, {
    text: nextInput.readText,
    language: "ja_JP",
  });
  return analysis.analyzedText;
}

function hasReadTextChanged(
  nextInput: ReturnType<typeof getTtsComparisonInput>,
  previous?: SavedProject["pages"][number]["tts"][number],
) {
  if (!previous) {
    return false;
  }

  return getPreviousComparisonInput(previous).readText !== nextInput.readText;
}

async function buildSavedTts(
  serverEnv: ServerEnv,
  item: DraftTts,
  previous?: SavedProject["pages"][number]["tts"][number],
) {
  validateTts(item);
  if (shouldReusePreviousTts(item, previous)) {
    return previous!;
  }

  const nextInput = getTtsComparisonInput(item);
  const analyzedText = await resolveAnalyzedText(serverEnv, nextInput, {
    forceAnalyze: hasReadTextChanged(nextInput, previous),
  });
  const voiceVersion = getOptionalVoiceVersion(nextInput.voiceVersion);
  const audio = await synthesizeVoisona(
    createSynthesisInput(serverEnv, nextInput, analyzedText, voiceVersion),
  );

  return createSavedTts(item, nextInput, analyzedText, audio, voiceVersion);
}

function getOptionalVoiceVersion(value: string) {
  return value || undefined;
}

function createSynthesisInput(
  serverEnv: ServerEnv,
  nextInput: ReturnType<typeof getTtsComparisonInput>,
  analyzedText: string,
  voiceVersion?: string,
) {
  return {
    serverEnv,
    text: nextInput.readText,
    analyzedText,
    voiceName: nextInput.voiceName,
    ...(voiceVersion ? { voiceVersion } : {}),
  };
}

function createSavedTts(
  item: DraftTts,
  nextInput: ReturnType<typeof getTtsComparisonInput>,
  analyzedText: string,
  audio: { audioSrc: string; durationSec: number },
  voiceVersion?: string,
) {
  return {
    id: item.id,
    text: item.text,
    readText: nextInput.readText,
    voiceName: nextInput.voiceName,
    ...(voiceVersion ? { voiceVersion } : {}),
    durationSec: audio.durationSec + AUDIO_PADDING_SECONDS,
    audio: {
      src: audio.audioSrc,
    },
    speech: {
      analyzedText,
    },
  };
}

async function buildSavedPage(
  serverEnv: ServerEnv,
  page: DraftProject["pages"][number],
  previousTtsById: Map<string, SavedProject["pages"][number]["tts"][number]>,
) {
  validatePage(page);
  const tts = await Promise.all(
    page.tts.map((item) => buildSavedTts(serverEnv, item, previousTtsById.get(item.id))),
  );

  return {
    id: page.id,
    type: page.type,
    padBeforeSec: page.padBeforeSec,
    padAfterSec: page.padAfterSec,
    durationSec: sumBy(tts, (item) => item.durationSec) + page.padBeforeSec + page.padAfterSec,
    richText: page.richText,
    tts,
  };
}

function buildPreviousTtsMap(previousProject?: SavedProject) {
  return new Map(
    previousProject?.pages.flatMap((page) => page.tts).map((item) => [item.id, item]) ?? [],
  );
}

async function buildSavedProject(
  serverEnv: ServerEnv,
  payload: unknown,
  previousProject?: SavedProject,
): Promise<SavedProject> {
  const draft = parseDraftPayload(payload);
  const previousTtsById = buildPreviousTtsMap(previousProject);
  const pages = await Promise.all(
    draft.pages.map((page) => buildSavedPage(serverEnv, page, previousTtsById)),
  );

  return savedProjectSchema.parse({ pages });
}

export async function listProjects(): Promise<ProjectFileSummary[]> {
  return listSavedProjects();
}

export async function createProject(projectPath: string) {
  return createSavedProject(projectPath, savedProjectSchema.parse({ pages: [] }));
}

export async function copyProject(sourceProjectPath: string, targetProjectPath: string) {
  const project = await readSavedProject(sourceProjectPath);
  return createSavedProject(targetProjectPath, project);
}

export async function loadProject(projectPath: string) {
  return readSavedProject(projectPath);
}

export async function saveProject(
  serverEnv: ServerEnv,
  projectPath: string,
  payload: DraftProject,
) {
  const previousProject = await readSavedProject(projectPath);
  const project = await buildSavedProject(serverEnv, payload, previousProject);
  await writeSavedProject(projectPath, project);
  return project;
}
