import { describe, expect, it } from "vitest";
import {
  getLandingPageTtsCount,
  resolvePageIndexFromFieldCount,
  resolveSelectedPageIndexAfterRemove,
  resolveTtsIndexAfterRemove,
  resolveTtsIndexForPage,
} from "../selection";

describe("selection", () => {
  it("selects the first TTS item when a page has TTS entries", () => {
    expect(resolveTtsIndexForPage(2)).toBe(0);
    expect(resolveTtsIndexForPage(0)).toBeNull();
  });

  it("keeps the selected page in range after field count changes", () => {
    expect(resolvePageIndexFromFieldCount(null, 3)).toBe(0);
    expect(resolvePageIndexFromFieldCount(1, 3)).toBe(1);
    expect(resolvePageIndexFromFieldCount(4, 3)).toBe(2);
    expect(resolvePageIndexFromFieldCount(0, 0)).toBeNull();
  });

  it("resolves the selected page after removing a page", () => {
    expect(resolveSelectedPageIndexAfterRemove(null, 0, 2)).toBeNull();
    expect(resolveSelectedPageIndexAfterRemove(2, 0, 2)).toBe(1);
    expect(resolveSelectedPageIndexAfterRemove(0, 0, 0)).toBeNull();
    expect(resolveSelectedPageIndexAfterRemove(1, 1, 2)).toBe(1);
  });

  it("resolves the selected TTS item after removing an item", () => {
    expect(resolveTtsIndexAfterRemove(1, 0)).toBeNull();
    expect(resolveTtsIndexAfterRemove(3, 0)).toBe(0);
    expect(resolveTtsIndexAfterRemove(3, 2)).toBe(1);
  });

  it("reads the landing page TTS count from the pre-removal page list", () => {
    const pageFields = [{ tts: ["a"] }, { tts: ["b", "c"] }, { tts: [] }];

    expect(getLandingPageTtsCount(pageFields, 1, null)).toBe(0);
    expect(getLandingPageTtsCount(pageFields, 1, 0)).toBe(1);
    expect(getLandingPageTtsCount(pageFields, 1, 1)).toBe(0);
  });
});
