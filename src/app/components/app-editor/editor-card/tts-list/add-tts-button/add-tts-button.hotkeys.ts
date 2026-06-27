import { useHotkeys } from "react-hotkeys-hook";
import { useSettings } from "@/app/features/settings";

export function useAddTtsButtonHotkeys(append: () => unknown) {
  const { hotkeys } = useSettings();

  useHotkeys(
    hotkeys.addTts,
    (event) => {
      event.preventDefault();
      append();
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
      enabled: Boolean(hotkeys.addTts),
    },
    [append, hotkeys.addTts],
  );
}
