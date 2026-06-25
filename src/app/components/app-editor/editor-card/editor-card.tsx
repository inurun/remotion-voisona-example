import { RefreshCw } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { AddTtsButton } from "@/app/components/app-editor/editor-card/add-tts-button/add-tts-button";
import { AppendPageButton } from "@/app/components/app-editor/editor-card/append-page-button/append-page-button";
import { PageList } from "@/app/components/app-editor/editor-card/page-list/page-list";
import { RichTextField } from "@/app/components/app-editor/editor-card/rich-text-field/rich-text-field";
import { SelectedPageHeader } from "@/app/components/app-editor/editor-card/selected-page-header/selected-page-header";
import { TtsList } from "@/app/components/app-editor/editor-card/tts-list/tts-list";
import { usePage } from "@/app/features/page";
import { useVoices } from "@/app/features/voices";

function VoicesStatusChip() {
  const { options } = useVoices();

  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
      {`${options.length} voices`}
    </span>
  );
}

function ReloadVoicesButton() {
  const { loadVoices } = useVoices();

  return (
    <Button
      type="button"
      size="icon"
      title="voices 再取得"
      aria-label="voices 再取得"
      variant="outline"
      onClick={() => void loadVoices()}
    >
      <RefreshCw />
    </Button>
  );
}

export function EditorCard() {
  const { pageFields, selectedPageIndex } = usePage();

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
