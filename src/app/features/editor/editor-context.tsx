import { createContext, createElement, useContext } from "react";
import { type DraftPage, type DraftTts } from "@/_schemas";
import { type VoiceState } from "@/app/features/voisona/voices";

export type EditorContextValue = {
  busyById: Record<string, string>;
  canRunTts: boolean;
  pageFields: Array<DraftPage & { fieldKey: string }>;
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
  saving: boolean;
  selectedPageIndex: number | null;
  selectedTtsIndex: number | null;
  createDraftTts: () => DraftTts;
  voiceSelectOptions: VoiceState["options"];
  voices: VoiceState;
  onLoadVoices: () => Promise<void>;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorContextProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: EditorContextValue;
}) {
  return createElement(EditorContext.Provider, { value }, children);
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("EditorContext is missing");
  }
  return context;
}
