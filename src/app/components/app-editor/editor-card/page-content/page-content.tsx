import { Controller, useFormContext } from "react-hook-form";
import { Field, FieldError } from "@/_shared/components/ui/field";
import { RichTextEditor } from "@/_shared/components/ui/rich-text-editor/rich-text-editor";
import { type DraftProject } from "@/_schemas";
import { usePage } from "@/app/features/page";
import { uploadImage } from "@/app/features/uploads";

export function PageContent() {
  const { control } = useFormContext<DraftProject>();
  const { selectedPageIndex } = usePage();

  if (selectedPageIndex === null) {
    return null;
  }

  return (
    <Controller
      name={`pages.${selectedPageIndex}.richText`}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className="grid gap-2">
          <RichTextEditor
            value={field.value ?? ""}
            onChange={field.onChange}
            uploadImage={uploadImage}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
