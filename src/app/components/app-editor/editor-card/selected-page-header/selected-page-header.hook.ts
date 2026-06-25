import { useCallback } from "react";
import {
  getLandingPageTtsCount,
  resolveSelectedPageIndexAfterRemove,
  usePage,
} from "@/app/features/page";
import { useTts } from "@/app/features/tts";

export function useSelectedPageHeader() {
  const { pageFields, selectedPageIndex, setSelectedPageIndex, movePage, removePage } = usePage();
  const { syncForPage } = useTts();

  const moveUp = useCallback(() => {
    if (selectedPageIndex === null || selectedPageIndex <= 0) {
      return;
    }

    movePage(selectedPageIndex, selectedPageIndex - 1);
    setSelectedPageIndex(selectedPageIndex - 1);
  }, [movePage, selectedPageIndex, setSelectedPageIndex]);

  const moveDown = useCallback(() => {
    if (selectedPageIndex === null || selectedPageIndex >= pageFields.length - 1) {
      return;
    }

    movePage(selectedPageIndex, selectedPageIndex + 1);
    setSelectedPageIndex(selectedPageIndex + 1);
  }, [movePage, pageFields.length, selectedPageIndex, setSelectedPageIndex]);

  const remove = useCallback(() => {
    if (selectedPageIndex === null) {
      return;
    }

    const index = selectedPageIndex;
    const nextLength = pageFields.length - 1;
    const nextPageIndex = resolveSelectedPageIndexAfterRemove(selectedPageIndex, index, nextLength);
    const landingTtsCount = getLandingPageTtsCount(pageFields, index, nextPageIndex);

    removePage(index);
    setSelectedPageIndex(nextPageIndex);
    syncForPage(landingTtsCount);
  }, [pageFields, removePage, selectedPageIndex, setSelectedPageIndex, syncForPage]);

  return {
    pageNumber: selectedPageIndex !== null ? selectedPageIndex + 1 : null,
    canMoveUp: selectedPageIndex !== null && selectedPageIndex > 0,
    canMoveDown: selectedPageIndex !== null && selectedPageIndex < pageFields.length - 1,
    moveUp,
    moveDown,
    remove,
  };
}
