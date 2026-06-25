import { describe, expect, it } from "vitest";
import type { DraftTts } from "@/_schemas";
import { getPreviewPayload } from "@/app/features/tts/lib/tts-preview-payload";

function createTts(overrides: Partial<DraftTts> = {}): DraftTts {
  return {
    id: "tts",
    text: "text",
    readText: "",
    voiceName: " voice ",
    voiceVersion: "",
    speech: {},
    ...overrides,
  };
}

describe("getPreviewPayload", () => {
  it("uses read text before source text", () => {
    expect(getPreviewPayload(createTts({ readText: " read " }))).toMatchObject({
      text: "read",
      voiceName: "voice",
    });
  });

  it("includes trimmed optional synthesis fields", () => {
    expect(
      getPreviewPayload(
        createTts({
          speech: { analyzedText: " analyzed " },
          voiceVersion: " version ",
        }),
      ),
    ).toEqual({
      analyzedText: "analyzed",
      text: "text",
      voiceName: "voice",
      voiceVersion: "version",
    });
  });

  it("requires a voice name", () => {
    expect(() => getPreviewPayload(createTts({ voiceName: " " }))).toThrow("Voice name");
  });
});
