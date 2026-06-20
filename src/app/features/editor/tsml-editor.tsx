"use client";

import { Link2, Unlink2 } from "lucide-react";
import { useController, useFormContext } from "react-hook-form";

import { Button } from "@/_shared/components/ui/button";
import { type DraftProject } from "@/_schemas";
import { cn } from "@/_shared/lib/utils";
import { useTsmlEditor } from "@/app/features/editor/tsml-editor.hook";

export function TsmlEditor({
  name,
}: {
  name: `pages.${number}.tts.${number}.speech.analyzedText`;
}) {
  const { control } = useFormContext<DraftProject>();
  const { field } = useController({
    control,
    name,
  });
  const {
    parsed,
    getWordAttribute,
    setPhraseBoundaryChain,
    splitPronunciationIntoMoras,
    toggleWordHlAtIndex,
    updateDocument,
  } = useTsmlEditor(field.value);

  if (parsed.status === "loading") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        TSML を読み込み中...
      </div>
    );
  }

  if (parsed.status === "empty") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        No TSML
      </div>
    );
  }

  if (parsed.status === "error") {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {parsed.message}
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {parsed.document.phrases.map((phrase, phraseIndex) => (
        <div key={`phrase-${phraseIndex}`} className="flex flex-wrap gap-3">
          {phrase.words.map((word, wordIndex) => {
            const pronunciation = getWordAttribute(word, "pronunciation") ?? "";
            const moras = splitPronunciationIntoMoras(pronunciation);
            const hl = getWordAttribute(word, "hl") ?? "";
            const editable = Boolean(hl) && hl.length === moras.length && moras.length > 0;
            const nextWord = phrase.words[wordIndex + 1];
            const isChained = nextWord
              ? (getWordAttribute(nextWord, "chain") ?? "0") === "1"
              : false;

            if (!editable) {
              return null;
            }

            return (
              <div
                key={`${phraseIndex}-${wordIndex}`}
                className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-xs"
              >
                <div className="flex flex-wrap gap-2">
                  {moras.map((mora, moraIndex) => (
                    <Button
                      key={`${phraseIndex}-${wordIndex}-${moraIndex}`}
                      type="button"
                      size="sm"
                      variant={hl[moraIndex] === "h" ? "default" : "outline"}
                      onClick={() => {
                        updateDocument((document) => {
                          const next = document.phrases[phraseIndex]?.words[wordIndex];
                          if (!next) {
                            return;
                          }

                          toggleWordHlAtIndex(next, moraIndex);
                        }, field.onChange);
                      }}
                    >
                      {mora}
                    </Button>
                  ))}
                </div>
                {nextWord ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    onClick={() => {
                      updateDocument((document) => {
                        setPhraseBoundaryChain(document, phraseIndex, wordIndex, !isChained);
                      }, field.onChange);
                    }}
                    title={isChained ? "連結中" : "連結なし"}
                    aria-label={isChained ? "連結中" : "連結なし"}
                    className={cn(isChained ? "text-accent-foreground" : "text-muted-foreground")}
                  >
                    {isChained ? <Link2 /> : <Unlink2 />}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
