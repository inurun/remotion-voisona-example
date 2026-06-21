"use client";

import type React from "react";
import { SidebarTrigger } from "@/_shared/components/ui/sidebar";

export function WorkspaceHeader({ actions }: { actions?: React.ReactNode }) {
  return (
    <header className="grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <div className="sm:hidden">
        <SidebarTrigger />
      </div>
      <div className="grid gap-1">
        <h1 className="font-heading text-lg tracking-tight sm:text-xl">
          Remotion + VoiSona Template
        </h1>
      </div>
      {actions ? <div className="flex items-center justify-end gap-2">{actions}</div> : null}
    </header>
  );
}
