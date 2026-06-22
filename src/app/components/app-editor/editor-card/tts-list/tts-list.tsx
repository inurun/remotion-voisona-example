import { Trash2 } from "lucide-react";
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
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { getVoiceValue } from "@/app/features/editor/editor-form";

function TtsVoiceField({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { control, setValue } = useFormContext<DraftProject>();
  const { onSelectTts, selectedPageIndex, voiceSelectOptions } = useEditor();
  const pageIndex = selectedPageIndex ?? 0;
  const voiceVersion = useWatch({
    control,
    name: `pages.${pageIndex}.tts.${index}.voiceVersion`,
  });

  if (selectedPageIndex === null) {
    return null;
  }

  return (
    <Controller
      name={`pages.${selectedPageIndex}.tts.${index}.voiceName`}
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
                if (!value) {
                  return;
                }

                const [nextVoiceName, nextVoiceVersion] = value.split("::");
                controllerField.onChange(nextVoiceName ?? "");
                setValue(
                  `pages.${selectedPageIndex}.tts.${index}.voiceVersion`,
                  nextVoiceVersion ?? "",
                  { shouldDirty: true },
                );
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

function TtsTextField({ index }: { index: number }) {
  const { control, setValue } = useFormContext<DraftProject>();
  const { onSelectTts, selectedPageIndex } = useEditor();

  if (selectedPageIndex === null) {
    return null;
  }

  return (
    <Controller
      name={`pages.${selectedPageIndex}.tts.${index}.text`}
      control={control}
      render={({ field: controllerField, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <Textarea
            {...controllerField}
            value={controllerField.value ?? ""}
            data-page-index={selectedPageIndex}
            data-tts-index={index}
            data-tts-hotkey-target="text"
            aria-invalid={fieldState.invalid}
            placeholder="Text"
            rows={3}
            onChange={(event) => {
              const nextText = event.target.value;
              controllerField.onChange(nextText);
              setValue(`pages.${selectedPageIndex}.tts.${index}.readText`, nextText, {
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

function TtsBusyBadge({ ttsIndex }: { ttsIndex: number }) {
  const { busyById, selectedPageIndex } = useEditor();
  const { control } = useFormContext<DraftProject>();
  const pageIndex = selectedPageIndex ?? 0;
  const itemId = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.id` });

  if (selectedPageIndex === null) {
    return null;
  }

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

function TtsItem({ index, onRemove }: { index: number; onRemove: () => void }) {
  const { selectedTtsIndex } = useEditor();

  return (
    <article
      className={cn(
        "grid gap-2 rounded-xl px-3 py-3",
        selectedTtsIndex === index ? "bg-muted/20" : "bg-card",
      )}
    >
      <div className="flex items-center gap-3">
        <TtsBusyBadge ttsIndex={index} />
      </div>
      <TtsVoiceField index={index} onRemove={onRemove} />
      <TtsTextField index={index} />
    </article>
  );
}

export function TtsList() {
  const { control } = useFormContext<DraftProject>();
  const { onSelectTts, selectedPageIndex, selectedTtsIndex } = useEditor();
  const pageIndex = selectedPageIndex ?? 0;
  const { fields, remove } = useFieldArray({
    control,
    keyName: "fieldKey",
    name: `pages.${pageIndex}.tts`,
  });

  useEffect(() => {
    if (selectedPageIndex === null) {
      return;
    }

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
  }, [fields.length, onSelectTts, selectedPageIndex, selectedTtsIndex]);

  if (selectedPageIndex === null) {
    return null;
  }

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
