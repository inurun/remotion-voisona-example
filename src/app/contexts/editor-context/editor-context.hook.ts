import { useCallback } from "react";
import { toast } from "sonner";
import type { DraftPage, DraftProject, DraftTts, SavedProject, VoiceOption } from "@/_schemas";
import { useVoices } from "@/app/contexts/voices-context/voices-context";
import { useEditorActions } from "@/app/features/editor/editor-actions";
import { useEditorForm } from "@/app/features/editor/editor-form";
import { useEditorScreen } from "@/app/features/editor/editor-screen";

export type EditorContextValue = {
  busyById: Record<string, string>;
  canRunTts: boolean;
  pageFields: Array<DraftPage & { fieldKey: string }>;
  saving: boolean;
  selectedPageIndex: number | null;
  selectedTtsIndex: number | null;
  voiceSelectOptions: VoiceOption[];
  onAnalyzeTts: (pageIndex: number, ttsIndex: number) => Promise<void>;
  onAppendPage: () => void;
  onAppendTtsToPage: (pageIndex: number) => void;
  onMovePageDown: (index: number) => void;
  onMovePageUp: (index: number) => void;
  onPreviewTts: (pageIndex: number, ttsIndex: number) => Promise<void>;
  onRemovePage: (index: number) => void;
  onSave: () => void;
  onSelectPage: (index: number) => void;
  onSelectTts: (index: number | null) => void;
  onLoadVoices: () => Promise<void>;
  createDraftTts: () => DraftTts;
};

export function useEditorProviderValue(project: SavedProject) {
  const { options, loadVoices } = useVoices();
  const { form, pageFields, appendPage, createDraftTts, movePage, removePage } = useEditorForm({
    initialProject: project,
    voiceOptions: options,
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
        error: "Save failed",
      });
    },
    [editorActions],
  );

  const value = useEditorScreen({
    appendPage,
    createDraftTts,
    editorActions,
    form,
    movePage,
    onLoadVoices: loadVoices,
    pageFields,
    removePage,
    saveProject: saveCurrentProject,
    voiceOptions: options,
  });

  return {
    form,
    value,
  };
}
