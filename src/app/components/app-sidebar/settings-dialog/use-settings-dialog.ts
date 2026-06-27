import { useCallback, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { voiceOptionSchema, type VoiceOption } from "@/_schemas";
import { fetchVoices } from "@/app/features/settings/api/settings-api";
import {
  APP_HOTKEY_LABELS,
  DEFAULT_HOTKEYS,
  getVoiceId,
  type AppHotkeyAction,
  type SettingsSnapshot,
} from "@/app/features/settings";
import { findDuplicateHotkeys, normalizeHotkey } from "@/app/features/settings/lib/hotkeys";
import { mergeVoiceOrder } from "@/app/features/settings/lib/settings";
import { useSettings } from "@/app/features/settings";
import { moveItem } from "@/app/features/ui/lib/reorder";

const voiceSettingFormSchema = z.object({
  voiceId: z.string().min(1),
  label: z.string(),
  hotkey: z.string(),
});

const settingsFormSchema = z
  .object({
    voices: z.array(voiceOptionSchema),
    voiceOrder: z.array(z.string()),
    voiceSettings: z.array(voiceSettingFormSchema),
    hotkeys: z.object({
      save: z.string(),
      analyze: z.string(),
      addTts: z.string(),
    }),
  })
  .superRefine((values, context) => {
    const appHotkeys = (Object.keys(APP_HOTKEY_LABELS) as AppHotkeyAction[]).map((action) => ({
      path: ["hotkeys", action],
      value: values.hotkeys[action],
    }));
    const voiceHotkeys = values.voiceSettings.map((setting, index) => ({
      path: ["voiceSettings", index, "hotkey"],
      value: setting.hotkey,
    }));
    const entries = [...appHotkeys, ...voiceHotkeys];
    const duplicates = findDuplicateHotkeys(entries.map((entry) => entry.value));

    for (const entry of entries) {
      const hotkey = normalizeHotkey(entry.value);
      if (!hotkey || !duplicates.has(hotkey)) {
        continue;
      }

      context.addIssue({
        code: "custom",
        message: "Hotkey is duplicated.",
        path: entry.path,
      });
    }
  });

type SettingsFormValues = z.infer<typeof settingsFormSchema>;
type VoiceSettingFormValue = z.infer<typeof voiceSettingFormSchema>;

function createVoiceSettingFormValues(settings: SettingsSnapshot): VoiceSettingFormValue[] {
  const existing = Object.entries(settings.voiceSettings).map(([voiceId, value]) => ({
    voiceId,
    label: value.label,
    hotkey: value.hotkey,
  }));
  const existingIds = new Set(existing.map((setting) => setting.voiceId));
  const missing = settings.voices
    .map(getVoiceId)
    .filter((voiceId) => !existingIds.has(voiceId))
    .map((voiceId) => ({ voiceId, label: "", hotkey: "" }));

  return [...existing, ...missing];
}

function createFormValues(settings: SettingsSnapshot): SettingsFormValues {
  return {
    voices: settings.voices,
    voiceOrder: mergeVoiceOrder(settings.voiceOrder, settings.voices),
    voiceSettings: createVoiceSettingFormValues(settings),
    hotkeys: settings.hotkeys,
  };
}

function toSettingsSnapshot(values: SettingsFormValues): SettingsSnapshot {
  return {
    voices: values.voices,
    voiceOrder: mergeVoiceOrder(values.voiceOrder, values.voices),
    voiceSettings: Object.fromEntries(
      values.voiceSettings.map((setting) => [
        setting.voiceId,
        {
          label: setting.label,
          hotkey: setting.hotkey,
        },
      ]),
    ),
    hotkeys: values.hotkeys,
  };
}

function getVisibleVoices(values: SettingsFormValues) {
  const voicesById = new Map(values.voices.map((voice) => [getVoiceId(voice), voice]));
  return mergeVoiceOrder(values.voiceOrder, values.voices).flatMap((voiceId) => {
    const voice = voicesById.get(voiceId);
    return voice ? [voice] : [];
  });
}

function getSettingsErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Settings action failed";
}

function getVoiceSettingIndex(values: SettingsFormValues, voiceId: string) {
  return values.voiceSettings.findIndex((setting) => setting.voiceId === voiceId);
}

