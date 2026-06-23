import { useCallback } from "react";
import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";

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
