import fs from "node:fs/promises";
import path from "node:path";

import {
  draftProjectSchema,
  savedProjectSchema,
  type SavedProject,
} from "@/lib/schema";

export const PROJECT_ROOT = process.cwd();
export const DATA_DIR = path.join(PROJECT_ROOT, "data");
export const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
export const TTS_DIR = path.join(PUBLIC_DIR, "tts");
export const OUT_DIR = path.join(PROJECT_ROOT, "out");
export const SAVED_PROJECT_PATH = path.join(DATA_DIR, "sequences.json");
export const LATEST_VIDEO_PATH = path.join(OUT_DIR, "latest.mp4");

export async function ensureProjectDirs() {
  await Promise.all([
    fs.mkdir(DATA_DIR, { recursive: true }),
    fs.mkdir(PUBLIC_DIR, { recursive: true }),
    fs.mkdir(TTS_DIR, { recursive: true }),
    fs.mkdir(OUT_DIR, { recursive: true }),
  ]);
}

export async function readSavedProject(): Promise<SavedProject> {
  await ensureProjectDirs();
  const content = await fs.readFile(SAVED_PROJECT_PATH, "utf8");
  return savedProjectSchema.parse(JSON.parse(content));
}

export async function writeSavedProject(project: SavedProject) {
  await ensureProjectDirs();
  await fs.writeFile(SAVED_PROJECT_PATH, JSON.stringify(project, null, 2));
}

export async function ensureSavedProjectFile() {
  await ensureProjectDirs();

  try {
    await fs.access(SAVED_PROJECT_PATH);
  } catch {
    const initial = savedProjectSchema.parse({
      items: [],
      timeline: [],
      durationSec: 0,
    });
    await writeSavedProject(initial);
  }
}

export function parseDraftPayload(payload: unknown) {
  return draftProjectSchema.parse(payload);
}
