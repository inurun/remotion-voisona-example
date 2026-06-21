"use client";

import { AppLoadingOverlay } from "@/app/components/app-loading-overlay";
import { SidebarAppShell } from "@/app/components/app-shell";
import { SelectedProjectWorkspace } from "@/app/components/selected-project-workspace";
import { useToastError } from "@/app/components/use-toast-error";
import { useProjects } from "@/app/features/project/project.swr";

export function AppScreen({ selectedProjectPath }: { selectedProjectPath: string | null }) {
  const { projects, projectsError, isProjectsLoading } = useProjects();

  useToastError(projectsError, "projects-load-error");

  return (
    <SidebarAppShell
      projects={projects}
      selectedProjectPath={selectedProjectPath}
      showSidebar={true}
    >
      <SelectedProjectWorkspace projectPath={selectedProjectPath} />
      <AppLoadingOverlay visible={isProjectsLoading} />
    </SidebarAppShell>
  );
}
