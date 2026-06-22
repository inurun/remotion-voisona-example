import { usePage } from "@/app/contexts/page-context/page-context";
import { TsmlEditor } from "@/app/features/editor/tsml-editor";

export function TsmlField() {
  const { selectedPageIndex, selectedTtsIndex } = usePage();

  if (selectedPageIndex === null || selectedTtsIndex === null) {
    return null;
  }

  return (
    <TsmlEditor name={`pages.${selectedPageIndex}.tts.${selectedTtsIndex}.speech.analyzedText`} />
  );
}
