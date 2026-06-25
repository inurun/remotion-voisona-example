import type { DraftTts } from "@/_schemas";

export type PreviewSynthesisPayload = {
  analyzedText?: string;
  text: string;
  voiceName: string;
  voiceVersion?: string;
};

function getTextForSynthesis(item: DraftTts) {
  return item.readText?.trim() || item.text;
}

function getRequiredVoiceName(item: DraftTts) {
  const voiceName = item.voiceName?.trim();
  if (!voiceName) {
    throw new Error("Voice name is required");
  }
  return voiceName;
}

function getAnalyzedTextPart(item: DraftTts) {
  const analyzedText = item.speech?.analyzedText?.trim();
  return analyzedText ? { analyzedText } : {};
}

function getVoiceVersionPart(item: DraftTts) {
  const voiceVersion = item.voiceVersion?.trim();
  return voiceVersion ? { voiceVersion } : {};
}

export function getPreviewPayload(item: DraftTts): PreviewSynthesisPayload {
  return {
    text: getTextForSynthesis(item),
    ...getAnalyzedTextPart(item),
    voiceName: getRequiredVoiceName(item),
    ...getVoiceVersionPart(item),
  };
}
