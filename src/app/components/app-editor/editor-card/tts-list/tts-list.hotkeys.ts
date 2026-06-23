import { useHotkeys } from "react-hotkeys-hook";
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

export function useTtsListHotkeys() {
  const { analyze } = useTts();

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
