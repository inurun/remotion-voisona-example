import type { ProjectFileSummary, SavedProject } from "@/_schemas";
import {
  useProjectsQuery,
  useSelectedProjectQuery,
} from "@/app/features/project/swr/use-project-queries";

export type ProjectContextValue = {
  projects: ProjectFileSummary[];
  projectPath: string | null;
  project: SavedProject;
  reloadProjects: () => Promise<void>;
  mutateProject: (project: SavedProject) => Promise<void>;
  reloadProject: () => Promise<void>;
};

function getProjectPathFromLocation(pathname: string) {
  const normalizedPath = pathname.replace(/^\/+|\/+$/g, "");
  return normalizedPath ? decodeURIComponent(normalizedPath) : null;
}

export function useProjectProviderValue(): ProjectContextValue {
  const projectPath = getProjectPathFromLocation(window.location.pathname);

  const projects = useProjectsQuery();
  const selectedProject = useSelectedProjectQuery(projectPath);

  return {
    projectPath,
    ...projects,
    ...selectedProject,
  };
}
