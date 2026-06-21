import type React from "react";
import type { ProjectFileSummary } from "@/_schemas";

export type SidebarAppShellProps = {
  projects: ProjectFileSummary[];
  selectedProjectPath: string | null;
  showSidebar: boolean;
  children: React.ReactNode;
};
