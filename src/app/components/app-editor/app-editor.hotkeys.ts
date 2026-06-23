import { useHotkeys } from "react-hotkeys-hook";
import { useEditor } from "@/app/contexts/editor-context/editor-context";

export function useAppEditorHotkeys() {
  const { save } = useEditor();

  useHotkeys(
    "mod+s",
    (event) => {
      event.preventDefault();
      save();
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [save],
  );
}
