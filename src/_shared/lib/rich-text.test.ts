import { describe, expect, it } from "vitest";
import { isSingleImageRichText, parseRichText } from "./rich-text";

describe("rich text helpers", () => {
  it("detects a single image document", () => {
    expect(isSingleImageRichText('<img src="/uploads/test.png" alt="x" />')).toBe(true);
  });

  it("keeps text nodes when parsing mixed content", () => {
    const parsed = parseRichText("<p>Hello <strong>world</strong></p>");
    expect(parsed.type).toBe("root");
    if (parsed.type !== "root") {
      throw new Error("Expected root node");
    }
    expect(parsed.children).toHaveLength(1);
    expect(parsed.children[0]).toMatchObject({ type: "element", tagName: "p" });
  });
});
