import { Link2, Unlink2 } from "lucide-react";
import { useController, useFormContext } from "react-hook-form";
import { Button } from "@/_shared/components/ui/button";
import { type DraftProject } from "@/_schemas";
import { cn } from "@/_shared/lib/utils";
import { useTsmlEditor } from "@/app/features/editor/tsml-editor.hook";
import type { TsmlPhrase } from "@/app/features/editor/tsml";

function MoraButtons({
  moraButtons,
}: {
  moraButtons: Array<{ label: string; active: boolean; onClick: () => void }>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {moraButtons.map((button, index) => (
        <Button
          key={index}
          type="button"
          size="sm"
          variant={button.active ? "default" : "outline"}
          onClick={button.onClick}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}

function ChainButton({
  isChained,
  onToggleChain,
}: {
  isChained: boolean;
  onToggleChain?: () => void;
}) {
  if (!onToggleChain) {
    return null;
  }

  const { icon, label, toneClass } = getChainButtonContent(isChained);

  return (
    <Button
      type="button"
      size="icon-sm"
      variant="outline"
      onClick={onToggleChain}
      title={label}
      aria-label={label}
      className={cn(toneClass)}
    >
      {icon}
    </Button>
  );
}

function getChainButtonContent(isChained: boolean) {
  if (isChained) {
    return {
      label: "連結中",
      icon: <Link2 />,
      toneClass: "text-accent-foreground",
    };
  }

  return {
    label: "連結なし",
    icon: <Unlink2 />,
    toneClass: "text-muted-foreground",
  };
}

function createToggleChainHandler({
  fieldOnChange,
  isChained,
  phraseIndex,
  setPhraseBoundaryChain,
  updateDocument,
  wordIndex,
}: {
  fieldOnChange: (value: string) => void;
  isChained: boolean;
  phraseIndex: number;
  setPhraseBoundaryChain: ReturnType<typeof useTsmlEditor>["setPhraseBoundaryChain"];
  updateDocument: ReturnType<typeof useTsmlEditor>["updateDocument"];
  wordIndex: number;
}) {
  return () => {
    updateDocument((document) => {
      setPhraseBoundaryChain(document, phraseIndex, wordIndex, !isChained);
    }, fieldOnChange);
  };
}

function getEditableWordData({
  getWordAttribute,
  splitPronunciationIntoMoras,
  word,
}: {
  getWordAttribute: ReturnType<typeof useTsmlEditor>["getWordAttribute"];
  splitPronunciationIntoMoras: ReturnType<typeof useTsmlEditor>["splitPronunciationIntoMoras"];
  word: Parameters<ReturnType<typeof useTsmlEditor>["getWordAttribute"]>[0];
}) {
  const pronunciation = getWordAttribute(word, "pronunciation") ?? "";
  const moras = splitPronunciationIntoMoras(pronunciation);
  const hl = getWordAttribute(word, "hl") ?? "";

  if (!hasEditableWordData(hl, moras)) {
    return null;
  }

  return { hl, moras };
}

function hasEditableWordData(hl: string, moras: string[]) {
  if (!hl || moras.length === 0) {
    return false;
  }

  return hl.length === moras.length;
}

function getChainState(
  getWordAttribute: ReturnType<typeof useTsmlEditor>["getWordAttribute"],
  nextWord: Parameters<ReturnType<typeof useTsmlEditor>["getWordAttribute"]>[0] | undefined,
) {
  return nextWord ? (getWordAttribute(nextWord, "chain") ?? "0") === "1" : false;
}

function TsmlWordCard({
  isChained,
  moraButtons,
  onToggleChain,
}: {
  isChained: boolean;
  moraButtons: Array<{ label: string; active: boolean; onClick: () => void }>;
  onToggleChain?: () => void;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-3 shadow-xs">
      <MoraButtons moraButtons={moraButtons} />
      <ChainButton isChained={isChained} onToggleChain={onToggleChain} />
    </div>
  );
}

function createMoraButtons({
  fieldOnChange,
  phraseIndex,
  toggleWordHlAtIndex,
  updateDocument,
  wordIndex,
}: {
  fieldOnChange: (value: string) => void;
  phraseIndex: number;
  toggleWordHlAtIndex: ReturnType<typeof useTsmlEditor>["toggleWordHlAtIndex"];
  updateDocument: ReturnType<typeof useTsmlEditor>["updateDocument"];
  wordIndex: number;
}) {
  return (mora: string, moraIndex: number, hl: string) => ({
    label: mora,
    active: hl[moraIndex] === "h",
    onClick: () => {
      updateDocument((document) => {
        const next = document.phrases[phraseIndex]?.words[wordIndex];
        if (next) {
          toggleWordHlAtIndex(next, moraIndex);
        }
      }, fieldOnChange);
    },
  });
}

function TsmlWordEditor({
  fieldOnChange,
  getWordAttribute,
  phrase,
  phraseIndex,
  setPhraseBoundaryChain,
  splitPronunciationIntoMoras,
  toggleWordHlAtIndex,
  updateDocument,
  word,
  wordIndex,
}: {
  fieldOnChange: (value: string) => void;
  getWordAttribute: ReturnType<typeof useTsmlEditor>["getWordAttribute"];
  phrase: { words: Array<Parameters<ReturnType<typeof useTsmlEditor>["getWordAttribute"]>[0]> };
  phraseIndex: number;
  setPhraseBoundaryChain: ReturnType<typeof useTsmlEditor>["setPhraseBoundaryChain"];
  splitPronunciationIntoMoras: ReturnType<typeof useTsmlEditor>["splitPronunciationIntoMoras"];
  toggleWordHlAtIndex: ReturnType<typeof useTsmlEditor>["toggleWordHlAtIndex"];
  updateDocument: ReturnType<typeof useTsmlEditor>["updateDocument"];
  word: Parameters<ReturnType<typeof useTsmlEditor>["getWordAttribute"]>[0];
  wordIndex: number;
}) {
  const editableWord = getEditableWordData({
    getWordAttribute,
    splitPronunciationIntoMoras,
    word,
  });
  if (!editableWord) {
    return null;
  }

  const nextWord = phrase.words[wordIndex + 1];
  const isChained = getChainState(getWordAttribute, nextWord);
  const toMoraButton = createMoraButtons({
    fieldOnChange,
    phraseIndex,
    toggleWordHlAtIndex,
    updateDocument,
    wordIndex,
  });

  return (
    <TsmlWordCard
      isChained={isChained}
      moraButtons={editableWord.moras.map((mora, moraIndex) =>
        toMoraButton(mora, moraIndex, editableWord.hl),
      )}
      onToggleChain={
        nextWord
          ? createToggleChainHandler({
              fieldOnChange,
              isChained,
              phraseIndex,
              setPhraseBoundaryChain,
              updateDocument,
              wordIndex,
            })
          : undefined
      }
    />
  );
}

function TsmlPhraseView({
  fieldOnChange,
  getWordAttribute,
  phrase,
  phraseIndex,
  setPhraseBoundaryChain,
  splitPronunciationIntoMoras,
  toggleWordHlAtIndex,
  updateDocument,
}: {
  fieldOnChange: (value: string) => void;
  getWordAttribute: ReturnType<typeof useTsmlEditor>["getWordAttribute"];
  phrase: TsmlPhrase;
  phraseIndex: number;
  setPhraseBoundaryChain: ReturnType<typeof useTsmlEditor>["setPhraseBoundaryChain"];
  splitPronunciationIntoMoras: ReturnType<typeof useTsmlEditor>["splitPronunciationIntoMoras"];
  toggleWordHlAtIndex: ReturnType<typeof useTsmlEditor>["toggleWordHlAtIndex"];
  updateDocument: ReturnType<typeof useTsmlEditor>["updateDocument"];
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {phrase.words.map((word, wordIndex) => {
        return (
          <TsmlWordEditor
            key={`${phraseIndex}-${wordIndex}`}
            fieldOnChange={fieldOnChange}
            getWordAttribute={getWordAttribute}
            phrase={phrase}
            phraseIndex={phraseIndex}
            setPhraseBoundaryChain={setPhraseBoundaryChain}
            splitPronunciationIntoMoras={splitPronunciationIntoMoras}
            toggleWordHlAtIndex={toggleWordHlAtIndex}
            updateDocument={updateDocument}
            word={word}
            wordIndex={wordIndex}
          />
        );
      })}
    </div>
  );
}

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
        <TsmlPhraseView
          key={`phrase-${phraseIndex}`}
          fieldOnChange={field.onChange}
          getWordAttribute={getWordAttribute}
          phrase={phrase}
          phraseIndex={phraseIndex}
          setPhraseBoundaryChain={setPhraseBoundaryChain}
          splitPronunciationIntoMoras={splitPronunciationIntoMoras}
          toggleWordHlAtIndex={toggleWordHlAtIndex}
          updateDocument={updateDocument}
        />
      ))}
    </div>
  );
}
