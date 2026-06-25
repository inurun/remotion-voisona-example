import { useCallback } from "react";
import { usePage } from "@/app/features/page";
import { useTts } from "@/app/features/tts";

export function usePageList() {
  const { pageFields, selectedPageIndex, setSelectedPageIndex } = usePage();
  const { syncForPage } = useTts();

  const selectPage = useCallback(
    (index: number) => {
      setSelectedPageIndex(index);
      syncForPage(pageFields[index]?.tts.length ?? 0);
    },
    [pageFields, setSelectedPageIndex, syncForPage],
  );

  return {
    pageFields,
    selectedPageIndex,
    selectPage,
  };
}
