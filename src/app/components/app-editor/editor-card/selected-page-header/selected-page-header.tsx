import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { useEditor } from "@/app/contexts/editor-context/editor-context";

export function SelectedPageHeader() {
  const { onMovePageDown, onMovePageUp, onRemovePage, pageFields, selectedPageIndex } = useEditor();

  if (selectedPageIndex === null) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-muted-foreground">Page {selectedPageIndex + 1}</div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={selectedPageIndex === 0}
          title="上へ"
          aria-label="上へ"
          onClick={() => onMovePageUp(selectedPageIndex)}
        >
          <ArrowUp />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={selectedPageIndex === pageFields.length - 1}
          title="下へ"
          aria-label="下へ"
          onClick={() => onMovePageDown(selectedPageIndex)}
        >
          <ArrowDown />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="destructive"
          title="削除"
          aria-label="削除"
          onClick={() => onRemovePage(selectedPageIndex)}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
