import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortable, useSortable } from "@dnd-kit/react/sortable";
import { GripVertical, RefreshCw, RotateCcw, Settings } from "lucide-react";
import type { VoiceOption } from "@/_schemas";
import { Button } from "@/_shared/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/_shared/components/ui/dialog";
import { HotkeyInput } from "@/_shared/components/ui/hotkey-input";
import { Input } from "@/_shared/components/ui/input";
import { Separator } from "@/_shared/components/ui/separator";
import { getVoiceId, APP_HOTKEY_LABELS, type AppHotkeyAction } from "@/app/features/settings";
import { useSettingsDialog } from "@/app/components/app-sidebar/settings-dialog/use-settings-dialog";

function VoiceRow({
  error,
  index,
  hotkey,
  label,
  onHotkeyChange,
  onLabelChange,
  voice,
}: {
  error: string | undefined;
  index: number;
  hotkey: string;
  label: string;
  onHotkeyChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  voice: VoiceOption;
}) {
  const voiceId = getVoiceId(voice);
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({
    id: voiceId,
    index,
    transition: {
      duration: 160,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      idle: true,
    },
  });

  return (
    <div
      ref={ref}
      data-dragging={isDragging}
      data-drop-target={isDropTarget && !isDragging}
      className="grid gap-2 rounded-lg border border-border bg-card p-2 transition data-[dragging=true]:opacity-70 data-[drop-target=true]:border-primary/60"
    >
      <div className="grid grid-cols-[24px_minmax(0,1fr)_110px] items-center gap-2">
        <span
          ref={handleRef}
          className="inline-flex size-6 cursor-grab items-center justify-center rounded-md text-muted-foreground active:cursor-grabbing"
          title="Reorder"
          aria-label="Reorder"
        >
          <GripVertical className="size-4" />
        </span>
        <Input
          value={label}
          placeholder={voice.displayName}
          onChange={(event) => onLabelChange(event.target.value)}
        />
        <HotkeyInput
          value={hotkey}
          placeholder="ctrl+1"
          aria-invalid={Boolean(error)}
          onValueChange={onHotkeyChange}
        />
      </div>
      <div className="grid grid-cols-[24px_minmax(0,1fr)_110px] gap-2 text-xs text-muted-foreground">
        <span />
        <span className="truncate">{voice.displayName}</span>
        <span className="truncate text-destructive">{error}</span>
      </div>
    </div>
  );
}

function VoicesSection({ dialog }: { dialog: ReturnType<typeof useSettingsDialog> }) {
  const handleDragEnd = (event: DragEndEvent) => {
    if (event.canceled) {
      return;
    }

    const { source } = event.operation;
    if (!isSortable(source)) {
      return;
    }

    dialog.moveVoice(source.initialIndex, source.index);
  };

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Voices</h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void dialog.refreshVoices()}
          disabled={dialog.isRefreshing}
        >
          <RefreshCw />
          Refresh voices
        </Button>
      </div>
      {dialog.visibleVoices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          No voices.
        </div>
      ) : (
        <DragDropProvider onDragEnd={handleDragEnd}>
          <VoiceRows dialog={dialog} />
        </DragDropProvider>
      )}
    </section>
  );
}

function VoiceRows({ dialog }: { dialog: ReturnType<typeof useSettingsDialog> }) {
  return (
    <div className="grid max-h-[36vh] gap-2 overflow-y-auto pr-1">
      {dialog.visibleVoices.map((voice, index) => (
        <VoiceRowAdapter key={getVoiceId(voice)} dialog={dialog} index={index} voice={voice} />
      ))}
    </div>
  );
}

function VoiceRowAdapter({
  dialog,
  index,
  voice,
}: {
  dialog: ReturnType<typeof useSettingsDialog>;
  index: number;
  voice: VoiceOption;
}) {
  const setting = dialog.getVoiceSetting(voice);

  return (
    <VoiceRow
      index={index}
      voice={voice}
      label={setting.label}
      hotkey={setting.hotkey}
      error={dialog.getVoiceHotkeyError(voice)}
      onLabelChange={(value) => dialog.setVoiceLabel(voice, value)}
      onHotkeyChange={(value) => dialog.setVoiceHotkey(voice, value)}
    />
  );
}

function HotkeysSection({ dialog }: { dialog: ReturnType<typeof useSettingsDialog> }) {
  const actions = Object.keys(APP_HOTKEY_LABELS) as AppHotkeyAction[];

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium">Hotkeys</h3>
        <Button type="button" size="sm" variant="outline" onClick={dialog.resetHotkeys}>
          <RotateCcw />
          Reset hotkeys
        </Button>
      </div>
      <div className="grid gap-2">
        {actions.map((action) => {
          const error = dialog.getAppHotkeyError(action);
          return (
            <label
              key={action}
              className="grid grid-cols-[minmax(0,1fr)_160px] items-center gap-3 text-sm"
            >
              <span>{APP_HOTKEY_LABELS[action]}</span>
              <span className="grid gap-1">
                <HotkeyInput
                  value={dialog.draft.hotkeys[action]}
                  aria-invalid={Boolean(error)}
                  onValueChange={(value) => dialog.setAppHotkey(action, value)}
                />
                {error ? <span className="text-xs text-destructive">{error}</span> : null}
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

export function SettingsDialog() {
  const dialog = useSettingsDialog();

  return (
    <Dialog open={dialog.open} onOpenChange={dialog.handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Settings"
            aria-label="Settings"
          />
        }
      >
        <Settings />
      </DialogTrigger>
      <DialogContent className="w-[min(92vw,760px)]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-5">
          <VoicesSection dialog={dialog} />
          <Separator />
          <HotkeysSection dialog={dialog} />
        </div>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
          <Button type="button" disabled={!dialog.canSave} onClick={dialog.save}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
