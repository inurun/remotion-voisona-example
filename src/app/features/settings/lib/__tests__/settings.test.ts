import { describe, expect, it } from "vitest";
import type { VoiceOption } from "@/_schemas";
import { eventMatchesHotkey, findDuplicateHotkeys } from "@/app/features/settings/lib/hotkeys";
import {
  getDefaultVoice,
  getVisibleVoiceOptions,
  mergeVoiceOrder,
} from "@/app/features/settings/lib/settings";

function voice(voiceName: string, displayName: string, voiceVersion = ""): VoiceOption {
  return { voiceName, voiceVersion, displayName };
}

describe("settings voices", () => {
  it("keeps existing voice order and appends new voices", () => {
    const voices = [voice("a", "A"), voice("b", "B"), voice("c", "C")];

    expect(mergeVoiceOrder(["b::", "a::"], voices)).toEqual(["b::", "a::", "c::"]);
  });

  it("hides stale voices from visible options", () => {
    const options = getVisibleVoiceOptions({
      voices: [voice("a", "A")],
      voiceOrder: ["stale::", "a::"],
      voiceSettings: {
        "a::": { label: "Actor A", hotkey: "" },
        "stale::": { label: "Stale", hotkey: "ctrl+1" },
      },
    });

    expect(options).toEqual([{ voiceName: "a", voiceVersion: "", displayName: "Actor A" }]);
  });

  it("hides voices without a custom label from visible options", () => {
    const options = getVisibleVoiceOptions({
      voices: [voice("a", "A"), voice("b", "B")],
      voiceOrder: ["a::", "b::"],
      voiceSettings: {
        "b::": { label: "Actor B", hotkey: "" },
      },
    });

    expect(options).toEqual([{ voiceName: "b", voiceVersion: "", displayName: "Actor B" }]);
  });

  it("uses the first ordered voice as the default voice", () => {
    const options = getVisibleVoiceOptions({
      voices: [voice("a", "A"), voice("b", "B")],
      voiceOrder: ["b::", "a::"],
      voiceSettings: {
        "a::": { label: "Actor A", hotkey: "" },
        "b::": { label: "Actor B", hotkey: "" },
      },
    });

    expect(getDefaultVoice(options)?.voiceName).toBe("b");
  });
});

describe("settings hotkeys", () => {
  it("finds duplicate non-empty hotkeys", () => {
    expect([...findDuplicateHotkeys(["ctrl+s", "", "CTRL+S", "ctrl+1"])]).toEqual(["ctrl+s"]);
  });

  it("matches keyboard events against ctrl based hotkeys", () => {
    const event = {
      altKey: false,
      ctrlKey: true,
      key: "S",
      metaKey: false,
      shiftKey: true,
    } as KeyboardEvent;

    expect(eventMatchesHotkey(event, "ctrl+shift+s")).toBe(true);
    expect(eventMatchesHotkey(event, "ctrl+s")).toBe(false);
    expect(eventMatchesHotkey(event, "mod+shift+s")).toBe(false);
  });

  it("matches keyboard events with recorded meta and alt modifiers", () => {
    const event = {
      altKey: true,
      ctrlKey: false,
      key: "1",
      metaKey: true,
      shiftKey: false,
    } as KeyboardEvent;

    expect(eventMatchesHotkey(event, "alt+meta+1")).toBe(true);
    expect(eventMatchesHotkey(event, "meta+1")).toBe(false);
  });
});
