import { useHotkeys } from "react-hotkeys-hook";
import { useTts } from "@/app/features/tts";
import { getTtsHotkeyTarget } from "@/app/features/tts/lib/tts-hotkey-target";

function getHotkeyTarget() {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLTextAreaElement)) {
    return null;
  }

  return getTtsHotkeyTarget(activeElement.dataset);
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
