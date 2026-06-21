import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldError } from "@/_shared/components/ui/field";
import { type DraftProject } from "@/_schemas";
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { RichTextEditor } from "@/app/features/editor/rich-text-editor";

export function RichTextField() {
  const { control } = useFormContext<DraftProject>();
  const { selectedPageIndex } = useEditor();

  if (selectedPageIndex === null) {
    return null;
  }

  return (
    <Controller
      name={`pages.${selectedPageIndex}.richText`}
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
