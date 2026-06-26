import { useEffect, useRef } from "react";
import { resolvePageIndexFromFieldCount, usePage } from "@/app/features/page";
import { useTts } from "@/app/features/tts";

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
