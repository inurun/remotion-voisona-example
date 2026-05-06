import { getVoisonaReadText } from "@/lib/text";
import { draftProjectSchema, savedProjectSchema, type SavedProject } from "@/lib/schema";
import { analyzeVoisonaText, synthesizeVoisona } from "@/lib/voisona";

const AUDIO_PADDING_SECONDS = 0.1;

export async function buildSavedProject(payload: unknown): Promise<SavedProject> {
  const draft = draftProjectSchema.parse(payload);
  const items = await Promise.all(
    draft.items.map(async (item) => {
      const readText = getVoisonaReadText(item.text, item.readText);
      const analyzedText =
        item.speech?.analyzedText?.trim() ||
        (
          await analyzeVoisonaText({
            text: readText,
            language: "ja_JP",
          })
        ).analyzedText;

      if (!item.voiceName?.trim()) {
        throw new Error(`voiceName is required for item ${item.id}`);
      }

      const audio = await synthesizeVoisona({
        text: readText,
        analyzedText,
        voiceName: item.voiceName,
        ...(item.voiceVersion?.trim()
          ? { voiceVersion: item.voiceVersion.trim() }
          : {}),
      });

      return {
        id: item.id,
        text: item.text,
        readText,
        voiceName: item.voiceName,
        ...(item.voiceVersion?.trim()
          ? { voiceVersion: item.voiceVersion.trim() }
          : {}),
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

  let currentSec = 0;
  const timeline = items.map((item) => {
    const startSec = currentSec;
    currentSec += item.durationSec;
    return {
      id: item.id,
      startSec,
      endSec: currentSec,
    };
  });

  return savedProjectSchema.parse({
    items,
    timeline,
    durationSec: currentSec,
  });
}
