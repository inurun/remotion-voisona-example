import { describe, expect, it } from "vitest";
import type { DraftTts } from "@/_schemas";
import { isTtsActionReady } from "@/app/features/tts/lib/tts-action";

function createTts(overrides: Partial<DraftTts> = {}): DraftTts {
  return {
    id: "tts",
    text: "こんにちは",
    readText: "",
    voiceName: "voice",
    voiceVersion: "",
    speech: {},
    ...overrides,
  };
}

describe("isTtsActionReady", () => {
  it("accepts a runnable TTS item", () => {
    expect(isTtsActionReady(createTts(), true)).toBe(true);
  });

  it("rejects missing items and disabled commands", () => {
    expect(isTtsActionReady(undefined, true)).toBe(false);
    expect(isTtsActionReady(createTts(), false)).toBe(false);
  });

  it("requires text and voice name", () => {
    expect(isTtsActionReady(createTts({ text: "  " }), true)).toBe(false);
    expect(isTtsActionReady(createTts({ voiceName: "" }), true)).toBe(false);
  });
});
