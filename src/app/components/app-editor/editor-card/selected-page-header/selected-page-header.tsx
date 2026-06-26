import { useSelectedPageHeader } from "@/app/components/app-editor/editor-card/selected-page-header/selected-page-header.hook";

export function SelectedPageHeader() {
  const { pageNumber } = useSelectedPageHeader();

  if (pageNumber === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-muted-foreground">Page {pageNumber}</div>
    </div>
  );
}
