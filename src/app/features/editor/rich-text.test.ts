import { describe, expect, it } from "vitest";
import { isSingleImageRichText } from "./rich-text";

describe("rich text helpers", () => {
  it("detects a single image document", () => {
    expect(isSingleImageRichText('<img src="/uploads/test.png" alt="x" />')).toBe(true);
  });

  it("does not treat mixed content as image only", () => {
    expect(isSingleImageRichText("<p>Hello <strong>world</strong></p>")).toBe(false);
  });
});
