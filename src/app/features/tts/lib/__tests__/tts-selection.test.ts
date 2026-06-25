import { describe, expect, it } from "vitest";
import {
  resolveTtsIndexAfterRemove,
  resolveTtsIndexForPage,
} from "@/app/features/tts/lib/tts-selection";

describe("TTS selection", () => {
  it("selects the first TTS item when a page has TTS entries", () => {
    expect(resolveTtsIndexForPage(2)).toBe(0);
    expect(resolveTtsIndexForPage(0)).toBeNull();
  });

  it("resolves the selected TTS item after removing an item", () => {
    expect(resolveTtsIndexAfterRemove(1, 0)).toBeNull();
    expect(resolveTtsIndexAfterRemove(3, 0)).toBe(0);
    expect(resolveTtsIndexAfterRemove(3, 2)).toBe(1);
  });
});
