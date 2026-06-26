import { useCallback, useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { DraftProject, DraftTts, VoiceOption } from "@/_schemas";
import { createUuid } from "@/_shared/lib/utils";
import { useForm } from "@/app/features/editor";
import { usePage } from "@/app/features/page";
import { useTts } from "@/app/features/tts";
import { useVoices } from "@/app/features/voices";

type PendingTextFocus = {
  pageIndex: number;
  ttsIndex: number;
};

const emptyVoice = {
  voiceName: "",
  voiceVersion: "",
};

function hasVoiceName(voice: DraftTts | VoiceOption | undefined) {
  return Boolean(voice?.voiceName);
}

function getInitialVoice(options: VoiceOption[], sourceTts: DraftTts | undefined) {
  const voice = [sourceTts, options[0]].find(hasVoiceName) ?? emptyVoice;
  return {
    voiceName: voice.voiceName,
    voiceVersion: voice.voiceVersion ?? "",
  };
}

function createDraftTts(options: VoiceOption[], sourceTts: DraftTts | undefined): DraftTts {
  const voice = getInitialVoice(options, sourceTts);

  return {
    id: createUuid(),
    text: "",
    readText: "",
    voiceName: voice.voiceName,
    voiceVersion: voice.voiceVersion,
    speech: {},
  };
}

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

export function useAddTtsButton() {
  const form = useFormContext<DraftProject>();
  const { appendTtsToPage } = useForm();
  const { selectedPageIndex, setSelectedPageIndex } = usePage();
  const { selectedTtsIndex, selectTts } = useTts();
  const { options } = useVoices();
  const [pendingTextFocus, setPendingTextFocus] = useState<PendingTextFocus | null>(null);

  const clearPendingTextFocus = useCallback(() => {
    setPendingTextFocus(null);
  }, []);

  useEffect(() => {
    if (!pendingTextFocus) {
      return;
    }

    return focusTextArea(form, pendingTextFocus, clearPendingTextFocus);
  }, [clearPendingTextFocus, form, pendingTextFocus]);

  const append = useCallback(() => {
    if (selectedPageIndex === null) {
      return null;
    }

    const page = form.getValues(`pages.${selectedPageIndex}`);
    const sourceTts = selectedTtsIndex !== null ? page?.tts[selectedTtsIndex] : undefined;
    const nextTtsIndex = appendTtsToPage(selectedPageIndex, createDraftTts(options, sourceTts));

    if (nextTtsIndex === null) {
      return null;
    }

    setPendingTextFocus({ pageIndex: selectedPageIndex, ttsIndex: nextTtsIndex });
    setSelectedPageIndex(selectedPageIndex);
    selectTts(nextTtsIndex);
    return { pageIndex: selectedPageIndex, ttsIndex: nextTtsIndex };
  }, [
    appendTtsToPage,
    form,
    options,
    selectTts,
    selectedPageIndex,
    selectedTtsIndex,
    setSelectedPageIndex,
  ]);

  return {
    selectedPageIndex,
    append,
  };
}
