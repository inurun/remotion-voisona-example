"use client";

import type React from "react";
import { SidebarInset, SidebarProvider, SidebarRail } from "@/_shared/components/ui/sidebar";
import type { SidebarAppShellProps } from "@/app/core/app.types";
import { ProjectSidebar } from "@/app/features/project/project-sidebar";

const SIDEBAR_PROVIDER_STYLE = {
  "--sidebar-width-icon": "2rem",
} as React.CSSProperties;

function AppLayout({ children }: Pick<SidebarAppShellProps, "children">) {
  return (
    <SidebarInset>
      <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-2 p-2">
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
