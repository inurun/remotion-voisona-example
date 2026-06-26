import { Link2, Unlink2 } from "lucide-react";
import { useController, useFormContext } from "react-hook-form";
import { Button } from "@/_shared/components/ui/button";
import { type DraftProject } from "@/_schemas";
import { cn } from "@/_shared/lib/utils";
import {
  type ParsedTsmlState,
  type TsmlMoraButton,
  type TsmlPhraseViewModel,
  useTsmlEditor,
} from "./tsml-field.hook";
import { usePage } from "@/app/features/page";
import { useTts } from "@/app/features/tts";

function MoraButtons({ moraButtons }: { moraButtons: TsmlMoraButton[] }) {
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

function TsmlWordCard({
  isChained,
  moraButtons,
  onToggleChain,
}: {
  isChained: boolean;
  moraButtons: TsmlMoraButton[];
  onToggleChain?: () => void;
}) {
  return (
    <div className="flex gap-3 bg-card">
      <MoraButtons moraButtons={moraButtons} />
      <ChainButton isChained={isChained} onToggleChain={onToggleChain} />
    </div>
  );
}

function TsmlPhraseView({ phrase }: { phrase: TsmlPhraseViewModel }) {
  return (
    <div className="flex flex-wrap gap-3">
      {phrase.words.map((word) => {
        return (
          <TsmlWordCard
            key={word.key}
            isChained={word.isChained}
            moraButtons={word.moraButtons}
            onToggleChain={word.onToggleChain}
          />
        );
      })}
    </div>
  );
}

function TsmlStatusMessage({ parsed }: { parsed: ParsedTsmlState }) {
  if (parsed.status === "ready") {
    return null;
  }

  if (parsed.status === "error") {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
        {parsed.message}
      </div>
    );
  }

  const message = parsed.status === "loading" ? "TSML を読み込み中..." : "No TSML";

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function TsmlReadyPhrases({
  getPhraseViews,
  onChange,
  parsed,
}: {
  getPhraseViews: (fieldOnChange: (value: string) => void) => TsmlPhraseViewModel[];
  onChange: (value: string) => void;
  parsed: ParsedTsmlState;
}) {
  if (parsed.status !== "ready") {
    return null;
  }

  return (
    <div className="grid gap-3">
      {getPhraseViews(onChange).map((phrase) => (
        <TsmlPhraseView key={phrase.key} phrase={phrase} />
      ))}
    </div>
  );
}

function TsmlEditor() {
  const { selectedPageIndex } = usePage();
  const { selectedTtsIndex } = useTts();

  const name =
    `pages.${selectedPageIndex ?? 0}.tts.${selectedTtsIndex ?? 0}.speech.analyzedText` as const;

  const { control } = useFormContext<DraftProject>();
  const { field } = useController({
    control,
    name,
  });
  const { parsed, getPhraseViews } = useTsmlEditor(field.value);

  return (
    <>
      <TsmlStatusMessage parsed={parsed} />
      <TsmlReadyPhrases parsed={parsed} getPhraseViews={getPhraseViews} onChange={field.onChange} />
    </>
  );
}

export function TsmlField() {
  const { selectedPageIndex } = usePage();
  const { selectedTtsIndex } = useTts();

  if (selectedPageIndex === null || selectedTtsIndex === null) {
    return null;
  }

  return <TsmlEditor />;
}
