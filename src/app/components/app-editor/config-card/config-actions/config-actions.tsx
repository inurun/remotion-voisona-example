import { Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { useConfigTtsActions } from "@/app/components/app-editor/config-card/config-actions/config-actions.hook";

function AnalyzeButton({
  disabled,
  isAnalyzing,
  onClick,
}: {
  disabled: boolean;
  isAnalyzing: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="secondary"
      disabled={disabled}
      onClick={onClick}
      title={isAnalyzing ? "Analyzing" : "Analyze"}
      aria-label={isAnalyzing ? "Analyzing" : "Analyze"}
    >
      <Sparkles className={isAnalyzing ? "animate-pulse" : undefined} />
    </Button>
  );
}

function PreviewButton({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      disabled={disabled}
      onClick={onClick}
      title="Preview"
      aria-label="Preview"
    >
      <Volume2 />
    </Button>
  );
}

export function ConfigActions() {
  const {
    analyzeDisabled,
    analyzeSelected,
    hasSelection,
    isAnalyzing,
    previewDisabled,
    previewSelected,
  } = useConfigTtsActions();

  if (!hasSelection) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <AnalyzeButton
        disabled={analyzeDisabled}
        isAnalyzing={isAnalyzing}
        onClick={analyzeSelected}
      />
      <PreviewButton disabled={previewDisabled} onClick={previewSelected} />
    </div>
  );
}
