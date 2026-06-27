import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VoiceOption } from "@/_schemas";

type StorageMock = {
  clear: () => void;
  getItem: ReturnType<typeof vi.fn>;
  removeItem: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
};

function createLocalStorageMock(initial: Record<string, string> = {}): StorageMock {
  const store = new Map(Object.entries(initial));

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: () => {
      store.clear();
    },
  };
}

async function importStoreWithStorage(storage: StorageMock) {
  vi.resetModules();
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("window", { localStorage: storage });
  return import("../use-settings-store");
}

function voice(voiceName: string, displayName: string, voiceVersion = ""): VoiceOption {
  return { voiceName, voiceVersion, displayName };
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("useSettingsStore", () => {
  it("uses default settings when no persisted value exists", async () => {
    const storage = createLocalStorageMock();
    const { DEFAULT_HOTKEYS } = await import("@/app/features/settings/lib/hotkeys");
    const { hasStoredSettings, useSettingsStore } = await importStoreWithStorage(storage);

    expect(hasStoredSettings()).toBe(false);
    expect(useSettingsStore.getState().voices).toEqual([]);
    expect(useSettingsStore.getState().hotkeys).toEqual(DEFAULT_HOTKEYS);
  });

  it("hydrates settings from localStorage", async () => {
    const { SETTINGS_STORAGE_KEY, useSettingsStore } = await importStoreWithStorage(
      createLocalStorageMock({
        "remotion-voisona-settings": JSON.stringify({
          state: {
            voices: [voice("a", "A")],
            voiceOrder: ["a::"],
            voiceSettings: { "a::": { label: "Actor A", hotkey: "CTRL+1" } },
            hotkeys: { save: "CTRL+S", analyze: "ctrl+shift+s", addTts: "ctrl+enter" },
          },
          version: 0,
        }),
      }),
    );

    expect(useSettingsStore.getState().voiceSettings["a::"]?.hotkey).toBe("ctrl+1");
    expect(useSettingsStore.getState().hotkeys.save).toBe("ctrl+s");
    expect(useSettingsStore.persist.getOptions().name).toBe(SETTINGS_STORAGE_KEY);
  });

  it("persists saved settings", async () => {
    const storage = createLocalStorageMock();
    const { SETTINGS_STORAGE_KEY, useSettingsStore } = await importStoreWithStorage(storage);

    useSettingsStore.getState().saveSettings({
      voices: [voice("a", "A")],
      voiceOrder: ["a::"],
      voiceSettings: { "a::": { label: "Actor A", hotkey: "CTRL+1" } },
      hotkeys: { save: "CTRL+S", analyze: "ctrl+shift+s", addTts: "ctrl+enter" },
    });

    expect(storage.setItem).toHaveBeenCalledWith(
      SETTINGS_STORAGE_KEY,
      expect.stringContaining('"hotkey":"ctrl+1"'),
    );
  });

  it("merges refreshed voices without losing existing voice settings", async () => {
    const storage = createLocalStorageMock();
    const { useSettingsStore } = await importStoreWithStorage(storage);

    useSettingsStore.getState().saveSettings({
      voices: [voice("a", "A"), voice("b", "B")],
      voiceOrder: ["b::", "a::"],
      voiceSettings: { "b::": { label: "Actor B", hotkey: "ctrl+2" } },
      hotkeys: { save: "ctrl+s", analyze: "ctrl+shift+s", addTts: "ctrl+enter" },
    });
    useSettingsStore.getState().mergeFetchedVoices([voice("a", "A"), voice("c", "C")]);

    expect(useSettingsStore.getState().voiceOrder).toEqual(["a::", "c::"]);
    expect(useSettingsStore.getState().voiceSettings["b::"]).toEqual({
      label: "Actor B",
      hotkey: "ctrl+2",
    });
  });
});
