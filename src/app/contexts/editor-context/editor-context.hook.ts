import { useCallback, useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import type { DraftProject, DraftTts } from "@/_schemas";
import { createUuid } from "@/_shared/lib/utils";
import { useVoices } from "@/app/contexts/voices-context/voices-context";
import { useProject } from "@/app/contexts/project-context/project-context";
import { getVoiceValue } from "@/app/contexts/form-context/form-context.hook";
import { useForm } from "@/app/contexts/form-context/form-context";
import { usePage } from "@/app/contexts/page-context/page-context";
import {
  requestPreviewSynthesis,
  requestSaveProject,
  requestTextAnalysis,
} from "@/app/features/editor/editor-api";

export type EditorContextValue = {
  busyById: Record<string, string>;
  canRunTts: boolean;
  saving: boolean;
  onAnalyzeTts: (pageIndex: number, ttsIndex: number) => Promise<void>;
  onAppendTtsToPage: (pageIndex: number) => void;
  onPreviewTts: (pageIndex: number, ttsIndex: number) => Promise<void>;
  onSave: () => void;
  createDraftTts: () => DraftTts;
};

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

export function useEditorProviderValue(): EditorContextValue {
  const form = useFormContext<DraftProject>();
  const { appendTtsToPage } = useForm();
  const { selectedPageIndex, selectedTtsIndex, selectTtsAt } = usePage();
  const { projectPath, mutateProject } = useProject();
  const { options } = useVoices();
  const [busyById, setBusyById] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
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

  const saveCurrentProject = useCallback(
    async (draftProject: DraftProject) => {
      if (!projectPath) {
        throw new Error("Project path is required");
      }

      const savePromise = (async () => {
        setSaving(true);

        try {
          const savedProject = await requestSaveProject(projectPath, draftProject);
          await mutateProject(savedProject);
        } finally {
          setSaving(false);
        }
      })();

      await toast.promise(savePromise, {
        loading: "保存中...",
        success: "保存して音声を更新した。",
        error: "Save failed",
      });
    },
    [mutateProject, projectPath],
  );

  const analyzeTts = useCallback(
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

  const onAppendTtsToPage = useCallback(
    (pageIndex: number) => {
      const page = form.getValues(`pages.${pageIndex}`);
      if (!page) {
        return;
      }

      const sourceTts =
        pageIndex === selectedPageIndex && selectedTtsIndex !== null
          ? page.tts[selectedTtsIndex]
          : undefined;
      const nextItem = createDraftTts();
      const sourceVoiceValue = sourceTts ? getVoiceValue(sourceTts) : null;
      if (sourceVoiceValue) {
        const [voiceName = "", voiceVersion = ""] = sourceVoiceValue.split("::");
        nextItem.voiceName = voiceName;
        nextItem.voiceVersion = voiceVersion;
      }

      const nextTtsIndex = appendTtsToPage(pageIndex, nextItem);
      if (nextTtsIndex === null) {
        return;
      }

      selectTtsAt(pageIndex, nextTtsIndex);
      setPendingTextFocus({ pageIndex, ttsIndex: nextTtsIndex });
    },
    [appendTtsToPage, createDraftTts, form, selectTtsAt, selectedPageIndex, selectedTtsIndex],
  );

  return {
    busyById,
    canRunTts,
    onAnalyzeTts: analyzeTts,
    onAppendTtsToPage,
    onPreviewTts: async (pageIndex: number, ttsIndex: number) => {
      const item = form.getValues(`pages.${pageIndex}.tts.${ttsIndex}`);
      if (item) {
        await previewItem(item);
      }
    },
    onSave: () => {
      void form.handleSubmit(saveCurrentProject)();
    },
    saving,
    createDraftTts,
  };
}
