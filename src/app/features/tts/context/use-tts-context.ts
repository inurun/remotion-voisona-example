import { useCallback, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import type { DraftProject } from "@/_schemas";
import { useEditor } from "@/app/features/editor";
import { requestPreviewSynthesis } from "@/app/features/tts/api/tts-api";
import { isTtsActionReady } from "@/app/features/tts/lib/tts-action";
import { resolveTtsIndexForPage } from "@/app/features/tts/lib/tts-selection";
import { useAnalyzeTextMutation } from "@/app/features/tts/swr/use-tts-mutations";
import { useVoices } from "@/app/features/voices";

function useTtsSelection() {
  const [selectedTtsIndex, setSelectedTtsIndex] = useState<number | null>(null);

  const selectTts = useCallback((index: number) => {
    setSelectedTtsIndex(index);
  }, []);

  const syncForPage = useCallback((ttsCount: number) => {
    setSelectedTtsIndex(resolveTtsIndexForPage(ttsCount));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedTtsIndex(null);
  }, []);

  return {
    selectedTtsIndex,
    selectTts,
    syncForPage,
    syncTtsIndexFromPage: syncForPage,
    clearSelection,
  };
}

function useTtsCommands() {
  const { getValues, setValue } = useFormContext<DraftProject>();
  const { isPending: saving } = useEditor();
  const { options } = useVoices();
  const { trigger: analyzeText, isMutating: isAnalyzing } = useAnalyzeTextMutation();

  const canRunTts = options.length > 0 && !saving;
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const playPreview = useCallback(async (audioSrc: string) => {
    previewAudioRef.current?.pause();
    const audio = new Audio(audioSrc);
    previewAudioRef.current = audio;
    await audio.play();
  }, []);

  const analyze = useCallback(
    async (pageIndex: number, ttsIndex: number) => {
      const item = getValues(`pages.${pageIndex}.tts.${ttsIndex}`);
      if (isAnalyzing || !isTtsActionReady(item, canRunTts)) {
        return;
      }
      const analyzedText = await analyzeText({ item });
      setValue(`pages.${pageIndex}.tts.${ttsIndex}.speech.analyzedText`, analyzedText, {
        shouldDirty: true,
      });
      toast.success("TSML を更新した。");
    },
    [analyzeText, canRunTts, getValues, isAnalyzing, setValue],
  );

  const preview = useCallback(
    async (pageIndex: number, ttsIndex: number) => {
      const item = getValues(`pages.${pageIndex}.tts.${ttsIndex}`);
      if (!isTtsActionReady(item, canRunTts)) {
        return;
      }
      const audioSrc = await requestPreviewSynthesis(item);
      await playPreview(audioSrc);
      toast.success("Preview を再生した。");
    },
    [canRunTts, getValues, playPreview],
  );

  return {
    canRunTts,
    isAnalyzing,
    analyze,
    preview,
  };
}

export function useTtsProviderValue() {
  const selection = useTtsSelection();
  const commands = useTtsCommands();

  return {
    ...selection,
    ...commands,
  };
}
