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
import { Textarea } from "@/_shared/components/ui/textarea";
import { type DraftProject } from "@/_schemas";
import { cn } from "@/_shared/lib/utils";
import { usePage } from "@/app/features/page";
import { useTts } from "@/app/features/tts";
import { useSettings } from "@/app/features/settings";
import { getVoiceValue } from "@/app/features/editor";
import { useTtsList } from "@/app/components/app-editor/editor-card/tts-list/use-tts-list";
import { useTtsListHotkeys } from "@/app/components/app-editor/editor-card/tts-list/tts-list.hotkeys";
import { AddTtsButton } from "./add-tts-button/add-tts-button";

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
  const { options } = useSettings();
  const pageIndex = selectedPageIndex ?? 0;
  const selectItems = options.map((option) => ({
    value: getVoiceValue(option),
    label: option.displayName,
  }));
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
              items={selectItems}
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
                  <SelectItem key={getVoiceValue(option)} value={getVoiceValue(option)}>
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
    <article className={cn("grid gap-2", selectedTtsIndex === index ? "bg-muted/20" : "bg-card")}>
      <TtsVoiceField index={index} onRemove={onRemove} onSelect={onSelect} />
      <TtsTextField index={index} onFocus={onFocus} />
    </article>
  );
}

export function TtsList() {
  const { selectedPageIndex, fields, removeTts, selectTtsOnFocus, selectTts } = useTtsList();
  useTtsListHotkeys();

  if (selectedPageIndex === null) {
    return null;
  }

  if (fields.length === 0) {
    return null;
  }

  return (
    <FieldGroup className="gap-2 relative">
      <AddTtsButton />
      {fields.map((field, index) => (
        <div key={field.fieldKey} className="grid pb-10">
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
