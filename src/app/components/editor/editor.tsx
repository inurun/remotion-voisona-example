"use client";

import { useEffect, useState } from "react";
import { Controller, FormProvider, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import {
  ArrowDown,
  ArrowUp,
  FilePlus2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Volume2,
} from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/_shared/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { Field, FieldError, FieldGroup } from "@/_shared/components/ui/field";
import { Input } from "@/_shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_shared/components/ui/select";
import { Separator } from "@/_shared/components/ui/separator";
import { Textarea } from "@/_shared/components/ui/textarea";
import { type DraftProject, type SavedProject } from "@/_schemas";
import { cn } from "@/_shared/lib/utils";
import { EditorContextProvider, useEditorContext } from "@/app/features/editor/editor-context";
import { getVoiceValue, useEditorForm } from "@/app/features/editor/editor-form";
import { RichTextEditor } from "@/app/features/editor/rich-text-editor";
import { TsmlEditor } from "@/app/features/editor/tsml-editor";
import { useEditorActions } from "@/app/features/editor/editor-actions";
import { type VoiceState } from "@/app/features/voisona/voices";

export default function Editor({
  initialProject,
  voices,
  onLoadVoices,
  editorActions,
}: {
  initialProject: SavedProject;
  voices: VoiceState;
  onLoadVoices: () => Promise<void>;
  editorActions: ReturnType<typeof useEditorActions>;
}) {
  const { form, pageFields, appendPage, createDraftTts, movePage, removePage } = useEditorForm({
    initialProject,
    voiceOptions: voices.options,
  });
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);
  const [selectedTtsIndex, setSelectedTtsIndex] = useState<number | null>(null);
  const [pendingTextFocus, setPendingTextFocus] = useState<{
    pageIndex: number;
    ttsIndex: number;
  } | null>(null);
  const canRunTts = voices.status === "ready" && voices.options.length > 0 && !editorActions.saving;

  function appendTtsToPage(pageIndex: number) {
    const page = form.getValues(`pages.${pageIndex}`);
    if (!page) {
      return;
    }

    const sourceTts =
      pageIndex === selectedPageIndex && selectedTtsIndex !== null
        ? page.tts[selectedTtsIndex]
        : undefined;
    const nextItem = createDraftTts();
    if (sourceTts?.voiceName) {
      nextItem.voiceName = sourceTts.voiceName;
      nextItem.voiceVersion = sourceTts.voiceVersion ?? "";
    }

    const nextTts = [...page.tts, nextItem];
    form.setValue(`pages.${pageIndex}.tts`, nextTts, {
      shouldDirty: true,
    });
    setSelectedPageIndex(pageIndex);
    setSelectedTtsIndex(nextTts.length - 1);
    setPendingTextFocus({
      pageIndex,
      ttsIndex: nextTts.length - 1,
    });
  }

  async function analyzeTts(pageIndex: number, ttsIndex: number) {
    const item = form.getValues(`pages.${pageIndex}.tts.${ttsIndex}`);
    if (!item) {
      return;
    }

    const busy = editorActions.busyById[item.id];
    if (!canRunTts || !(item.text ?? "").trim() || !item.voiceName || busy) {
      return;
    }

    const analyzedText = await editorActions.analyzeItem(item);
    if (!analyzedText) {
      return;
    }
    form.setValue(`pages.${pageIndex}.tts.${ttsIndex}.speech.analyzedText`, analyzedText, {
      shouldDirty: true,
    });
  }

  useHotkeys(
    "mod+s",
    (event) => {
      event.preventDefault();
      void form.handleSubmit(async (values) => {
        await editorActions.saveProject(values);
      })();
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [editorActions, form],
  );

  useHotkeys(
    "mod+enter",
    (event) => {
      event.preventDefault();
      if (selectedPageIndex === null) {
        return;
      }
      appendTtsToPage(selectedPageIndex);
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [selectedPageIndex, selectedTtsIndex, form, voices.options],
  );

  useHotkeys(
    "mod+shift+s",
    (event) => {
      event.preventDefault();
      const activeElement = document.activeElement;
      if (!(activeElement instanceof HTMLTextAreaElement)) {
        return;
      }
      if (activeElement.dataset.ttsHotkeyTarget !== "text") {
        return;
      }

      const pageIndex = Number(activeElement.dataset.pageIndex);
      const ttsIndex = Number(activeElement.dataset.ttsIndex);
      if (Number.isNaN(pageIndex) || Number.isNaN(ttsIndex)) {
        return;
      }

      void analyzeTts(pageIndex, ttsIndex);
    },
    {
      enableOnContentEditable: true,
      enableOnFormTags: true,
      preventDefault: true,
    },
    [canRunTts, editorActions.busyById, form],
  );

  useEffect(() => {
    if (pageFields.length === 0) {
      setSelectedPageIndex(null);
      setSelectedTtsIndex(null);
      return;
    }

    setSelectedPageIndex((current) => {
      if (current === null) {
        return 0;
      }
      return current < pageFields.length ? current : pageFields.length - 1;
    });
  }, [pageFields.length]);

  useEffect(() => {
    if (!pendingTextFocus) {
      return;
    }

    const fieldName =
      `pages.${pendingTextFocus.pageIndex}.tts.${pendingTextFocus.ttsIndex}.text` as const;
    let retryFrame: number | null = null;

    const focusAndScroll = () => {
      form.setFocus(fieldName);
      const textArea = document.querySelector<HTMLTextAreaElement>(`textarea[name="${fieldName}"]`);
      if (textArea) {
        textArea.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      setPendingTextFocus(null);
    };

    const frame = window.requestAnimationFrame(() => {
      const textArea = document.querySelector<HTMLTextAreaElement>(`textarea[name="${fieldName}"]`);
      if (textArea) {
        focusAndScroll();
        return;
      }

      retryFrame = window.requestAnimationFrame(() => {
        focusAndScroll();
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (retryFrame != null) {
        window.cancelAnimationFrame(retryFrame);
      }
    };
  }, [form, pendingTextFocus, selectedPageIndex]);

  const contextValue = {
    busyById: editorActions.busyById,
    canRunTts,
    pageFields,
    message: editorActions.message,
    onAnalyzeTts: analyzeTts,
    onAppendPage: () => {
      setSelectedPageIndex(pageFields.length);
      setSelectedTtsIndex(null);
      appendPage();
    },
    onAppendTtsToPage: appendTtsToPage,
    onMovePageDown: (index: number) => {
      if (index >= pageFields.length - 1) {
        return;
      }
      movePage(index, index + 1);
      setSelectedPageIndex(index + 1);
    },
    onMovePageUp: (index: number) => {
      if (index <= 0) {
        return;
      }
      movePage(index, index - 1);
      setSelectedPageIndex(index - 1);
    },
    onPreviewTts: async (pageIndex: number, ttsIndex: number) => {
      await editorActions.previewItem(form.getValues(`pages.${pageIndex}.tts.${ttsIndex}`));
    },
    onRemovePage: (index: number) => {
      setSelectedPageIndex((current) => {
        if (current === null) {
          return current;
        }
        if (index < current) {
          return current - 1;
        }
        if (index > current) {
          return current;
        }
        const nextLength = pageFields.length - 1;
        if (nextLength <= 0) {
          return null;
        }
        return index < nextLength ? index : nextLength - 1;
      });
      setSelectedTtsIndex(null);
      removePage(index);
    },
    onSave: () => {
      void form.handleSubmit(async (values) => {
        await editorActions.saveProject(values);
      })();
    },
    onSelectPage: (index: number) => {
      setSelectedPageIndex(index);
      setSelectedTtsIndex(0);
    },
    onSelectTts: (index: number | null) => {
      setSelectedTtsIndex(index);
    },
    error: editorActions.error,
    saving: editorActions.saving,
    selectedPageIndex,
    selectedTtsIndex,
    createDraftTts,
    voiceSelectOptions: voices.options,
    voices,
    onLoadVoices,
  };

  return (
    <FormProvider {...form}>
      <EditorContextProvider value={contextValue}>
        <section className="flex flex-col gap-4">
          <EditorPane />
        </section>
        <section className="flex flex-col gap-4 xl:sticky xl:top-6">
          <ConfigPane />
        </section>
      </EditorContextProvider>
    </FormProvider>
  );
}

function EditorPane() {
  const { canRunTts, onAppendPage, onLoadVoices, onSave, pageFields, saving, voices } =
    useEditorContext();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-xl">Editor</CardTitle>
          <CardAction className="flex flex-wrap items-center justify-end gap-2">
            <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {voices.status === "loading"
                ? "voices loading"
                : voices.status === "ready"
                  ? `${voices.options.length} voices`
                  : "voices unavailable"}
            </span>
            <Button
              type="button"
              size="icon"
              title="voices 再取得"
              aria-label="voices 再取得"
              variant="outline"
              onClick={() => void onLoadVoices()}
            >
              <RefreshCw className={voices.status === "loading" ? "animate-spin" : undefined} />
            </Button>
            <Button
              type="button"
              size="icon"
              title="ページ追加"
              aria-label="ページ追加"
              variant="secondary"
              onClick={onAppendPage}
            >
              <FilePlus2 />
            </Button>
            <Button
              type="button"
              disabled={!canRunTts || pageFields.length === 0}
              size="icon"
              onClick={onSave}
              title={saving ? "Saving" : "Save"}
              aria-label={saving ? "Saving" : "Save"}
            >
              <Save className={saving ? "animate-pulse" : undefined} />
            </Button>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <EditorFeedback />
        <div className="grid gap-4">
          <PageList />
          <SelectedPageEditor />
        </div>
      </CardContent>
    </Card>
  );
}

function EditorFeedback() {
  const { error, message, voices } = useEditorContext();

  return (
    <>
      {voices.status === "error" ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {voices.error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
    </>
  );
}

function PageList() {
  const { onSelectPage, pageFields, selectedPageIndex } = useEditorContext();

  return (
    <div className="flex flex-wrap gap-2">
      {pageFields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          ページがない。追加して開始。
        </div>
      ) : null}
      {pageFields.map((field, index) => (
        <button
          key={field.fieldKey}
          type="button"
          onClick={() => onSelectPage(index)}
          className={cn(
            "grid cursor-pointer gap-2 rounded-xl border p-3 text-left transition-colors",
            selectedPageIndex === index ? "border-primary bg-primary/8" : "border-border bg-card",
          )}
        >
          <div className="grid gap-1">
            <div className="text-xs text-muted-foreground">Page {index + 1}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function SelectedPageEditor() {
  const { pageFields, selectedPageIndex } = useEditorContext();

  if (pageFields.length === 0 || selectedPageIndex === null) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
        ページを選ぶと本文と tts を編集できる。
      </div>
    );
  }

  const selectedPage = pageFields[selectedPageIndex];
  if (!selectedPage) {
    return null;
  }

  return <SelectedPageEditorContent key={selectedPage.id} pageIndex={selectedPageIndex} />;
}

function SelectedPageEditorContent({ pageIndex }: { pageIndex: number }) {
  const {
    onAppendTtsToPage,
    onMovePageDown,
    onMovePageUp,
    onRemovePage,
    onSelectTts,
    pageFields,
    selectedTtsIndex,
  } = useEditorContext();
  const { control } = useFormContext<DraftProject>();
  const ttsName = `pages.${pageIndex}.tts` as const;
  const { fields, remove } = useFieldArray({
    control,
    keyName: "fieldKey",
    name: ttsName,
  });

  useEffect(() => {
    if (fields.length === 0) {
      onSelectTts(null);
      return;
    }

    if (selectedTtsIndex === null) {
      onSelectTts(0);
      return;
    }

    if (selectedTtsIndex >= fields.length) {
      onSelectTts(fields.length - 1);
    }
  }, [fields.length, onSelectTts, selectedTtsIndex]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">Page {pageIndex + 1}</div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={pageIndex === 0}
            title="上へ"
            aria-label="上へ"
            onClick={() => {
              onMovePageUp(pageIndex);
            }}
          >
            <ArrowUp />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            disabled={pageIndex === pageFields.length - 1}
            title="下へ"
            aria-label="下へ"
            onClick={() => {
              onMovePageDown(pageIndex);
            }}
          >
            <ArrowDown />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="destructive"
            title="削除"
            aria-label="削除"
            onClick={() => {
              onRemovePage(pageIndex);
            }}
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <Controller
        name={`pages.${pageIndex}.richText`}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="grid gap-2">
            <RichTextEditor value={field.value ?? ""} onChange={field.onChange} />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <div className="flex justify-end">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          title="TTS 追加"
          aria-label="TTS 追加"
          onClick={() => {
            onAppendTtsToPage(pageIndex);
          }}
        >
          <Plus />
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
          tts がない。追加して開始。
        </div>
      ) : (
        <FieldGroup className="gap-2">
          {fields.map((field, index) => (
            <div key={field.fieldKey} className="grid">
              {index > 0 ? <Separator className="bg-border/70" /> : null}
              <TtsItem
                index={index}
                pageIndex={pageIndex}
                onRemove={() => {
                  onSelectTts(
                    fields.length <= 1
                      ? null
                      : index < fields.length - 1
                        ? index
                        : fields.length - 2,
                  );
                  remove(index);
                }}
              />
            </div>
          ))}
        </FieldGroup>
      )}
    </div>
  );
}

function TtsItem({
  pageIndex,
  index,
  onRemove,
}: {
  pageIndex: number;
  index: number;
  onRemove: () => void;
}) {
  const { busyById, onSelectTts, selectedTtsIndex, voiceSelectOptions } = useEditorContext();
  const { control, setValue } = useFormContext<DraftProject>();
  const itemId = useWatch({ control, name: `pages.${pageIndex}.tts.${index}.id` });
  const voiceVersion = useWatch({ control, name: `pages.${pageIndex}.tts.${index}.voiceVersion` });
  const busy = itemId ? busyById[itemId] : undefined;

  return (
    <article
      className={cn(
        "grid gap-2 rounded-xl px-3 py-3",
        selectedTtsIndex === index ? "bg-muted/20" : "bg-card",
      )}
    >
      <div className="flex items-center gap-3">
        {busy ? (
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {busy}
          </span>
        ) : null}
      </div>

      <Controller
        name={`pages.${pageIndex}.tts.${index}.voiceName`}
        control={control}
        render={({ field: controllerField, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <div className="flex gap-2">
              <Select
                name={controllerField.name}
                value={getVoiceValue({
                  voiceName: controllerField.value ?? "",
                  voiceVersion: voiceVersion ?? "",
                })}
                onValueChange={(value) => {
                  if (!value) {
                    return;
                  }
                  const [nextVoiceName, nextVoiceVersion] = value.split("::");
                  controllerField.onChange(nextVoiceName);
                  setValue(`pages.${pageIndex}.tts.${index}.voiceVersion`, nextVoiceVersion ?? "", {
                    shouldDirty: true,
                  });
                  onSelectTts(index);
                }}
              >
                <SelectTrigger aria-invalid={fieldState.invalid} className="w-full">
                  <SelectValue placeholder="Actor" />
                </SelectTrigger>
                <SelectContent>
                  {voiceSelectOptions.map((option) => (
                    <SelectItem
                      key={`${option.voiceName}:${option.voiceVersion ?? ""}`}
                      value={`${option.voiceName}::${option.voiceVersion ?? ""}`}
                    >
                      {option.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                size="icon"
                variant="destructive"
                onClick={onRemove}
                title="削除"
                aria-label="削除"
              >
                <Trash2 />
              </Button>
            </div>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name={`pages.${pageIndex}.tts.${index}.text`}
        control={control}
        render={({ field: controllerField, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <Textarea
              {...controllerField}
              value={controllerField.value ?? ""}
              data-page-index={pageIndex}
              data-tts-index={index}
              data-tts-hotkey-target="text"
              aria-invalid={fieldState.invalid}
              placeholder="Text"
              rows={3}
              onChange={(event) => {
                const nextText = event.target.value;
                controllerField.onChange(nextText);
                setValue(`pages.${pageIndex}.tts.${index}.readText`, nextText, {
                  shouldDirty: true,
                });
              }}
              onFocus={() => {
                onSelectTts(index);
              }}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </article>
  );
}

function ConfigPane() {
  const { pageFields, selectedPageIndex, selectedTtsIndex } = useEditorContext();
  const selectedPage = selectedPageIndex === null ? null : (pageFields[selectedPageIndex] ?? null);

  if (
    pageFields.length === 0 ||
    selectedPageIndex === null ||
    selectedTtsIndex === null ||
    !selectedPage?.tts[selectedTtsIndex]
  ) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Config</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            tts を選ぶと Read と TSML を編集できる。
          </div>
        </CardContent>
      </Card>
    );
  }

  return <ConfigPaneContent pageIndex={selectedPageIndex} ttsIndex={selectedTtsIndex} />;
}

function ConfigPaneContent({ pageIndex, ttsIndex }: { pageIndex: number; ttsIndex: number }) {
  const { busyById, canRunTts, onAnalyzeTts, onPreviewTts } = useEditorContext();
  const { control } = useFormContext<DraftProject>();
  const itemId = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.id` });
  const text = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.text` });
  const voiceName = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.voiceName` });
  const busy = itemId ? busyById[itemId] : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Config</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Controller
          name={`pages.${pageIndex}.tts.${ttsIndex}.readText`}
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <Input
                {...field}
                value={field.value ?? ""}
                aria-invalid={fieldState.invalid}
                placeholder="Read"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            disabled={!canRunTts || !(text ?? "").trim() || !voiceName || Boolean(busy)}
            onClick={() => {
              void onAnalyzeTts(pageIndex, ttsIndex);
            }}
            title={busy === "analyze" ? "Analyzing" : "Analyze"}
            aria-label={busy === "analyze" ? "Analyzing" : "Analyze"}
          >
            <Sparkles className={busy === "analyze" ? "animate-pulse" : undefined} />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            disabled={!canRunTts || !(text ?? "").trim() || !voiceName || Boolean(busy)}
            onClick={() => {
              void onPreviewTts(pageIndex, ttsIndex);
            }}
            title={busy === "preview" ? "Previewing" : "Preview"}
            aria-label={busy === "preview" ? "Previewing" : "Preview"}
          >
            <Volume2 className={busy === "preview" ? "animate-pulse" : undefined} />
          </Button>
        </div>

        <TsmlEditor name={`pages.${pageIndex}.tts.${ttsIndex}.speech.analyzedText`} />
      </CardContent>
    </Card>
  );
}
