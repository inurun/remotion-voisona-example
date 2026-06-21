import { Sparkles, Volume2 } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/_shared/components/ui/button";
import { type DraftProject } from "@/_schemas";
import { useEditor } from "@/app/contexts/editor-context/editor-context";

function isVoiceActionDisabled({
  busy,
  canRunTts,
  text,
  voiceName,
}: {
  busy?: string;
  canRunTts: boolean;
  text?: string;
  voiceName?: string;
}) {
  if (!canRunTts || Boolean(busy)) {
    return true;
  }

  if (!(text ?? "").trim()) {
    return true;
  }

  return !voiceName;
}

function AnalyzeButton({
  busy,
  disabled,
  onClick,
}: {
  busy?: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      disabled={disabled}
      onClick={onClick}
      title={busy === "analyze" ? "Analyzing" : "Analyze"}
      aria-label={busy === "analyze" ? "Analyzing" : "Analyze"}
    >
      <Sparkles className={busy === "analyze" ? "animate-pulse" : undefined} />
    </Button>
  );
}

function PreviewButton({
  busy,
  disabled,
  onClick,
}: {
  busy?: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      title={busy === "preview" ? "Previewing" : "Preview"}
      aria-label={busy === "preview" ? "Previewing" : "Preview"}
    >
      <Volume2 className={busy === "preview" ? "animate-pulse" : undefined} />
    </Button>
  );
}

export function ConfigActions() {
  const { busyById, canRunTts, onAnalyzeTts, onPreviewTts, selectedPageIndex, selectedTtsIndex } =
    useEditor();
  const { control } = useFormContext<DraftProject>();
  const pageIndex = selectedPageIndex ?? 0;
  const ttsIndex = selectedTtsIndex ?? 0;
  const itemId = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.id` });
  const text = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.text` });
  const voiceName = useWatch({ control, name: `pages.${pageIndex}.tts.${ttsIndex}.voiceName` });

  if (selectedPageIndex === null || selectedTtsIndex === null) {
    return null;
  }

  const busy = itemId ? busyById[itemId] : undefined;
  const disabled = isVoiceActionDisabled({ busy, canRunTts, text, voiceName });

  return (
    <div className="flex flex-wrap gap-2">
      <AnalyzeButton
        busy={busy}
        disabled={disabled}
        onClick={() => void onAnalyzeTts(selectedPageIndex, selectedTtsIndex)}
      />
      <PreviewButton
        busy={busy}
        disabled={disabled}
        onClick={() => void onPreviewTts(selectedPageIndex, selectedTtsIndex)}
      />
    </div>
  );
}
