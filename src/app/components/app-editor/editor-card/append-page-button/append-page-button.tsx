import { FilePlus2 } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { useAppendPageButton } from "@/app/components/app-editor/editor-card/append-page-button/append-page-button.hook";

export function AppendPageButton() {
  const { append } = useAppendPageButton();

  return (
    <Button
      type="button"
      size="icon"
      title="ページ追加"
      aria-label="ページ追加"
      variant="secondary"
      onClick={append}
    >
      <FilePlus2 />
    </Button>
  );
}
