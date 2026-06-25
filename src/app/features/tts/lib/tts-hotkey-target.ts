export type TtsHotkeyTarget = {
  pageIndex: number;
  ttsIndex: number;
};

type TtsHotkeyDataset = {
  pageIndex?: string;
  ttsHotkeyTarget?: string;
  ttsIndex?: string;
};

function parseDatasetIndex(value: string | undefined) {
  const index = Number(value);
  return Number.isNaN(index) ? null : index;
}

export function getTtsHotkeyTarget(dataset: TtsHotkeyDataset): TtsHotkeyTarget | null {
  if (dataset.ttsHotkeyTarget !== "text") {
    return null;
  }

  const pageIndex = parseDatasetIndex(dataset.pageIndex);
  const ttsIndex = parseDatasetIndex(dataset.ttsIndex);

  if (pageIndex === null || ttsIndex === null) {
    return null;
  }

  return { pageIndex, ttsIndex };
}
