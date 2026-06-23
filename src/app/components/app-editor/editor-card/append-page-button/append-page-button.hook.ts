import { useCallback } from "react";
import { createUuid } from "@/_shared/lib/utils";
import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";

export function useAppendPageButton() {
  const { pageFields, setSelectedPageIndex, appendPage } = usePage();
  const { clearSelection } = useTts();

  const append = useCallback(() => {
    setSelectedPageIndex(pageFields.length);
    clearSelection();
    appendPage({
      id: createUuid(),
      richText: "<p></p>",
      tts: [],
    });
  }, [appendPage, clearSelection, pageFields.length, setSelectedPageIndex]);

  return { append };
}
