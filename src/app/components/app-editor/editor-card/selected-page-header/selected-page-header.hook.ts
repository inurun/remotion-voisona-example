import { usePage } from "@/app/features/page";

export function useSelectedPageHeader() {
  const { selectedPageIndex } = usePage();

  return {
    pageNumber: selectedPageIndex !== null ? selectedPageIndex + 1 : null,
  };
}
