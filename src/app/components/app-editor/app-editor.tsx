import { ConfigCard } from "@/app/components/app-editor/config-card/config-card";
import { EditorCard } from "@/app/components/app-editor/editor-card/editor-card";
import { PlayerCard } from "./player-card/player-card";
import { useAppEditorHotkeys } from "@/app/components/app-editor/app-editor.hotkeys";
import { useEditorSelectionSync } from "@/app/hooks/use-editor-selection-sync";

export function AppEditor() {
  useEditorSelectionSync();
  useAppEditorHotkeys();

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_500px]">
      <section className="flex flex-col gap-4">
        <EditorCard />
      </section>
      <section className="flex flex-col gap-4 xl:sticky xl:top-6">
        <PlayerCard />
        <ConfigCard />
      </section>
    </div>
  );
}
