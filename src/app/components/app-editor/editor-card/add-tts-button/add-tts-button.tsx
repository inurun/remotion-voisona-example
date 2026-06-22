import { Plus } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { usePage } from "@/app/contexts/page-context/page-context";

export function AddTtsButton() {
  const { onAppendTtsToPage } = useEditor();
  const { selectedPageIndex } = usePage();

  if (selectedPageIndex === null) {
    return null;
  }

  return (
    <div className="flex justify-end">
      <Button
        type="button"
        size="icon"
        variant="secondary"
        title="TTS 追加"
        aria-label="TTS 追加"
        onClick={() => onAppendTtsToPage(selectedPageIndex)}
      >
        <Plus />
      </Button>
    </div>
  );
}
