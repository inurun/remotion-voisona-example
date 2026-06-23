import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldError } from "@/_shared/components/ui/field";
import { Input } from "@/_shared/components/ui/input";
import { type DraftProject } from "@/_schemas";
import { usePage } from "@/app/contexts/page-context/page-context";
import { useTts } from "@/app/contexts/tts-context/tts-context";

export function ReadTextField() {
  const { control } = useFormContext<DraftProject>();
  const { selectedPageIndex } = usePage();
  const { selectedTtsIndex } = useTts();

  if (selectedPageIndex === null || selectedTtsIndex === null) {
    return null;
  }

  return (
    <Controller
      name={`pages.${selectedPageIndex}.tts.${selectedTtsIndex}.readText`}
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
  );
}
