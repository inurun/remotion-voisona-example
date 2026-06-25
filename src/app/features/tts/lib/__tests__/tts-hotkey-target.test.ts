import { describe, expect, it } from "vitest";
import { getTtsHotkeyTarget } from "@/app/features/tts/lib/tts-hotkey-target";

describe("getTtsHotkeyTarget", () => {
  it("reads page and TTS indexes from a text target dataset", () => {
    expect(
      getTtsHotkeyTarget({
        ttsHotkeyTarget: "text",
        pageIndex: "2",
        ttsIndex: "3",
      }),
    ).toEqual({ pageIndex: 2, ttsIndex: 3 });
  });

  it("rejects non-text targets and invalid indexes", () => {
    expect(
      getTtsHotkeyTarget({ ttsHotkeyTarget: "read", pageIndex: "1", ttsIndex: "2" }),
    ).toBeNull();
    expect(
      getTtsHotkeyTarget({ ttsHotkeyTarget: "text", pageIndex: "x", ttsIndex: "2" }),
    ).toBeNull();
    expect(
      getTtsHotkeyTarget({ ttsHotkeyTarget: "text", pageIndex: "1", ttsIndex: "x" }),
    ).toBeNull();
  });
});
