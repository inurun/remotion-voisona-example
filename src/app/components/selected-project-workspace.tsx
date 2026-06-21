import { useCallback } from "react";
import { toast } from "sonner";
import type { DraftProject, SavedProject } from "@/_schemas";
import { AppHeader } from "@/app/components/app-header/app-header";
import { useEditorActions } from "@/app/features/editor/editor-actions";
import { useEditorForm } from "@/app/features/editor/editor-form";
import { useEditorScreen } from "@/app/features/editor/editor-screen";
import { useProject } from "@/app/features/project/project.swr";
import { useVoices } from "@/app/features/voisona/voices";
import { useToastError } from "../hooks/use-toast-error";
import { FormProvider } from "react-hook-form";
import { EditorContextProvider } from "../features/editor/editor-context";
import { EditorPane } from "../features/editor/editor-pane";
import { PlayerCard } from "./player-card";
import { ConfigPane } from "../features/editor/config-pane";

function getToastMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function ProjectWorkspace({
  loadVoices,
  project,
  voices,
}: {
  loadVoices: () => Promise<void>;
  project: SavedProject;
  voices: ReturnType<typeof useVoices>["voices"];
}) {
  const { form, pageFields, appendPage, createDraftTts, movePage, removePage } = useEditorForm({
    initialProject: project,
    voiceOptions: voices.options,
  });
  const editorActions = useEditorActions({
    onError: (message) => {
      toast.error(message);
    },
    onSuccess: (message) => {
      toast.success(message);
    },
  });

  const saveCurrentProject = useCallback(
    async (draftProject: DraftProject) => {
      return toast.promise(editorActions.saveProject(draftProject), {
        loading: "保存中...",
        success: "保存して音声を更新した。",
        error: (error) => getToastMessage(error, "Save failed"),
      });
    },
    [editorActions],
  );

  const editorContextValue = useEditorScreen({
    appendPage,
    createDraftTts,
    editorActions,
    form,
    movePage,
    onLoadVoices: loadVoices,
    pageFields,
    removePage,
    saveProject: saveCurrentProject,
    voices,
  });

  return (
    <FormProvider {...form}>
      <EditorContextProvider value={editorContextValue}>
        <AppHeader />

        {/* Editor */}
        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_500px]">
          <section className="flex flex-col gap-4">
            <EditorPane />
          </section>
          <section className="flex flex-col gap-4 xl:sticky xl:top-6">
            <PlayerCard project={project} />
            <ConfigPane />
          </section>
        </div>
      </EditorContextProvider>
    </FormProvider>
  );
}

export function SelectedProjectWorkspace({ projectPath }: { projectPath: string | null }) {
  const { voices, loadVoices } = useVoices();
  const { project, projectError } = useProject(projectPath);

  useToastError(projectPath ? projectError : null, "project-load-error");
  useToastError(voices.status === "error" ? voices.error : null, "voices-load-error");

  if (!project) {
    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-2 p-2">
      <ProjectWorkspace loadVoices={loadVoices} project={project} voices={voices} />
    </main>
  );
}
