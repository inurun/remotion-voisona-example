"use client";

import { FilePlus2, RefreshCw, Save } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { cn } from "@/_shared/lib/utils";
import { useEditorContext } from "@/app/features/editor/editor-context";
import { SelectedPageEditor } from "@/app/features/editor/selected-page-editor";

function VoicesStatusChip() {
  const { voices } = useEditorContext();

  return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
      {getVoicesStatusLabel(voices)}
    </span>
  );
}

function getVoicesStatusLabel(voices: ReturnType<typeof useEditorContext>["voices"]) {
  if (voices.status === "loading") {
    return "voices loading";
  }

  if (voices.status === "ready") {
    return `${voices.options.length} voices`;
  }

  return "voices unavailable";
}

function ReloadVoicesButton() {
  const { onLoadVoices, voices } = useEditorContext();

  return (
    <Button
      type="button"
      size="icon"
      title="voices 再取得"
      aria-label="voices 再取得"
      variant="outline"
      onClick={() => void onLoadVoices()}
    >
      <RefreshCw className={voices.status === "loading" ? "animate-spin" : undefined} />
    </Button>
  );
}

function AppendPageButton() {
  const { onAppendPage } = useEditorContext();

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

function SaveButton() {
  const { canRunTts, onSave, pageFields, saving } = useEditorContext();
  const disabled = !canRunTts || pageFields.length === 0;
  const label = saving ? "Saving" : "Save";

  return (
    <Button
      type="button"
      disabled={disabled}
      size="icon"
      onClick={onSave}
      title={label}
      aria-label={label}
    >
      <Save className={saving ? "animate-pulse" : undefined} />
    </Button>
  );
}

function EditorToolbar() {
  return (
    <CardAction className="flex flex-wrap items-center justify-end gap-2">
      <VoicesStatusChip />
      <ReloadVoicesButton />
      <AppendPageButton />
      <SaveButton />
    </CardAction>
  );
}

function EditorFeedback() {
  const { error, message, voices } = useEditorContext();

  return (
    <>
      {voices.status === "error" ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {voices.error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </>
  );
}

function PageList() {
  const { onSelectPage, pageFields, selectedPageIndex } = useEditorContext();

  if (pageFields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        ページがない。追加して開始。
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {pageFields.map((field, index) => (
        <button
          key={field.fieldKey}
          type="button"
          onClick={() => onSelectPage(index)}
          className={cn(
            "grid cursor-pointer gap-2 rounded-xl border p-3 text-left transition-colors",
            selectedPageIndex === index ? "border-primary bg-primary/8" : "border-border bg-card",
          )}
        >
          <div className="grid gap-1">
            <div className="text-xs text-muted-foreground">Page {index + 1}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function EditorPane() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl">Editor</CardTitle>
          <EditorToolbar />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <EditorFeedback />
        <div className="grid gap-4">
          <PageList />
          <SelectedPageEditor />
        </div>
      </CardContent>
    </Card>
  );
}
