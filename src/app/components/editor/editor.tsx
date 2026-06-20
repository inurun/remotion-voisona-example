"use client";

import { FormProvider } from "react-hook-form";
import { type SavedProject } from "@/_schemas";
import { ConfigPane } from "@/app/features/editor/config-pane";
import { EditorContextProvider } from "@/app/features/editor/editor-context";
import { EditorPane } from "@/app/features/editor/editor-pane";
import { useEditorForm } from "@/app/features/editor/editor-form";
import { useEditorScreen } from "@/app/features/editor/editor-screen";
import { type useEditorActions } from "@/app/features/editor/editor-actions";
import { type VoiceState } from "@/app/features/voisona/voices";

export default function Editor({
  initialProject,
  voices,
  onLoadVoices,
  editorActions,
}: {
  initialProject: SavedProject;
  voices: VoiceState;
  onLoadVoices: () => Promise<void>;
  editorActions: ReturnType<typeof useEditorActions>;
}) {
  const { form, pageFields, appendPage, createDraftTts, movePage, removePage } = useEditorForm({
    initialProject,
    voiceOptions: voices.options,
  });
  const contextValue = useEditorScreen({
    appendPage,
    createDraftTts,
    editorActions,
    form,
    movePage,
    onLoadVoices,
    pageFields,
    removePage,
    voices,
  });

  return (
    <FormProvider {...form}>
      <EditorContextProvider value={contextValue}>
        <section className="flex flex-col gap-4">
          <EditorPane />
        </section>
        <section className="flex flex-col gap-4 xl:sticky xl:top-6">
          <ConfigPane />
        </section>
      </EditorContextProvider>
    </FormProvider>
  );
}
