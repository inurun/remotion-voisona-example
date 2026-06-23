import { Trash2 } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
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
import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";
import { useVoices } from "@/app/contexts/voices-context/voices-context";
import { getVoiceValue } from "@/app/contexts/form-context/form-context";
import { useTtsList } from "@/app/components/app-editor/editor-card/tts-list/tts-list.hook";

function TtsVoiceField({
  index,
  onRemove,
  onSelect,
}: {
  index: number;
  onRemove: () => void;
  onSelect: (index: number) => void;
}) {
  const { control, setValue } = useFormContext<DraftProject>();
  const { selectedPageIndex } = usePage();
  const { options } = useVoices();
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
                onSelect(index);
              }}
            >
              <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                <SelectValue placeholder="Actor" />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
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

function TtsTextField({ index, onFocus }: { index: number; onFocus: (index: number) => void }) {
  const { control, setValue } = useFormContext<DraftProject>();
  const { selectedPageIndex } = usePage();

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
            onFocus={() => onFocus(index)}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}

function TtsBusyBadge({ ttsIndex }: { ttsIndex: number }) {
  const { busyById } = useTts();
  const { selectedPageIndex } = usePage();
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

function TtsItem({
  index,
  onRemove,
  onSelect,
  onFocus,
}: {
  index: number;
  onRemove: () => void;
  onSelect: (index: number) => void;
  onFocus: (index: number) => void;
}) {
  const { selectedTtsIndex } = useTts();

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
      <TtsVoiceField index={index} onRemove={onRemove} onSelect={onSelect} />
      <TtsTextField index={index} onFocus={onFocus} />
    </article>
  );
}

export function TtsList() {
  const { selectedPageIndex, fields, removeTts, selectTtsOnFocus, selectTts } = useTtsList();

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
            onRemove={() => removeTts(index)}
            onSelect={selectTts}
            onFocus={selectTtsOnFocus}
          />
        </div>
      ))}
    </FieldGroup>
  );
}
