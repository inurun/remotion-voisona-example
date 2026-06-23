import { describe, expect, it } from "vitest";
import {
  getLandingPageTtsCount,
  resolvePageIndexFromFieldCount,
  resolveSelectedPageIndexAfterRemove,
  resolveTtsIndexAfterRemove,
  resolveTtsIndexForPage,
} from "./selection";

describe("resolveTtsIndexForPage", () => {
  it("returns 0 when the page has tts items", () => {
    expect(resolveTtsIndexForPage(2)).toBe(0);
  });

  it("returns null when the page has no tts items", () => {
    expect(resolveTtsIndexForPage(0)).toBeNull();
  });
});

describe("resolveSelectedPageIndexAfterRemove", () => {
  it("shifts the selection when another page is removed", () => {
    expect(resolveSelectedPageIndexAfterRemove(2, 0, 2)).toBe(1);
  });

  it("lands on the next page when the selected page is removed", () => {
    expect(resolveSelectedPageIndexAfterRemove(1, 1, 2)).toBe(1);
  });

  it("returns null when the last page is removed", () => {
    expect(resolveSelectedPageIndexAfterRemove(0, 0, 0)).toBeNull();
  });
});

describe("resolveTtsIndexAfterRemove", () => {
  it("returns null when removing the only tts item", () => {
    expect(resolveTtsIndexAfterRemove(1, 0)).toBeNull();
  });

  it("keeps a valid index when other tts items remain", () => {
    expect(resolveTtsIndexAfterRemove(3, 1)).toBe(1);
    expect(resolveTtsIndexAfterRemove(3, 2)).toBe(1);
  });
});

describe("getLandingPageTtsCount", () => {
  const pageFields = [{ tts: [{}, {}] }, { tts: [{}] }, { tts: [] }];

  it("returns 0 when no page remains selected", () => {
    expect(getLandingPageTtsCount(pageFields, 1, null)).toBe(0);
  });

  it("reads tts count from the page that will be selected after removal", () => {
    expect(getLandingPageTtsCount(pageFields, 2, 1)).toBe(1);
    expect(getLandingPageTtsCount(pageFields, 0, 0)).toBe(1);
  });
});

describe("resolvePageIndexFromFieldCount", () => {
  it("returns null when there are no pages", () => {
    expect(resolvePageIndexFromFieldCount(1, 0)).toBeNull();
  });

  it("selects the first page when nothing is selected", () => {
    expect(resolvePageIndexFromFieldCount(null, 3)).toBe(0);
  });

  it("clamps the selection when pages were removed", () => {
    expect(resolvePageIndexFromFieldCount(3, 2)).toBe(1);
  });
});
