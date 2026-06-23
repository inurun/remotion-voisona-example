import { Clapperboard, Save } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { SidebarTrigger } from "@/_shared/components/ui/sidebar";
import { RenderDialog } from "@/app/components/app-header/render-dialog/render-dialog";
import { useEditor } from "@/app/contexts/editor-context/editor-context";
import { useRender } from "@/app/contexts/render-context/render-context";

export function AppHeader() {
  const { save: onSave, isPending: saving } = useEditor();
  const { openRenderDialog } = useRender();

  return (
    <>
      <header className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
        <div className="sm:hidden">
          <SidebarTrigger />
        </div>
        <div className="grid gap-1">
          <h1 className="font-heading text-lg tracking-tight sm:text-xl">
            Remotion + VoiSona Template
          </h1>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button type="button" size="icon" title="Render" onClick={openRenderDialog}>
            <Clapperboard />
          </Button>
          <Button type="button" size="icon" title={saving ? "Saving" : "Save"} onClick={onSave}>
            <Save className={saving ? "animate-pulse" : undefined} />
          </Button>
        </div>
      </header>
      <RenderDialog />
    </>
  );
}
