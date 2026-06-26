import { usePage } from "@/app/features/page";

export function usePageHeader() {
  const { selectedPageIndex } = usePage();

  return {
    pageNumber: selectedPageIndex !== null ? selectedPageIndex + 1 : null,
  };
}
