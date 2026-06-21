import fs from "node:fs/promises";
import path from "node:path";

import {
  draftProjectSchema,
  projectFileSummarySchema,
  savedProjectSchema,
  type ProjectFileSummary,
  type SavedProject,
} from "@/_schemas";

export const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");
export const TTS_DIR = path.join(PUBLIC_DIR, "tts");
export const UPLOADS_DIR = path.join(PUBLIC_DIR, "uploads");
export const OUT_DIR = path.join(PROJECT_ROOT, "out");
export const RENDER_STATE_PATH = path.join(DATA_DIR, "render-state.json");
export const LATEST_VIDEO_PATH = path.join(OUT_DIR, "latest.mp4");

const DEFAULT_PROJECT_PATH = "project";
const PROJECT_FILE_EXTENSION = ".json";
const PROJECT_LIST_EXCLUDE = new Set([path.basename(RENDER_STATE_PATH)]);

export class InvalidProjectPathError extends Error {}

export class ProjectNotFoundError extends Error {}

function createInitialSavedProject() {
  return savedProjectSchema.parse({
    pages: [
      {
        id: "page-1",
        richText:
          "<h1>Remotion + VoiSona Template</h1><p>このテンプレをベースに本文と読み上げを編集できる。</p>",
        tts: [
          {
            id: "tts-1",
            text: "このテンプレをベースに本文と読み上げを編集できる。",
            readText: "このテンプレをベースにほんぶんとよみあげをへんしゅうできる。",
            voiceName: "",
            voiceVersion: "",
            durationSec: 0,
            audio: {
              src: "",
            },
            speech: {},
          },
        ],
      },
    ],
  });
}

function normalizeProjectPathSegment(segment: string) {
  const value = segment.trim();
  if (!value || value === "." || value === ".." || value.includes("\0")) {
    throw new InvalidProjectPathError("Invalid project path");
  }

  if (value.includes(path.sep) || value.includes("/")) {
    throw new InvalidProjectPathError("Invalid project path");
  }

  return value;
}

export function normalizeProjectPath(projectPath: string) {
  const normalized = projectPath
    .split("/")
    .filter(Boolean)
    .map(normalizeProjectPathSegment)
    .join("/");

  if (!normalized || normalized.endsWith(PROJECT_FILE_EXTENSION)) {
    throw new InvalidProjectPathError("Invalid project path");
  }

  return normalized;
}

function ensureProjectAbsolutePath(projectPath: string) {
  const normalizedPath = normalizeProjectPath(projectPath);
  const filePath = path.resolve(DATA_DIR, `${normalizedPath}${PROJECT_FILE_EXTENSION}`);
  const dataRoot = `${DATA_DIR}${path.sep}`;

  if (!filePath.startsWith(dataRoot)) {
    throw new InvalidProjectPathError("Invalid project path");
  }

  return filePath;
}

function toProjectSummary(relativePath: string, updatedAt: number): ProjectFileSummary {
  const pathWithoutExtension = relativePath.slice(0, -PROJECT_FILE_EXTENSION.length);
  const segments = pathWithoutExtension.split(path.sep).filter(Boolean);
  const name = segments[segments.length - 1];

  return projectFileSummarySchema.parse({
    path: segments.join("/"),
    name,
    segments,
    updatedAt: Math.trunc(updatedAt),
  });
}

async function collectProjectFiles(
  dirPath: string,
  nestedPath = "",
): Promise<ProjectFileSummary[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const summaries = await Promise.all(
    entries.flatMap((entry) => {
      const relativePath = nestedPath ? path.join(nestedPath, entry.name) : entry.name;
      const absolutePath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return [collectProjectFiles(absolutePath, relativePath)];
      }

      if (
        !entry.isFile() ||
        !entry.name.endsWith(PROJECT_FILE_EXTENSION) ||
        PROJECT_LIST_EXCLUDE.has(entry.name)
      ) {
        return [];
      }

      return [fs.stat(absolutePath).then((stats) => toProjectSummary(relativePath, stats.mtimeMs))];
    }),
  );

  return summaries.flat().sort((left, right) => right.updatedAt - left.updatedAt);
}

export async function ensureProjectDirs() {
  await Promise.all([
    fs.mkdir(DATA_DIR, { recursive: true }),
    fs.mkdir(PUBLIC_DIR, { recursive: true }),
    fs.mkdir(TTS_DIR, { recursive: true }),
    fs.mkdir(UPLOADS_DIR, { recursive: true }),
    fs.mkdir(OUT_DIR, { recursive: true }),
  ]);
}

export async function listSavedProjects() {
  await ensureProjectDirs();
  const files = await collectProjectFiles(DATA_DIR);
  if (files.length > 0) {
    return files;
  }

  await ensureSavedProjectFile(DEFAULT_PROJECT_PATH);
  return collectProjectFiles(DATA_DIR);
}

export async function readSavedProject(projectPath: string): Promise<SavedProject> {
  await ensureProjectDirs();
  const filePath = ensureProjectAbsolutePath(projectPath);

  try {
    const content = await fs.readFile(filePath, "utf8");
    return savedProjectSchema.parse(JSON.parse(content));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ProjectNotFoundError(`Project not found: ${projectPath}`);
    }
    throw error;
  }
}

export async function writeSavedProject(projectPath: string, project: SavedProject) {
  await ensureProjectDirs();
  const filePath = ensureProjectAbsolutePath(projectPath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(project, null, 2));
}

export async function ensureSavedProjectFile(projectPath: string) {
  await ensureProjectDirs();
  const filePath = ensureProjectAbsolutePath(projectPath);

  try {
    await fs.access(filePath);
  } catch {
    await writeSavedProject(projectPath, createInitialSavedProject());
  }
}

export function parseDraftPayload(payload: unknown) {
  return draftProjectSchema.parse(payload);
}

export function getPublicFilePath(urlPath: string) {
  const normalized = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(PUBLIC_DIR, normalized);
}
