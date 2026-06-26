import { FilePlus2 } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { useAppendPageButton } from "@/app/components/app-editor/editor-card/append-page-button/append-page-button.hook";
import type { ComponentProps, ReactNode } from "react";

type AppendPageButtonProps = {
  className?: string;
  icon?: ReactNode;
  label?: string;
  size?: ComponentProps<typeof Button>["size"];
};

export function AppendPageButton({
  className,
  icon = <FilePlus2 />,
  label,
  size = "icon",
}: AppendPageButtonProps) {
  const { append } = useAppendPageButton();

  return (
    <Button
      type="button"
      size={size}
      title="ページ追加"
      aria-label="ページ追加"
      variant="secondary"
      className={className}
      onClick={append}
    >
      {icon}
      {label ? <span>{label}</span> : null}
    </Button>
  );
}
