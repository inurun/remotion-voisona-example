import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/_shared/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/_shared/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_shared/components/ui/select";
import { Separator } from "@/_shared/components/ui/separator";
import { Textarea } from "@/_shared/components/ui/textarea";
import { type DraftProject } from "@/_schemas";
import { cn } from "@/_shared/lib/utils";
import { useEditorContext } from "@/app/features/editor/editor-context";
import { getVoiceValue } from "@/app/features/editor/editor-form";
import { RichTextEditor } from "@/app/features/editor/rich-text-editor";

function TtsVoiceField({
  index,
  pageIndex,
  onRemove,
}: {
  index: number;
  pageIndex: number;
  onRemove: () => void;
}) {
  const { control, setValue } = useFormContext<DraftProject>();
  const { onSelectTts, voiceSelectOptions } = useEditorContext();
  const voiceVersion = useWatch({ control, name: `pages.${pageIndex}.tts.${index}.voiceVersion` });

  return (
    <Controller
      name={`pages.${pageIndex}.tts.${index}.voiceName`}
      control={control}
      render={({ field: controllerField, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <div className="flex gap-2">
            <Select
              name={controllerField.name}
              value={getVoiceValue({
                voiceName: controllerField.value ?? "",
                voiceVersion: voiceVersion ?? "",
              })}
              onValueChange={(value) => {
                const [nextVoiceName, nextVoiceVersion] = value.split("::");
                controllerField.onChange(nextVoiceName ?? "");
                setValue(`pages.${pageIndex}.tts.${index}.voiceVersion`, nextVoiceVersion ?? "", {
                  shouldDirty: true,
                });
                onSelectTts(index);
              }}
            >
              <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                <SelectValue placeholder="Actor" />
              </SelectTrigger>
              <SelectContent>
                {voiceSelectOptions.map((option) => (
                  <SelectItem
                    key={`${option.voiceName}:${option.voiceVersion ?? ""}`}
                    value={`${option.voiceName}::${option.voiceVersion ?? ""}`}
                  >
                    {option.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={onRemove}
              title="削除"
              aria-label="削除"
            >
              <Trash2 />
            </Button>
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function TtsTextField({ index, pageIndex }: { index: number; pageIndex: number }) {
  const { control, setValue } = useFormContext<DraftProject>();
  const { onSelectTts } = useEditorContext();

  return (
    <Controller
      name={`pages.${pageIndex}.tts.${index}.text`}
      control={control}
      render={({ field: controllerField, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <Textarea
            {...controllerField}
            value={controllerField.value ?? ""}
            data-page-index={pageIndex}
            data-tts-index={index}
            data-tts-hotkey-target="text"
            aria-invalid={fieldState.invalid}
            placeholder="Text"
            rows={3}
            onChange={(event) => {
              const nextText = event.target.value;
              controllerField.onChange(nextText);
              setValue(`pages.${pageIndex}.tts.${index}.readText`, nextText, {
                shouldDirty: true,
              });
            }}
            onFocus={() => onSelectTts(index)}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function TtsBusyBadge({ pageIndex, ttsIndex }: { pageIndex: number; ttsIndex: number }) {
  const { busyById } = useEditorContext();
  const { control } = useFormContext<DraftProject>();
  const itemId = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.id` });
  const busy = itemId ? busyById[itemId] : undefined;

  if (!busy) {
    return null;
  }

  return (
    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
      {busy}
    </span>
  );
}

function TtsItem({
  index,
  pageIndex,
  onRemove,
}: {
  index: number;
  pageIndex: number;
  onRemove: () => void;
}) {
  const { selectedTtsIndex } = useEditorContext();

  return (
    <article
      className={cn(
        "grid gap-2 rounded-xl px-3 py-3",
        selectedTtsIndex === index ? "bg-muted/20" : "bg-card",
      )}
    >
      <div className="flex items-center gap-3">
        <TtsBusyBadge pageIndex={pageIndex} ttsIndex={index} />
      </div>
      <TtsVoiceField index={index} pageIndex={pageIndex} onRemove={onRemove} />
      <TtsTextField index={index} pageIndex={pageIndex} />
    </article>
  );
}

function TtsList({ pageIndex }: { pageIndex: number }) {
  const { control } = useFormContext<DraftProject>();
  const { onSelectTts, selectedTtsIndex } = useEditorContext();
  const { fields, remove } = useFieldArray({
    control,
    keyName: "fieldKey",
    name: `pages.${pageIndex}.tts`,
  });

  useEffect(() => {
    if (fields.length === 0) {
      onSelectTts(null);
      return;
    }

    if (selectedTtsIndex === null) {
      onSelectTts(0);
      return;
    }

    if (selectedTtsIndex >= fields.length) {
      onSelectTts(fields.length - 1);
    }
  }, [fields.length, onSelectTts, selectedTtsIndex]);

  if (fields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        tts がない。追加して開始。
      </div>
    );
  }

  return (
    <FieldGroup className="gap-2">
      {fields.map((field, index) => (
        <div key={field.fieldKey} className="grid">
          {index > 0 ? <Separator className="bg-border/70" /> : null}
          <TtsItem
            index={index}
            pageIndex={pageIndex}
            onRemove={() => {
              onSelectTts(fields.length <= 1 ? null : Math.min(index, fields.length - 2));
              remove(index);
            }}
          />
        </div>
      ))}
    </FieldGroup>
  );
}

function SelectedPageHeader({ pageIndex }: { pageIndex: number }) {
  const { onMovePageDown, onMovePageUp, onRemovePage, pageFields } = useEditorContext();

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-muted-foreground">Page {pageIndex + 1}</div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={pageIndex === 0}
          title="上へ"
          aria-label="上へ"
          onClick={() => onMovePageUp(pageIndex)}
        >
          <ArrowUp />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          disabled={pageIndex === pageFields.length - 1}
          title="下へ"
          aria-label="下へ"
          onClick={() => onMovePageDown(pageIndex)}
        >
          <ArrowDown />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant="destructive"
          title="削除"
          aria-label="削除"
          onClick={() => onRemovePage(pageIndex)}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

function RichTextField({ pageIndex }: { pageIndex: number }) {
  const { control } = useFormContext<DraftProject>();

  return (
    <Controller
      name={`pages.${pageIndex}.richText`}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="grid gap-2">
          <RichTextEditor value={field.value ?? ""} onChange={field.onChange} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function AddTtsButton({ pageIndex }: { pageIndex: number }) {
  const { onAppendTtsToPage } = useEditorContext();

  return (
    <div className="flex justify-end">
      <Button
        type="button"
        size="icon"
        variant="secondary"
        title="TTS 追加"
        aria-label="TTS 追加"
        onClick={() => onAppendTtsToPage(pageIndex)}
      >
        <Plus />
      </Button>
    </div>
  );
}

function SelectedPageEditorContent({ pageIndex }: { pageIndex: number }) {
  return (
    <div className="grid gap-4">
      <SelectedPageHeader pageIndex={pageIndex} />
      <RichTextField pageIndex={pageIndex} />
      <AddTtsButton pageIndex={pageIndex} />
      <TtsList pageIndex={pageIndex} />
    </div>
  );
}

export function SelectedPageEditor() {
  const { pageFields, selectedPageIndex } = useEditorContext();

  if (pageFields.length === 0 || selectedPageIndex === null) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        ページを選ぶと本文と tts を編集できる。
      </div>
    );
  }

  const selectedPage = pageFields[selectedPageIndex];
  if (!selectedPage) {
    return null;
  }

  return <SelectedPageEditorContent key={selectedPage.id} pageIndex={selectedPageIndex} />;
}
