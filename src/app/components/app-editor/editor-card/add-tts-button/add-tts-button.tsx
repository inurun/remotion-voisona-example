import { Plus } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { useAddTtsButton } from "@/app/components/app-editor/editor-card/add-tts-button/use-add-tts-button";

export function AddTtsButton() {
  const { selectedPageIndex, append } = useAddTtsButton();

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
        onClick={append}
      >
        <Plus />
      </Button>
    </div>
  );
}
