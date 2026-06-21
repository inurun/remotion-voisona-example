"use client";

import { SidebarAppShell } from "@/app/components/app-shell";
import { SelectedProjectWorkspace } from "@/app/components/selected-project-workspace";
import { useToastError } from "@/app/components/use-toast-error";
import { useProjects } from "@/app/features/project/project.swr";

export function AppScreen({ selectedProjectPath }: { selectedProjectPath: string | null }) {
  const { projects, projectsError } = useProjects();

  useToastError(projectsError, "projects-load-error");

  return (
    <SidebarAppShell
      projects={projects}
      selectedProjectPath={selectedProjectPath}
      showSidebar={true}
    >
      <SelectedProjectWorkspace projectPath={selectedProjectPath} />
    </SidebarAppShell>
  );
}
