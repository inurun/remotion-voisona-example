import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import {
  draftProjectSchema,
  type DraftPage,
  type DraftProject,
  type DraftTts,
  type SavedProject,
  type VoiceOption,
} from "@/_schemas";
import { createUuid } from "@/_shared/lib/utils";

function toDraftPages(project: SavedProject): DraftPage[] {
  return project.pages.map((page) => ({
    id: page.id,
    richText: page.richText,
    tts: page.tts.map((item) => ({
      id: item.id,
      text: item.text,
      readText: item.readText,
      voiceName: item.voiceName,
      ...(item.voiceVersion ? { voiceVersion: item.voiceVersion } : {}),
      speech: {
        analyzedText: item.speech.analyzedText,
      },
    })),
  }));
}

function createDraftPage(): DraftPage {
  return {
    id: createUuid(),
    richText: "<p></p>",
    tts: [],
  };
}

function getDefaultVoiceFields(defaultVoice?: VoiceOption) {
  if (!defaultVoice) {
    return { voiceName: "", voiceVersion: "" };
  }

  return {
    voiceName: defaultVoice.voiceName,
    voiceVersion: defaultVoice.voiceVersion ?? "",
  };
}

function createDraftTts(defaultVoice?: VoiceOption): DraftTts {
  return {
    id: createUuid(),
    text: "",
    readText: "",
    ...getDefaultVoiceFields(defaultVoice),
    speech: {},
  };
}

export function getVoiceValue(item: Pick<DraftTts, "voiceName" | "voiceVersion">) {
  return `${item.voiceName}::${item.voiceVersion ?? ""}`;
}

export function useEditorForm({
  initialProject,
  voiceOptions,
}: {
  initialProject: SavedProject;
  voiceOptions: VoiceOption[];
}) {
  const form = useForm<DraftProject>({
    resolver: zodResolver(draftProjectSchema),
    defaultValues: {
      pages: toDraftPages(initialProject),
    },
  });

  const { fields, append, move, remove } = useFieldArray({
    control: form.control,
    keyName: "fieldKey",
    name: "pages",
  });

  useEffect(() => {
    form.reset({
      pages: toDraftPages(initialProject),
    });
  }, [form, initialProject]);

  useEffect(() => {
    if (voiceOptions.length === 0) {
      return;
    }

    const fallback = voiceOptions[0];
    if (!fallback) {
      return;
    }

    form.getValues("pages").forEach((page, pageIndex) => {
      page.tts.forEach((item, ttsIndex) => {
        if (item.voiceName) {
          return;
        }

        form.setValue(`pages.${pageIndex}.tts.${ttsIndex}.voiceName`, fallback.voiceName, {
          shouldDirty: false,
          shouldTouch: false,
        });
        form.setValue(
          `pages.${pageIndex}.tts.${ttsIndex}.voiceVersion`,
          fallback.voiceVersion ?? "",
          {
            shouldDirty: false,
            shouldTouch: false,
          },
        );
      });
    });
  }, [form, voiceOptions]);

  return {
    form,
    pageFields: fields,
    appendPage: () => {
      append(createDraftPage());
    },
    removePage: (index: number) => {
      remove(index);
    },
    movePage: (from: number, to: number) => {
      move(from, to);
    },
    createDraftTts: () => createDraftTts(voiceOptions[0]),
  };
}
