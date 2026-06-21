"use client";

import { useEffect, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import type { UseFormReturn } from "react-hook-form";
import { type DraftPage, type DraftProject, type DraftTts } from "@/_schemas";
import { type EditorContextValue } from "@/app/features/editor/editor-context";
import { getVoiceValue } from "@/app/features/editor/editor-form";
import { type useEditorActions } from "@/app/features/editor/editor-actions";
import { type VoiceState } from "@/app/features/voisona/voices";

type EditorActions = ReturnType<typeof useEditorActions>;

type PendingTextFocus = {
  pageIndex: number;
  ttsIndex: number;
};

type UseEditorScreenParams = {
  appendPage: () => void;
  createDraftTts: () => DraftTts;
  editorActions: EditorActions;
  form: UseFormReturn<DraftProject>;
  movePage: (from: number, to: number) => void;
  onLoadVoices: () => Promise<void>;
  pageFields: Array<DraftPage & { fieldKey: string }>;
  removePage: (index: number) => void;
  voices: VoiceState;
};

function getItemBusyReason(busyById: Record<string, string>, item: DraftTts | undefined) {
  return item ? busyById[item.id] : undefined;
}

function hasRunnableTtsFields(item: DraftTts) {
  return Boolean((item.text ?? "").trim() && item.voiceName);
}

function canAnalyzeItem(
  canRunTts: boolean,
  item: DraftTts | undefined,
  busyById: Record<string, string>,
) {
  if (!canRunTts || !item) {
    return false;
  }

  if (!hasRunnableTtsFields(item)) {
    return false;
  }

  return !getItemBusyReason(busyById, item);
}

function getNextRemovedPageSelection(current: number | null, index: number, nextLength: number) {
  if (current === null) {
    return null;
  }

  if (index !== current) {
    return current + getRemovedPageOffset(index, current);
  }

  return getFallbackSelectedPageIndex(index, nextLength);
}

function getRemovedPageOffset(index: number, current: number) {
  return index < current ? -1 : 0;
}

function getFallbackSelectedPageIndex(index: number, nextLength: number) {
  if (nextLength === 0) {
    return null;
  }

  return Math.min(index, nextLength - 1);
}

function getSelectedSourceTts(
  page: DraftPage,
  pageIndex: number,
  selectedPageIndex: number | null,
  selectedTtsIndex: number | null,
) {
  return pageIndex === selectedPageIndex && selectedTtsIndex !== null
    ? page.tts[selectedTtsIndex]
    : undefined;
}

function applyCopiedVoice(nextItem: DraftTts, sourceTts: DraftTts | undefined) {
  const nextVoiceValue = sourceTts ? getVoiceValue(sourceTts) : null;
  if (!nextVoiceValue) {
    return;
  }

  const [voiceName = "", voiceVersion = ""] = nextVoiceValue.split("::");
  nextItem.voiceName = voiceName;
  nextItem.voiceVersion = voiceVersion;
}

function focusTextArea(
  form: UseFormReturn<DraftProject>,
  pendingTextFocus: PendingTextFocus,
  onSettled: () => void,
) {
  const fieldName =
    `pages.${pendingTextFocus.pageIndex}.tts.${pendingTextFocus.ttsIndex}.text` as const;
  let retryFrame: number | null = null;

  const focusAndScroll = () => {
    form.setFocus(fieldName);
    const textArea = document.querySelector<HTMLTextAreaElement>(`textarea[name="${fieldName}"]`);
    if (textArea) {
      textArea.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    onSettled();
  };

  const frame = window.requestAnimationFrame(() => {
    const textArea = document.querySelector<HTMLTextAreaElement>(`textarea[name="${fieldName}"]`);
    if (textArea) {
      focusAndScroll();
      return;
    }

    retryFrame = window.requestAnimationFrame(focusAndScroll);
  });

  return () => {
    window.cancelAnimationFrame(frame);
    if (retryFrame !== null) {
      window.cancelAnimationFrame(retryFrame);
    }
  };
}

function useSelectedIndices(pageCount: number) {
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [selectedTtsIndex, setSelectedTtsIndex] = useState<number | null>(null);

  useEffect(() => {
    if (pageCount === 0) {
      setSelectedPageIndex(null);
      setSelectedTtsIndex(null);
      return;
    }

    setSelectedPageIndex((current) => {
      if (current === null) {
        return 0;
      }
      return current < pageCount ? current : pageCount - 1;
    });
  }, [pageCount]);

  return {
    selectedPageIndex,
    selectedTtsIndex,
    setSelectedPageIndex,
    setSelectedTtsIndex,
  };
}

function usePendingTextFocusEffect(
  form: UseFormReturn<DraftProject>,
  pendingTextFocus: PendingTextFocus | null,
  clearPendingTextFocus: () => void,
) {
  useEffect(() => {
    if (!pendingTextFocus) {
      return;
    }

    return focusTextArea(form, pendingTextFocus, clearPendingTextFocus);
  }, [clearPendingTextFocus, form, pendingTextFocus]);
}

function useEditorHotkeys(
  form: UseFormReturn<DraftProject>,
  saveProject: (project: DraftProject) => Promise<void>,
  onAppendTtsToPage: (pageIndex: number) => void,
  selectedPageIndex: number | null,
  canRunAnalyzeSelectedTts: () => void,
) {
  useHotkeys(
    "mod+s",
    (event) => {
      event.preventDefault();
      void form.handleSubmit(saveProject)();
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [form, saveProject],
  );

  useHotkeys(
    "mod+enter",
    (event) => {
      event.preventDefault();
      if (selectedPageIndex !== null) {
        onAppendTtsToPage(selectedPageIndex);
      }
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [onAppendTtsToPage, selectedPageIndex],
  );

  useHotkeys(
    "mod+shift+s",
    (event) => {
      event.preventDefault();
      canRunAnalyzeSelectedTts();
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [canRunAnalyzeSelectedTts],
  );
}

function getHotkeyTarget() {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLTextAreaElement)) {
    return null;
  }

  if (!isTtsHotkeyTextArea(activeElement)) {
    return null;
  }

  return getHotkeyIndices(activeElement);
}

function isTtsHotkeyTextArea(element: HTMLTextAreaElement) {
  return element.dataset.ttsHotkeyTarget === "text";
}

function getHotkeyIndices(element: HTMLTextAreaElement) {
  const pageIndex = Number(element.dataset.pageIndex);
  const ttsIndex = Number(element.dataset.ttsIndex);

  if (Number.isNaN(pageIndex) || Number.isNaN(ttsIndex)) {
    return null;
  }

  return { pageIndex, ttsIndex };
}

export function useEditorScreen({
  appendPage,
  createDraftTts,
  editorActions,
  form,
  movePage,
  onLoadVoices,
  pageFields,
  removePage,
  voices,
}: UseEditorScreenParams): EditorContextValue {
  const canRunTts = voices.status === "ready" && voices.options.length > 0 && !editorActions.saving;
  const { selectedPageIndex, selectedTtsIndex, setSelectedPageIndex, setSelectedTtsIndex } =
    useSelectedIndices(pageFields.length);
  const [pendingTextFocus, setPendingTextFocus] = useState<PendingTextFocus | null>(null);

  const clearPendingTextFocus = () => {
    setPendingTextFocus(null);
  };

  usePendingTextFocusEffect(form, pendingTextFocus, clearPendingTextFocus);

  const saveCurrentProject = async (project: DraftProject) => {
    await editorActions.saveProject(project);
  };

  const analyzeTts = async (pageIndex: number, ttsIndex: number) => {
    const item = form.getValues(`pages.${pageIndex}.tts.${ttsIndex}`);
    if (!canAnalyzeItem(canRunTts, item, editorActions.busyById)) {
      return;
    }

    const analyzedText = await editorActions.analyzeItem(item);
    if (!analyzedText) {
      return;
    }

    form.setValue(`pages.${pageIndex}.tts.${ttsIndex}.speech.analyzedText`, analyzedText, {
      shouldDirty: true,
    });
  };

  const appendTtsToPage = (pageIndex: number) => {
    const page = form.getValues(`pages.${pageIndex}`);
    if (!page) {
      return;
    }

    const sourceTts = getSelectedSourceTts(page, pageIndex, selectedPageIndex, selectedTtsIndex);
    const nextItem = createDraftTts();
    applyCopiedVoice(nextItem, sourceTts);

    const nextTtsIndex = page.tts.length;
    form.setValue(`pages.${pageIndex}.tts`, [...page.tts, nextItem], {
      shouldDirty: true,
    });
    setSelectedPageIndex(pageIndex);
    setSelectedTtsIndex(nextTtsIndex);
    setPendingTextFocus({ pageIndex, ttsIndex: nextTtsIndex });
  };

  const analyzeSelectedHotkeyTarget = () => {
    const target = getHotkeyTarget();
    if (!target) {
      return;
    }
    void analyzeTts(target.pageIndex, target.ttsIndex);
  };

  useEditorHotkeys(
    form,
    saveCurrentProject,
    appendTtsToPage,
    selectedPageIndex,
    analyzeSelectedHotkeyTarget,
  );

  return {
    busyById: editorActions.busyById,
    canRunTts,
    pageFields,
    onAnalyzeTts: analyzeTts,
    onAppendPage: () => {
      setSelectedPageIndex(pageFields.length);
      setSelectedTtsIndex(null);
      appendPage();
    },
    onAppendTtsToPage: appendTtsToPage,
    onMovePageDown: (index: number) => {
      if (index < pageFields.length - 1) {
        movePage(index, index + 1);
        setSelectedPageIndex(index + 1);
      }
    },
    onMovePageUp: (index: number) => {
      if (index > 0) {
        movePage(index, index - 1);
        setSelectedPageIndex(index - 1);
      }
    },
    onPreviewTts: async (pageIndex: number, ttsIndex: number) => {
      const item = form.getValues(`pages.${pageIndex}.tts.${ttsIndex}`);
      if (item) {
        await editorActions.previewItem(item);
      }
    },
    onRemovePage: (index: number) => {
      setSelectedPageIndex((current) =>
        getNextRemovedPageSelection(current, index, pageFields.length - 1),
      );
      setSelectedTtsIndex(null);
      removePage(index);
    },
    onSave: () => {
      void form.handleSubmit(saveCurrentProject)();
    },
    onSelectPage: (index: number) => {
      setSelectedPageIndex(index);
      setSelectedTtsIndex(0);
    },
    onSelectTts: setSelectedTtsIndex,
    saving: editorActions.saving,
    selectedPageIndex,
    selectedTtsIndex,
    createDraftTts,
    voiceSelectOptions: voices.options,
    voices,
    onLoadVoices,
  };
}