function getVoiceSetting(values: SettingsFormValues, voiceId: string) {
  const setting = values.voiceSettings.find((item) => item.voiceId === voiceId);
  return setting ?? { voiceId, label: "", hotkey: "" };
}

function appendMissingVoiceSettings(values: SettingsFormValues, voices: VoiceOption[]) {
  const voiceIds = new Set(values.voiceSettings.map((setting) => setting.voiceId));
  const missing = voices
    .map(getVoiceId)
    .filter((voiceId) => !voiceIds.has(voiceId))
    .map((voiceId) => ({ voiceId, label: "", hotkey: "" }));

  return [...values.voiceSettings, ...missing];
}

export function useSettingsDialog() {
  const settings = useSettings();
  const [open, setOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    mode: "onChange",
    defaultValues: createFormValues(settings),
  });
  const values = form.watch();
  const visibleVoices = useMemo(() => getVisibleVoices(values), [values]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (nextOpen) {
        form.reset(createFormValues(settings));
      }
    },
    [form, settings],
  );

  const refreshVoices = useCallback(async () => {
    const promise = (async () => {
      setIsRefreshing(true);
      try {
        const result = await fetchVoices();
        const current = form.getValues();
        form.reset({
          ...current,
          voices: result.options,
          voiceOrder: mergeVoiceOrder(current.voiceOrder, result.options),
          voiceSettings: appendMissingVoiceSettings(current, result.options),
        });
      } finally {
        setIsRefreshing(false);
      }
    })();

    await toast.promise(promise, {
      loading: "Loading voices...",
      success: "Voices refreshed.",
      error: getSettingsErrorMessage,
    });
  }, [form]);

  const moveVoice = useCallback(
    (fromIndex: number, toIndex: number) => {
      const current = form.getValues();
      form.setValue(
        "voiceOrder",
        moveItem(getVisibleVoices(current).map(getVoiceId), fromIndex, toIndex),
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    },
    [form],
  );

  const setVoiceLabel = useCallback(
    (voice: VoiceOption, label: string) => {
      const index = getVoiceSettingIndex(form.getValues(), getVoiceId(voice));
      if (index === -1) {
        return;
      }

      form.setValue(`voiceSettings.${index}.label`, label, {
        shouldDirty: true,
      });
    },
    [form],
  );

  const setVoiceHotkey = useCallback(
    (voice: VoiceOption, hotkey: string) => {
      const index = getVoiceSettingIndex(form.getValues(), getVoiceId(voice));
      if (index === -1) {
        return;
      }

      form.setValue(`voiceSettings.${index}.hotkey`, hotkey, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const setAppHotkey = useCallback(
    (action: AppHotkeyAction, hotkey: string) => {
      form.setValue(`hotkeys.${action}`, hotkey, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const resetHotkeys = useCallback(() => {
    const current = form.getValues();
    form.reset({
      ...current,
      hotkeys: { ...DEFAULT_HOTKEYS },
      voiceSettings: current.voiceSettings.map((setting) => ({ ...setting, hotkey: "" })),
    });
  }, [form]);

  const save = form.handleSubmit((formValues) => {
    settings.saveSettings(toSettingsSnapshot(formValues));
    toast.success("Settings saved.");
    setOpen(false);
  });

  return {
    draft: toSettingsSnapshot(values),
    form,
    isRefreshing,
    open,
    visibleVoices,
    canSave: form.formState.isValid,
    getAppHotkeyError: (action: AppHotkeyAction) =>
      form.getFieldState(`hotkeys.${action}`, form.formState).error?.message,
    getVoiceSetting: (voice: VoiceOption) => getVoiceSetting(values, getVoiceId(voice)),
    getVoiceHotkeyError: (voice: VoiceOption) => {
      const index = getVoiceSettingIndex(values, getVoiceId(voice));
      if (index === -1) {
        return undefined;
      }

      return form.getFieldState(`voiceSettings.${index}.hotkey`, form.formState).error?.message;
    },
    handleOpenChange,
    moveVoice,
    refreshVoices,
    resetHotkeys,
    save,
    setAppHotkey,
    setVoiceHotkey,
    setVoiceLabel,
  };
}
