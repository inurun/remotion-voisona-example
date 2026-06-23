import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";
import { TsmlEditor } from "@/app/features/editor/tsml-editor";

export function TsmlField() {
  const { selectedPageIndex } = usePage();
  const { selectedTtsIndex } = useTts();

  if (selectedPageIndex === null || selectedTtsIndex === null) {
    return null;
  }

  return (
    <TsmlEditor name={`pages.${selectedPageIndex}.tts.${selectedTtsIndex}.speech.analyzedText`} />
  );
}
