import { FilePlus2 } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { usePage } from "@/app/contexts/page-context/page-context";

export function AppendPageButton() {
  const { append } = usePage();

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
