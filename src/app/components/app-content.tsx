import type { DraftProject, SavedProject } from "@/_schemas";
import { PlayerCard } from "@/app/components/player-card";
import { ConfigPane } from "@/app/features/editor/config-pane";
import {
  EditorContextProvider,
  type EditorContextValue,
} from "@/app/features/editor/editor-context";
import { EditorPane } from "@/app/features/editor/editor-pane";
import { FormProvider, type UseFormReturn } from "react-hook-form";

type AppContentProps = {
  editorContextValue: EditorContextValue;
  form: UseFormReturn<DraftProject>;
  project: SavedProject;
};

export function AppContent({ editorContextValue, form, project }: AppContentProps) {
  return (
    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_500px]">
      <FormProvider {...form}>
        <EditorContextProvider value={editorContextValue}>
          <section className="flex flex-col gap-4">
            <EditorPane />
          </section>
          <section className="flex flex-col gap-4 xl:sticky xl:top-6">
            <PlayerCard project={project} />
            <ConfigPane />
          </section>
        </EditorContextProvider>
      </FormProvider>
    </div>
  );
}
