import { Clapperboard, Save } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import { SidebarTrigger } from "@/_shared/components/ui/sidebar";
import { useAppHeader } from "@/app/components/app-header/app-header.hook";
import { RenderDialog } from "@/app/components/app-header/render-dialog";

export function AppHeader() {
  const {
    canSave,
    onSave,
    openRenderDialog,
    renderDialogOpen,
    renderError,
    renderExecuteDisabled,
    renderExecuteLabel,
    renderState,
    saving,
    setRenderDialogOpen,
    handleRenderExecute,
  } = useAppHeader();
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
          <Button
            type="button"
            size="icon"
            title={saving ? "Saving" : "Save"}
            disabled={!canSave}
            onClick={onSave}
          >
            <Save className={saving ? "animate-pulse" : undefined} />
          </Button>
        </div>
      </header>
      <RenderDialog
        open={renderDialogOpen}
        onOpenChange={setRenderDialogOpen}
        renderState={renderState}
        renderError={renderError}
        executeLabel={renderExecuteLabel}
        isExecuteDisabled={renderExecuteDisabled}
        onExecute={handleRenderExecute}
      />
    </>
  );
}
