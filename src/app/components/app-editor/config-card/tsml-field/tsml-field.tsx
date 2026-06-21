import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { TsmlEditor } from "@/app/features/editor/tsml-editor";

export function TsmlField() {
  const { selectedPageIndex, selectedTtsIndex } = useEditor();

  if (selectedPageIndex === null || selectedTtsIndex === null) {
    return null;
  }

  return (
    <TsmlEditor name={`pages.${selectedPageIndex}.tts.${selectedTtsIndex}.speech.analyzedText`} />
  );
}
