import { useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useFormContext } from "react-hook-form";
import type { DraftProject, VoiceOption } from "@/_schemas";
import { useTts } from "@/app/features/tts";
import { getTtsHotkeyTarget } from "@/app/features/tts/lib/tts-hotkey-target";
import { eventMatchesHotkey } from "@/app/features/settings/lib/hotkeys";
import { getVoiceId, useSettings } from "@/app/features/settings";
import { usePage } from "@/app/features/page";
import type { VoiceSettings } from "@/app/features/settings/storage/use-settings-store";

function getHotkeyTarget() {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLTextAreaElement)) {
    return null;
  }

  return getTtsHotkeyTarget(activeElement.dataset);
}

function getVoiceForHotkey(
  event: KeyboardEvent,
  options: VoiceOption[],
  voiceSettings: Record<string, VoiceSettings>,
) {
  return options.find((option) =>
    eventMatchesHotkey(event, voiceSettings[getVoiceId(option)]?.hotkey ?? ""),
  );
}

function setTtsVoice({
  pageIndex,
  setValue,
  ttsIndex,
  voice,
}: {
  pageIndex: number;
  setValue: ReturnType<typeof useFormContext<DraftProject>>["setValue"];
  ttsIndex: number;
  voice: VoiceOption;
}) {
  setValue(`pages.${pageIndex}.tts.${ttsIndex}.voiceName`, voice.voiceName, {
    shouldDirty: true,
  });
  setValue(`pages.${pageIndex}.tts.${ttsIndex}.voiceVersion`, voice.voiceVersion ?? "", {
    shouldDirty: true,
  });
}

export function useTtsListHotkeys() {
  const { analyze, selectedTtsIndex } = useTts();
  const { hotkeys, options, voiceSettings } = useSettings();
  const { selectedPageIndex } = usePage();
  const { setValue } = useFormContext<DraftProject>();

  useHotkeys(
    hotkeys.analyze,
    (event) => {
      event.preventDefault();
      const target = getHotkeyTarget();
      if (!target) {
        return;
      }

      void analyze(target.pageIndex, target.ttsIndex);
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
      enabled: Boolean(hotkeys.analyze),
    },
    [analyze, hotkeys.analyze],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedPageIndex === null || selectedTtsIndex === null) {
        return;
      }

      const voice = getVoiceForHotkey(event, options, voiceSettings);
      if (!voice) {
        return;
      }

      event.preventDefault();
      setTtsVoice({ pageIndex: selectedPageIndex, setValue, ttsIndex: selectedTtsIndex, voice });
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [options, selectedPageIndex, selectedTtsIndex, setValue, voiceSettings]);
}
