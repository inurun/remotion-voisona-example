import { useHotkeys } from "react-hotkeys-hook";
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { usePage } from "@/app/contexts/page-context/page-context";

function getHotkeyTarget() {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLTextAreaElement)) {
    return null;
  }

  if (activeElement.dataset.ttsHotkeyTarget !== "text") {
    return null;
  }

  const pageIndex = Number(activeElement.dataset.pageIndex);
  const ttsIndex = Number(activeElement.dataset.ttsIndex);

  if (Number.isNaN(pageIndex) || Number.isNaN(ttsIndex)) {
    return null;
  }

  return { pageIndex, ttsIndex };
}

export function useEditorHotkeys() {
  const { onAnalyzeTts, onAppendTtsToPage, onSave } = useEditor();
  const { selectedPageIndex } = usePage();

  useHotkeys(
    "mod+s",
    (event) => {
      event.preventDefault();
      onSave();
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [onSave],
  );

  useHotkeys(
    "mod+enter",
    (event) => {
      event.preventDefault();
      if (selectedPageIndex !== null) {
        onAppendTtsToPage(selectedPageIndex);
      }
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [onAppendTtsToPage, selectedPageIndex],
  );

  useHotkeys(
    "mod+shift+s",
    (event) => {
      event.preventDefault();
      const target = getHotkeyTarget();
      if (!target) {
        return;
      }

      void onAnalyzeTts(target.pageIndex, target.ttsIndex);
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [onAnalyzeTts],
  );
}
