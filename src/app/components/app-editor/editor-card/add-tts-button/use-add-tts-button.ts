import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import type { DraftProject } from "@/_schemas";
import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";

export function useAddTtsButton() {
  const form = useFormContext<DraftProject>();
  const { selectedPageIndex, setSelectedPageIndex } = usePage();
  const { selectedTtsIndex, appendToPage, selectTts } = useTts();

  const append = useCallback(() => {
    if (selectedPageIndex === null) {
      return;
    }

    const page = form.getValues(`pages.${selectedPageIndex}`);
    const sourceTts = selectedTtsIndex !== null ? page?.tts[selectedTtsIndex] : undefined;
    const result = appendToPage(selectedPageIndex, sourceTts);
    if (!result) {
      return;
    }

    setSelectedPageIndex(result.pageIndex);
    selectTts(result.ttsIndex);
  }, [appendToPage, form, selectTts, selectedPageIndex, selectedTtsIndex, setSelectedPageIndex]);

  return {
    selectedPageIndex,
    append,
  };
}
