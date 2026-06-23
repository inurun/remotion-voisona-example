import { useEffect, useRef } from "react";
import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";
import { resolvePageIndexFromFieldCount } from "@/app/features/editor/selection";

export function useAppEditor() {
  const { pageFields, selectedPageIndex, syncPageIndexFromFields } = usePage();
  const { syncTtsIndexFromPage } = useTts();
  const previousPageCountRef = useRef(pageFields.length);

  useEffect(() => {
    const pageCount = pageFields.length;
    if (previousPageCountRef.current === pageCount) {
      return;
    }

    previousPageCountRef.current = pageCount;
    const nextPageIndex = resolvePageIndexFromFieldCount(selectedPageIndex, pageCount);
    syncPageIndexFromFields(pageCount);

    if (nextPageIndex === null) {
      syncTtsIndexFromPage(0);
      return;
    }

    syncTtsIndexFromPage(pageFields[nextPageIndex]?.tts.length ?? 0);
  }, [pageFields, selectedPageIndex, syncPageIndexFromFields, syncTtsIndexFromPage]);
}
