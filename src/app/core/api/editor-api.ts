import { type DraftProject, type DraftTts } from "@/_schemas";
import { analyzeText, synthesize } from "@/app/core/api/voisona";
import { saveProject } from "@/app/core/api/project";

function getPreviewPayload(item: DraftTts) {
  const analyzedText = item.speech?.analyzedText?.trim();
  const voiceVersion = item.voiceVersion?.trim();
  const voiceName = item.voiceName?.trim();

  if (!voiceName) {
    throw new Error("Voice name is required");
  }

  return {
    text: item.readText?.trim() || item.text,
    ...(analyzedText ? { analyzedText } : {}),
    voiceName,
    ...(voiceVersion ? { voiceVersion } : {}),
  };
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

export async function requestSaveProject(projectPath: string, project: DraftProject) {
  return saveProject(projectPath, project);
}
