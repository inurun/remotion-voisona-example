import { Clapperboard, Globe, Save } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { SidebarTrigger } from "@/_shared/components/ui/sidebar";
import { RenderDialog } from "@/app/components/app-header/render-dialog/render-dialog";
import { useEditor } from "@/app/features/editor";
import { useRender } from "@/app/features/render";

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
          <h1 className="font-heading tracking-tight text-xl font-bold">
            Remotion + VoiSona Template
          </h1>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            title={saving ? "Saving" : "Save"}
            onClick={onSave}
          >
            <Save className={saving ? "animate-pulse" : undefined} />
            {saving ? "Saving" : "Save"}
          </Button>
          <Button type="button" title="Render" onClick={openRenderDialog}>
            <Clapperboard />
            Render
          </Button>
          {/* TODO: */}
          <Button type="button" title="Render">
            <Globe />
            Publish
          </Button>
        </div>
      </header>
      <RenderDialog />
    </>
  );
}
