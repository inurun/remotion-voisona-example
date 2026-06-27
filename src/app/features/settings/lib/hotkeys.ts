export const DEFAULT_HOTKEYS = {
  save: "ctrl+s",
  analyze: "ctrl+shift+s",
  addTts: "ctrl+enter",
} as const;

export type AppHotkeyAction = keyof typeof DEFAULT_HOTKEYS;

export type AppHotkeys = Record<AppHotkeyAction, string>;

export const APP_HOTKEY_LABELS: Record<AppHotkeyAction, string> = {
  save: "Save",
  analyze: "Analyze TSML",
  addTts: "Add TTS",
};

type ParsedHotkey = {
  alt: boolean;
  key: string;
  meta: boolean;
  shift: boolean;
  ctrl: boolean;
};

export function normalizeHotkey(value: string) {
  return value.trim().toLowerCase();
}

export function findDuplicateHotkeys(hotkeys: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of hotkeys) {
    const hotkey = normalizeHotkey(value);
    if (!hotkey) {
      continue;
    }

    if (seen.has(hotkey)) {
      duplicates.add(hotkey);
    }
    seen.add(hotkey);
  }

  return duplicates;
}

function parseHotkey(hotkeyValue: string): ParsedHotkey | null {
  const hotkey = normalizeHotkey(hotkeyValue);
  if (!hotkey) {
    return null;
  }

  const parts = hotkey.split("+");
  const key = parts.find((part) => !["ctrl", "shift", "alt", "meta"].includes(part));
  if (!key) {
    return null;
  }

  return {
    alt: parts.includes("alt"),
    ctrl: parts.includes("ctrl"),
    key,
    meta: parts.includes("meta"),
    shift: parts.includes("shift"),
  };
}

function keyboardEventMatchesParsedHotkey(event: KeyboardEvent, hotkey: ParsedHotkey) {
  const eventParts = [
    event.ctrlKey,
    event.metaKey,
    event.shiftKey,
    event.altKey,
    event.key.toLowerCase(),
  ];
  const hotkeyParts = [hotkey.ctrl, hotkey.meta, hotkey.shift, hotkey.alt, hotkey.key];
  return eventParts.every((value, index) => value === hotkeyParts[index]);
}

export function eventMatchesHotkey(event: KeyboardEvent, hotkeyValue: string) {
  const hotkey = parseHotkey(hotkeyValue);
  return hotkey !== null && keyboardEventMatchesParsedHotkey(event, hotkey);
}
