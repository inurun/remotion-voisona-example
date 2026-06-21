"use client";

import { Loader2 } from "lucide-react";

export function AppLoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
