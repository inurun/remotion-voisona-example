import { useMemo } from "react";
import { getProjectPathFromLocation } from "@/app/features/project/project-path";
import { SelectedProjectWorkspace } from "../components/selected-project-workspace";
import { SidebarInset, SidebarProvider, SidebarRail } from "@/_shared/components/ui/sidebar";
import { ProjectSidebar } from "../features/project/project-sidebar";

const SIDEBAR_PROVIDER_STYLE = {
  "--sidebar-width-icon": "2rem",
} as React.CSSProperties;

export default function App() {
  const selectedProjectPath = useMemo(
    () => getProjectPathFromLocation(window.location.pathname),
    [],
  );

  return (
    <SidebarProvider defaultOpen style={SIDEBAR_PROVIDER_STYLE}>
      <ProjectSidebar selectedProjectPath={selectedProjectPath} />
      <SidebarRail />
      <SidebarInset>
        <SelectedProjectWorkspace projectPath={selectedProjectPath} />
      </SidebarInset>
    </SidebarProvider>
  );
}
