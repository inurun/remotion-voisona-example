import { Sparkles, Volume2 } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/_shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { Field, FieldError } from "@/_shared/components/ui/field";
import { Input } from "@/_shared/components/ui/input";
import { type DraftProject } from "@/_schemas";
import { useEditorContext } from "@/app/features/editor/editor-context";
import { TsmlEditor } from "@/app/features/editor/tsml-editor";

function isVoiceActionDisabled({
  busy,
  canRunTts,
  text,
  voiceName,
}: {
  busy?: string;
  canRunTts: boolean;
  text?: string;
  voiceName?: string;
}) {
  if (isUnavailable(canRunTts, busy)) {
    return true;
  }

  if (!hasVoiceActionText(text)) {
    return true;
  }

  return !voiceName;
}

function isUnavailable(canRunTts: boolean, busy?: string) {
  return !canRunTts || Boolean(busy);
}

function hasVoiceActionText(text?: string) {
  return Boolean((text ?? "").trim());
}

function AnalyzeButton({
  busy,
  disabled,
  onClick,
}: {
  busy?: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      disabled={disabled}
      onClick={onClick}
      title={busy === "analyze" ? "Analyzing" : "Analyze"}
      aria-label={busy === "analyze" ? "Analyzing" : "Analyze"}
    >
      <Sparkles className={busy === "analyze" ? "animate-pulse" : undefined} />
    </Button>
  );
}

function PreviewButton({
  busy,
  disabled,
  onClick,
}: {
  busy?: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      title={busy === "preview" ? "Previewing" : "Preview"}
      aria-label={busy === "preview" ? "Previewing" : "Preview"}
    >
      <Volume2 className={busy === "preview" ? "animate-pulse" : undefined} />
    </Button>
  );
}

function ConfigActions({
  busy,
  pageIndex,
  text,
  ttsIndex,
  voiceName,
}: {
  busy?: string;
  pageIndex: number;
  text?: string;
  ttsIndex: number;
  voiceName?: string;
}) {
  const { canRunTts, onAnalyzeTts, onPreviewTts } = useEditorContext();
  const disabled = isVoiceActionDisabled({ busy, canRunTts, text, voiceName });

  return (
    <div className="flex flex-wrap gap-2">
      <AnalyzeButton
        busy={busy}
        disabled={disabled}
        onClick={() => void onAnalyzeTts(pageIndex, ttsIndex)}
      />
      <PreviewButton
        busy={busy}
        disabled={disabled}
        onClick={() => void onPreviewTts(pageIndex, ttsIndex)}
      />
    </div>
  );
}

function ConfigPaneContent({ pageIndex, ttsIndex }: { pageIndex: number; ttsIndex: number }) {
  const { busyById } = useEditorContext();
  const { control } = useFormContext<DraftProject>();
  const itemId = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.id` });
  const text = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.text` });
  const voiceName = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.voiceName` });
  const busy = itemId ? busyById[itemId] : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Config</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Controller
          name={`pages.${pageIndex}.tts.${ttsIndex}.readText`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Input
                {...field}
                value={field.value ?? ""}
                aria-invalid={fieldState.invalid}
                placeholder="Read"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <ConfigActions
          busy={busy}
          pageIndex={pageIndex}
          text={text}
          ttsIndex={ttsIndex}
          voiceName={voiceName}
        />
        <TsmlEditor name={`pages.${pageIndex}.tts.${ttsIndex}.speech.analyzedText`} />
      </CardContent>
    </Card>
  );
}

function getSelectedConfigTarget(
  pageFields: ReturnType<typeof useEditorContext>["pageFields"],
  selectedPageIndex: number | null,
  selectedTtsIndex: number | null,
) {
  if (selectedPageIndex === null || selectedTtsIndex === null) {
    return null;
  }

  const selectedPage = pageFields[selectedPageIndex];
  return selectedPage?.tts[selectedTtsIndex]
    ? { pageIndex: selectedPageIndex, ttsIndex: selectedTtsIndex }
    : null;
}

export function ConfigPane() {
  const { pageFields, selectedPageIndex, selectedTtsIndex } = useEditorContext();
  const target = getSelectedConfigTarget(pageFields, selectedPageIndex, selectedTtsIndex);

  if (!target) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Config</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            tts を選ぶと Read と TSML を編集できる。
          </div>
        </CardContent>
      </Card>
    );
  }

  return <ConfigPaneContent pageIndex={target.pageIndex} ttsIndex={target.ttsIndex} />;
}
