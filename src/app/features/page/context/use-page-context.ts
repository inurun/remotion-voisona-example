import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { DraftPage } from "@/_schemas";
import { useForm } from "@/app/features/editor";
import { resolvePageIndexFromFieldCount } from "@/app/features/page/lib/page-selection";

type PageContextValue = {
  pageFields: Array<DraftPage & { fieldKey: string }>;
  selectedPageIndex: number | null;
  setSelectedPageIndex: Dispatch<SetStateAction<number | null>>;
  movePage: (fromIndex: number, toIndex: number) => void;
  removePage: (index: number) => void;
  appendPage: (page: DraftPage) => void;
  syncPageIndexFromFields: (pageCount: number) => void;
};

export function usePageProviderValue(): PageContextValue {
  const { pageFields, movePage, removePage, appendPage } = useForm();
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);

  const syncPageIndexFromFields = useCallback((pageCount: number) => {
    setSelectedPageIndex((current) => resolvePageIndexFromFieldCount(current, pageCount));
  }, []);

  return {
    pageFields,
    selectedPageIndex,
    setSelectedPageIndex,
    movePage,
    removePage,
    appendPage,
    syncPageIndexFromFields,
  };
}
