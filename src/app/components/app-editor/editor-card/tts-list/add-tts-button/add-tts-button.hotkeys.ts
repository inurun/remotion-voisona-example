import { useHotkeys } from "react-hotkeys-hook";

export function useAddTtsButtonHotkeys(append: () => unknown) {
  useHotkeys(
    "mod+enter",
    (event) => {
      event.preventDefault();
      append();
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [append],
  );
}
