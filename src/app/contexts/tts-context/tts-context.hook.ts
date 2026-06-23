import { useCallback, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";
import useSWRMutation from "swr/mutation";
import { toast } from "sonner";
import type { DraftProject, DraftTts } from "@/_schemas";
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { useVoices } from "@/app/contexts/voices-context/voices-context";
import { requestPreviewSynthesis, requestTextAnalysis } from "@/app/core/api/editor-api";
import { resolveTtsIndexForPage } from "@/app/contexts/selection/selection";

type AnalyzeTextArg = {
  item: DraftTts;
};

async function analyzeTextMutation(_key: string, { arg }: { arg: AnalyzeTextArg }) {
  return requestTextAnalysis(arg.item);
}

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
  const { trigger: analyzeText, isMutating: isAnalyzing } = useSWRMutation(
    "tts-analysis",
    analyzeTextMutation,
    {
      onError(error, key, config) {
        console.error(error, key, config);
        toast.error("analyze failed");
      },
    },
  );

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
      const actionReady = item && canRunTts && (item.text ?? "").trim() && item.voiceName;
      if (isAnalyzing || !actionReady) {
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
      const actionReady = item && canRunTts && (item.text ?? "").trim() && item.voiceName;
      if (!actionReady) {
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
