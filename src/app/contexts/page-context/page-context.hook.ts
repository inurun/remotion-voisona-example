import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";
import type { DraftPage } from "@/_schemas";
import { createUuid } from "@/_shared/lib/utils";
import { useForm } from "@/app/contexts/form-context/form-context";

function resolveSelectedPageIndexAfterRemove(
  current: number | null,
  removedIndex: number,
  nextLength: number,
): number | null {
  if (current === null) {
    return null;
  }

  if (removedIndex !== current) {
    return current + (removedIndex < current ? -1 : 0);
  }

  if (nextLength === 0) {
    return null;
  }

  return Math.min(removedIndex, nextLength - 1);
}

type PageContextValue = {
  pageFields: Array<DraftPage & { fieldKey: string }>;
  selectedPageIndex: number | null;
  selectedTtsIndex: number | null;
  setSelectedTtsIndex: Dispatch<SetStateAction<number | null>>;
  pageNumber: number | null;
  canMoveUp: boolean;
  canMoveDown: boolean;
  selectPage: (index: number) => void;
  selectTtsAt: (pageIndex: number, ttsIndex: number) => void;
  append: () => void;
  moveUp: () => void;
  moveDown: () => void;
  remove: () => void;
};

export function usePageProviderValue(): PageContextValue {
  const { pageFields, movePage, removePage, appendPage } = useForm();
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [selectedTtsIndex, setSelectedTtsIndex] = useState<number | null>(null);

  useEffect(() => {
    if (pageFields.length === 0) {
      setSelectedPageIndex(null);
      setSelectedTtsIndex(null);
      return;
    }

    setSelectedPageIndex((current) => {
      if (current === null) {
        return 0;
      }
      return current < pageFields.length ? current : pageFields.length - 1;
    });
  }, [pageFields.length]);

  const selectPage = useCallback((index: number) => {
    setSelectedPageIndex(index);
    setSelectedTtsIndex(0);
  }, []);

  const selectTtsAt = useCallback((pageIndex: number, ttsIndex: number) => {
    setSelectedPageIndex(pageIndex);
    setSelectedTtsIndex(ttsIndex);
  }, []);

  const append = useCallback(() => {
    setSelectedPageIndex(pageFields.length);
    setSelectedTtsIndex(null);
    appendPage({
      id: createUuid(),
      richText: "<p></p>",
      tts: [],
    });
  }, [appendPage, pageFields.length]);

  const moveUp = useCallback(() => {
    if (selectedPageIndex === null || selectedPageIndex <= 0) {
      return;
    }

    movePage(selectedPageIndex, selectedPageIndex - 1);
    setSelectedPageIndex(selectedPageIndex - 1);
  }, [movePage, selectedPageIndex]);

  const moveDown = useCallback(() => {
    if (selectedPageIndex === null || selectedPageIndex >= pageFields.length - 1) {
      return;
    }

    movePage(selectedPageIndex, selectedPageIndex + 1);
    setSelectedPageIndex(selectedPageIndex + 1);
  }, [movePage, pageFields.length, selectedPageIndex]);

  const remove = useCallback(() => {
    if (selectedPageIndex === null) {
      return;
    }

    const index = selectedPageIndex;
    const nextLength = pageFields.length - 1;

    setSelectedPageIndex((current) =>
      resolveSelectedPageIndexAfterRemove(current, index, nextLength),
    );
    setSelectedTtsIndex(null);
    removePage(index);
  }, [pageFields.length, removePage, selectedPageIndex]);

  return {
    pageFields,
    selectedPageIndex,
    selectedTtsIndex,
    setSelectedTtsIndex,
    pageNumber: selectedPageIndex !== null ? selectedPageIndex + 1 : null,
    canMoveUp: selectedPageIndex !== null && selectedPageIndex > 0,
    canMoveDown: selectedPageIndex !== null && selectedPageIndex < pageFields.length - 1,
    selectPage,
    selectTtsAt,
    append,
    moveUp,
    moveDown,
    remove,
  };
}
