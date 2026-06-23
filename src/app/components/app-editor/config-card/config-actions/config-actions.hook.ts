import { useCallback } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { DraftProject } from "@/_schemas";
import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";

function isVoiceActionDisabled({
  canRunTts,
  text,
  voiceName,
}: {
  canRunTts: boolean;
  text?: string;
  voiceName?: string;
}) {
  return [canRunTts, Boolean((text ?? "").trim()), Boolean(voiceName)].some(
    (condition) => !condition,
  );
}

function getFieldIndex(index: number | null) {
  return index ?? 0;
}

function hasSelectedTts(pageIndex: number | null, ttsIndex: number | null) {
  return pageIndex !== null && ttsIndex !== null;
}

function runSelectedTtsAction(
  pageIndex: number | null,
  ttsIndex: number | null,
  action: (pageIndex: number, ttsIndex: number) => Promise<void>,
) {
  if (pageIndex === null || ttsIndex === null) {
    return;
  }

  void action(pageIndex, ttsIndex);
}

export function useConfigTtsActions() {
  const { analyze, canRunTts, isAnalyzing, preview, selectedTtsIndex } = useTts();
  const { selectedPageIndex } = usePage();
  const { control } = useFormContext<DraftProject>();
  const pageIndex = getFieldIndex(selectedPageIndex);
  const ttsIndex = getFieldIndex(selectedTtsIndex);
  const text = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.text` });
  const voiceName = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.voiceName` });
  const actionDisabled = isVoiceActionDisabled({ canRunTts, text, voiceName });
  const hasSelection = hasSelectedTts(selectedPageIndex, selectedTtsIndex);

  const analyzeSelected = useCallback(() => {
    runSelectedTtsAction(selectedPageIndex, selectedTtsIndex, analyze);
  }, [analyze, selectedPageIndex, selectedTtsIndex]);

  const previewSelected = useCallback(() => {
    runSelectedTtsAction(selectedPageIndex, selectedTtsIndex, preview);
  }, [preview, selectedPageIndex, selectedTtsIndex]);

  return {
    analyzeSelected,
    analyzeDisabled: actionDisabled || isAnalyzing,
    hasSelection,
    isAnalyzing,
    previewDisabled: actionDisabled,
    previewSelected,
  };
}
