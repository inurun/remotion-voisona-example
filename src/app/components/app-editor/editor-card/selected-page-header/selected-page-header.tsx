import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { usePage } from "@/app/contexts/page-context/page-context";

export function SelectedPageHeader() {
  const { pageNumber, canMoveUp, canMoveDown, moveUp, moveDown, remove } = usePage();

  if (pageNumber === null) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-muted-foreground">Page {pageNumber}</div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={!canMoveUp}
          title="上へ"
          aria-label="上へ"
          onClick={moveUp}
        >
          <ArrowUp />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={!canMoveDown}
          title="下へ"
          aria-label="下へ"
          onClick={moveDown}
        >
          <ArrowDown />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="destructive"
          title="削除"
          aria-label="削除"
          onClick={remove}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
