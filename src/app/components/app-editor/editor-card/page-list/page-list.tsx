import { cn } from "@/_shared/lib/utils";
import { useEditor } from "@/app/contexts/editor-context/editor-context";

export function PageList() {
  const { onSelectPage, pageFields, selectedPageIndex } = useEditor();

  if (pageFields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        No pages.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {pageFields.map((field, index) => (
        <button
          key={field.fieldKey}
          type="button"
          onClick={() => onSelectPage(index)}
          className={cn(
            "grid cursor-pointer gap-2 rounded-xl border p-3 text-left transition-colors",
            selectedPageIndex === index ? "border-primary bg-primary/8" : "border-border bg-card",
          )}
        >
          <div className="grid gap-1">
            <div className="text-xs text-muted-foreground">Page {index + 1}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
