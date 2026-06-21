import { FilePlus2, RefreshCw } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { AddTtsButton } from "@/app/components/app-editor/editor-card/add-tts-button/add-tts-button";
import { PageList } from "@/app/components/app-editor/editor-card/page-list/page-list";
import { RichTextField } from "@/app/components/app-editor/editor-card/rich-text-field/rich-text-field";
import { SelectedPageHeader } from "@/app/components/app-editor/editor-card/selected-page-header/selected-page-header";
import { TtsList } from "@/app/components/app-editor/editor-card/tts-list/tts-list";

function VoicesStatusChip() {
  const { voiceSelectOptions } = useEditor();

  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
      {`${voiceSelectOptions.length} voices`}
    </span>
  );
}

function ReloadVoicesButton() {
  const { onLoadVoices } = useEditor();

  return (
    <Button
      type="button"
      size="icon"
      title="voices 再取得"
      aria-label="voices 再取得"
      variant="outline"
      onClick={() => void onLoadVoices()}
    >
      <RefreshCw />
    </Button>
  );
}

function AppendPageButton() {
  const { onAppendPage } = useEditor();

  return (
    <Button
      type="button"
      size="icon"
      title="ページ追加"
      aria-label="ページ追加"
      variant="secondary"
      onClick={onAppendPage}
    >
      <FilePlus2 />
    </Button>
  );
}

export function EditorCard() {
  const { pageFields, selectedPageIndex } = useEditor();
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl">Editor</CardTitle>
          <CardAction className="flex flex-wrap items-center justify-end gap-2">
            <VoicesStatusChip />
            <ReloadVoicesButton />
            <AppendPageButton />
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-4">
          <PageList />
          {selectedPageIndex !== null && pageFields[selectedPageIndex] && (
            <div key={pageFields[selectedPageIndex].id} className="grid gap-4">
              <SelectedPageHeader />
              <RichTextField />
              <AddTtsButton />
              <TtsList />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
