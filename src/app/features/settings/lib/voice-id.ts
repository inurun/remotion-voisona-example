import type { VoiceOption } from "@/_schemas";

export function getVoiceId(voice: Pick<VoiceOption, "voiceName" | "voiceVersion">) {
  return `${voice.voiceName}::${voice.voiceVersion ?? ""}`;
}
