import {
  type DraftProject,
  type DraftTts,
  savedProjectSchema,
  type SavedProject,
} from "@/_schemas";
import { getVoisonaReadText } from "@/_shared/lib/text";
import {
  ensureSavedProjectFile,
  parseDraftPayload,
  readSavedProject,
  writeSavedProject,
} from "@/server/_shared/storage";
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

export async function buildSavedProject(
  payload: unknown,
  previousProject?: SavedProject,
): Promise<SavedProject> {
  const draft = parseDraftPayload(payload);
  const previousTtsById = new Map(
    previousProject?.pages.flatMap((page) => page.tts).map((item) => [item.id, item]) ?? [],
  );

  const pages = await Promise.all(
    draft.pages.map(async (page) => {
      if (!page.richText.trim()) {
        throw new Error(`richText is required for page ${page.id}`);
      }
      if (page.tts.length === 0) {
        throw new Error(`at least one tts is required for page ${page.id}`);
      }

      const tts = await Promise.all(
        page.tts.map(async (item) => {
          const nextInput = getTtsComparisonInput(item);
          if (!item.text.trim()) {
            throw new Error(`text is required for tts ${item.id}`);
          }
          if (!item.voiceName?.trim()) {
            throw new Error(`voiceName is required for tts ${item.id}`);
          }

          const previous = previousTtsById.get(item.id);
          const previousInput = previous
            ? {
                text: previous.text,
                readText: previous.readText ?? "",
                voiceName: previous.voiceName ?? "",
                voiceVersion: previous.voiceVersion ?? "",
                analyzedText: previous.speech.analyzedText?.trim() || "",
              }
            : null;

          if (previous && JSON.stringify(previousInput) === JSON.stringify(nextInput)) {
            return previous;
          }

          const analyzedText =
            nextInput.analyzedText ||
            (
              await analyzeVoisonaText({
                text: nextInput.readText,
                language: "ja_JP",
              })
            ).analyzedText;

          const voiceVersion = nextInput.voiceVersion || undefined;
          const audio = await synthesizeVoisona({
            text: nextInput.readText,
            analyzedText,
            voiceName: nextInput.voiceName,
            ...(voiceVersion ? { voiceVersion } : {}),
          });

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
        }),
      );

      return {
        id: page.id,
        richText: page.richText,
        tts,
      };
    }),
  );

  return savedProjectSchema.parse({
    pages,
  });
}

export async function loadProject() {
  await ensureSavedProjectFile();
  return readSavedProject();
}

export async function saveProject(payload: DraftProject) {
  const previousProject = await readSavedProject().catch(() => undefined);
  const project = await buildSavedProject(payload, previousProject);
  await writeSavedProject(project);
  return project;
}
