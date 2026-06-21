"use client";

import type React from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/_shared/components/ui/sidebar";
import type { SidebarAppShellProps } from "@/app/core/app.types";
import { ProjectSidebar } from "@/app/features/project/project-sidebar";

const SIDEBAR_PROVIDER_STYLE = {
  "--sidebar-width-icon": "2rem",
} as React.CSSProperties;

function AppLayout({ children }: Pick<SidebarAppShellProps, "children">) {
  return (
    <SidebarInset>
      <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
          <div className="sm:hidden">
            <SidebarTrigger />
          </div>
          <div className="grid gap-2">
            <h1 className="font-heading text-3xl tracking-tight sm:text-4xl">
              Remotion + VoiSona Template
            </h1>
          </div>
        </header>
        {children}
      </main>
    </SidebarInset>
  );
}

export function SidebarAppShell({
  projects,
  selectedProjectPath,
  showSidebar,
  children,
}: SidebarAppShellProps) {
  return (
    <SidebarProvider defaultOpen style={SIDEBAR_PROVIDER_STYLE}>
      {showSidebar ? (
        <>
          <ProjectSidebar projects={projects} selectedProjectPath={selectedProjectPath} />
          <SidebarRail />
        </>
      ) : null}
      <AppLayout>{children}</AppLayout>
    </SidebarProvider>
  );
}
