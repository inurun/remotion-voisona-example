import { Plus } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { useAddTtsButtonHotkeys } from "@/app/components/app-editor/editor-card/tts-list/add-tts-button/add-tts-button.hotkeys";
import { useAddTtsButton } from "@/app/components/app-editor/editor-card/tts-list/add-tts-button/use-add-tts-button";

export function AddTtsButton() {
  const { selectedPageIndex, append } = useAddTtsButton();
  useAddTtsButtonHotkeys(append);

  if (selectedPageIndex === null) {
    return null;
  }

  return (
    <div className="flex absolute bottom-0 right-0">
      <Button type="button" size="sm" title="TTS 追加" aria-label="TTS 追加" onClick={append}>
        <Plus />
        Add
      </Button>
    </div>
  );
}
