import { usePageHeader } from "@/app/components/app-editor/editor-card/page-header/page-header.hook";

export function PageHeader() {
  const { pageNumber } = usePageHeader();

  if (pageNumber === null) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-muted-foreground">Page {pageNumber}</div>
    </div>
  );
}
