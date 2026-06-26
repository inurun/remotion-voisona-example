import { ConfigCard } from "@/app/components/app-editor/config-card/config-card";
import { EditorCard } from "@/app/components/app-editor/editor-card/editor-card";
import { PreviewCard } from "./preview-card/preview-card";
import { useAppEditorHotkeys } from "@/app/components/app-editor/app-editor.hotkeys";
import { useAppEditor } from "@/app/components/app-editor/app-editor.hook";

export function AppEditor() {
  useAppEditor();
  useAppEditorHotkeys();

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_500px]">
      <section className="flex flex-col gap-4">
        <EditorCard />
      </section>
      <section className="flex flex-col gap-4 xl:sticky xl:top-6">
        <PreviewCard />
        <ConfigCard />
      </section>
    </div>
  );
}
