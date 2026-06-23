import { Card, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";
import { ConfigActions } from "@/app/components/app-editor/config-card/config-actions/config-actions";
import { ReadTextField } from "@/app/components/app-editor/config-card/read-text-field/read-text-field";
import { TsmlField } from "@/app/components/app-editor/config-card/tsml-field/tsml-field";

export function ConfigCard() {
  const { pageFields, selectedPageIndex } = usePage();
  const { selectedTtsIndex } = useTts();
  const selectedTts =
    selectedPageIndex !== null && selectedTtsIndex !== null
      ? pageFields[selectedPageIndex]?.tts[selectedTtsIndex]
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Config</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!selectedTts ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            tts を選ぶと Read と TSML を編集できる。
          </div>
        ) : (
          <div className="grid gap-4">
            <ReadTextField />
            <ConfigActions />
            <TsmlField />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
