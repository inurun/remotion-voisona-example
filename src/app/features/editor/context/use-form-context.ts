import { useCallback, useEffect } from "react";
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

export function getVoiceValue(item: { voiceName: string; voiceVersion?: string }) {
  return `${item.voiceName}::${item.voiceVersion ?? ""}`;
}

type FormContextValue = {
  pageFields: Array<DraftPage & { fieldKey: string }>;
  appendPage: (page: DraftPage) => void;
  movePage: (fromIndex: number, toIndex: number) => void;
  removePage: (index: number) => void;
  appendTtsToPage: (pageIndex: number, tts: DraftTts) => number | null;
};

export function useFormProviderValue({
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

  const pageFieldArray = useFieldArray({
    control: form.control,
    keyName: "fieldKey",
    name: "pages",
  });
  const { append, move, remove } = pageFieldArray;

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

  const appendPage = useCallback(
    (page: DraftPage) => {
      append(page);
    },
    [append],
  );

  const movePage = useCallback(
    (fromIndex: number, toIndex: number) => {
      move(fromIndex, toIndex);
    },
    [move],
  );

  const removePage = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove],
  );

  const appendTtsToPage = useCallback(
    (pageIndex: number, tts: DraftTts): number | null => {
      const page = form.getValues(`pages.${pageIndex}`);
      if (!page) {
        return null;
      }

      const nextTtsIndex = page.tts.length;
      form.setValue(`pages.${pageIndex}.tts`, [...page.tts, tts], {
        shouldDirty: true,
      });
      return nextTtsIndex;
    },
    [form],
  );

  const value: FormContextValue = {
    pageFields: pageFieldArray.fields,
    appendPage,
    movePage,
    removePage,
    appendTtsToPage,
  };

  return {
    form,
    value,
  };
}
