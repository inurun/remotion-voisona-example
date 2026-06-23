import { useHotkeys } from "react-hotkeys-hook";
import { useFormContext } from "react-hook-form";
import type { DraftProject } from "@/_schemas";
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";

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
  const form = useFormContext<DraftProject>();
  const { save: onSave } = useEditor();
  const { selectedPageIndex, setSelectedPageIndex } = usePage();
  const { appendToPage, selectTts, analyze, selectedTtsIndex } = useTts();

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
      if (selectedPageIndex === null) {
        return;
      }

      const page = form.getValues(`pages.${selectedPageIndex}`);
      const sourceTts = selectedTtsIndex !== null ? page?.tts[selectedTtsIndex] : undefined;
      const result = appendToPage(selectedPageIndex, sourceTts);
      if (!result) {
        return;
      }

      setSelectedPageIndex(result.pageIndex);
      selectTts(result.ttsIndex);
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [appendToPage, form, selectTts, selectedPageIndex, selectedTtsIndex, setSelectedPageIndex],
  );

  useHotkeys(
    "mod+shift+s",
    (event) => {
      event.preventDefault();
      const target = getHotkeyTarget();
      if (!target) {
        return;
      }

      void analyze(target.pageIndex, target.ttsIndex);
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [analyze],
  );
}
