import { useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import type { DraftProject, DraftTts } from "@/_schemas";
import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";
import { resolveTtsIndexAfterRemove } from "@/app/features/editor/selection";

export function useTtsList() {
  const { control } = useFormContext<DraftProject>();
  const { selectedPageIndex } = usePage();
  const { selectedTtsIndex, selectTts, clearSelection } = useTts();
  const pageIndex = selectedPageIndex ?? 0;
  const { fields, remove } = useFieldArray({
    control,
    keyName: "fieldKey",
    name: `pages.${pageIndex}.tts`,
  });

  const removeTts = useCallback(
    (index: number) => {
      const nextTtsIndex = resolveTtsIndexAfterRemove(fields.length, index);
      if (nextTtsIndex === null) {
        clearSelection();
      } else {
        selectTts(nextTtsIndex);
      }
      remove(index);
    },
    [clearSelection, fields.length, remove, selectTts],
  );

  const selectTtsOnFocus = useCallback(
    (index: number) => {
      selectTts(index);
    },
    [selectTts],
  );

  return {
    selectedPageIndex,
    selectedTtsIndex,
    fields,
    removeTts,
    selectTtsOnFocus,
    selectTts,
  };
}
