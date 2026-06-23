import { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import type { DraftProject, DraftTts } from "@/_schemas";
import { createUuid } from "@/_shared/lib/utils";
import { useVoices } from "@/app/contexts/voices-context/voices-context";
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { getVoiceValue } from "@/app/contexts/form-context/form-context.hook";
import { useForm } from "@/app/contexts/form-context/form-context";
import { resolveTtsIndexForPage } from "@/app/features/editor/selection";
import { requestPreviewSynthesis, requestTextAnalysis } from "@/app/core/api/editor-api";

type PendingTextFocus = {
  pageIndex: number;
  ttsIndex: number;
};

function focusTextArea(
  form: ReturnType<typeof useFormContext<DraftProject>>,
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

type TtsContextValue = {
  selectedTtsIndex: number | null;
  busyById: Record<string, string>;
  canRunTts: boolean;
  selectTts: (index: number) => void;
  syncForPage: (ttsCount: number) => void;
  syncTtsIndexFromPage: (ttsCount: number) => void;
  clearSelection: () => void;
  appendToPage: (
    pageIndex: number,
    sourceTts: DraftTts | undefined,
  ) => { pageIndex: number; ttsIndex: number } | null;
  analyze: (pageIndex: number, ttsIndex: number) => Promise<void>;
  preview: (pageIndex: number, ttsIndex: number) => Promise<void>;
};

export function useTtsProviderValue(): TtsContextValue {
  const form = useFormContext<DraftProject>();
  const { appendTtsToPage } = useForm();
  const { options } = useVoices();
  const { isPending: saving } = useEditor();
  const [selectedTtsIndex, setSelectedTtsIndex] = useState<number | null>(null);
  const [busyById, setBusyById] = useState<Record<string, string>>({});
  const [pendingTextFocus, setPendingTextFocus] = useState<PendingTextFocus | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const canRunTts = options.length > 0 && !saving;

  const createDraftTts = useCallback((): DraftTts => {
    const defaultVoice = options[0];

    return {
      id: createUuid(),
      text: "",
      readText: "",
      voiceName: defaultVoice?.voiceName ?? "",
      voiceVersion: defaultVoice?.voiceVersion ?? "",
      speech: {},
    };
  }, [options]);

  const clearPendingTextFocus = useCallback(() => {
    setPendingTextFocus(null);
  }, []);

  useEffect(() => {
    if (!pendingTextFocus) {
      return;
    }

    return focusTextArea(form, pendingTextFocus, clearPendingTextFocus);
  }, [clearPendingTextFocus, form, pendingTextFocus]);

  const setItemBusy = useCallback((id: string, reason: string | null) => {
    setBusyById((current) => {
      const next = { ...current };
      if (reason) {
        next[id] = reason;
      } else {
        delete next[id];
      }
      return next;
    });
  }, []);

  const runItemTask = useCallback(
    async <T>(
      id: string,
      reason: string,
      task: () => Promise<T>,
      onSuccess?: (value: T) => void | Promise<void>,
    ) => {
      setItemBusy(id, reason);

      try {
        const result = await task();
        await onSuccess?.(result);
        return result;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : `${reason} failed`);
        return null;
      } finally {
        setItemBusy(id, null);
      }
    },
    [setItemBusy],
  );

  const selectTts = useCallback((index: number) => {
    setSelectedTtsIndex(index);
  }, []);

  const syncForPage = useCallback((ttsCount: number) => {
    setSelectedTtsIndex(resolveTtsIndexForPage(ttsCount));
  }, []);

  const syncTtsIndexFromPage = syncForPage;

  const clearSelection = useCallback(() => {
    setSelectedTtsIndex(null);
  }, []);

  const analyzeItem = useCallback(
    async (item: DraftTts) =>
      runItemTask(
        item.id,
        "analyze",
        () => requestTextAnalysis(item),
        () => {
          toast.success("TSML を更新した。");
        },
      ),
    [runItemTask],
  );

  const playPreview = useCallback(async (audioSrc: string) => {
    previewAudioRef.current?.pause();
    const audio = new Audio(audioSrc);
    previewAudioRef.current = audio;
    await audio.play();
  }, []);

  const previewItem = useCallback(
    async (item: DraftTts) =>
      runItemTask(
        item.id,
        "preview",
        () => requestPreviewSynthesis(item),
        async (audioSrc) => {
          if (!audioSrc) {
            return;
          }

          await playPreview(audioSrc);
          toast.success("Preview を再生した。");
        },
      ),
    [playPreview, runItemTask],
  );

  const appendToPage = useCallback(
    (pageIndex: number, sourceTts: DraftTts | undefined) => {
      const nextItem = createDraftTts();
      const sourceVoiceValue =
        sourceTts?.voiceName !== undefined && sourceTts.voiceName !== ""
          ? getVoiceValue({
              voiceName: sourceTts.voiceName,
              voiceVersion: sourceTts.voiceVersion,
            })
          : null;
      if (sourceVoiceValue) {
        const [voiceName = "", voiceVersion = ""] = sourceVoiceValue.split("::");
        nextItem.voiceName = voiceName;
        nextItem.voiceVersion = voiceVersion;
      }

      const nextTtsIndex = appendTtsToPage(pageIndex, nextItem);
      if (nextTtsIndex === null) {
        return null;
      }

      setPendingTextFocus({ pageIndex, ttsIndex: nextTtsIndex });
      return { pageIndex, ttsIndex: nextTtsIndex };
    },
    [appendTtsToPage, createDraftTts],
  );

  const analyze = useCallback(
    async (pageIndex: number, ttsIndex: number) => {
      const item = form.getValues(`pages.${pageIndex}.tts.${ttsIndex}`);
      if (!canRunTts || !item) {
        return;
      }

      if (!(item.text ?? "").trim() || !item.voiceName) {
        return;
      }

      if (busyById[item.id]) {
        return;
      }

      const analyzedText = await analyzeItem(item);
      if (!analyzedText) {
        return;
      }

      form.setValue(`pages.${pageIndex}.tts.${ttsIndex}.speech.analyzedText`, analyzedText, {
        shouldDirty: true,
      });
    },
    [analyzeItem, busyById, canRunTts, form],
  );

  const preview = useCallback(
    async (pageIndex: number, ttsIndex: number) => {
      const item = form.getValues(`pages.${pageIndex}.tts.${ttsIndex}`);
      if (item) {
        await previewItem(item);
      }
    },
    [form, previewItem],
  );

  return {
    selectedTtsIndex,
    busyById,
    canRunTts,
    selectTts,
    syncForPage,
    syncTtsIndexFromPage,
    clearSelection,
    appendToPage,
    analyze,
    preview,
  };
}
