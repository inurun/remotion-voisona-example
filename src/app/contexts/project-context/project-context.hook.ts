import useSWR from "swr";
import type { ProjectFileSummary, SavedProject } from "@/_schemas";
import { fetchProject, fetchProjects, projectKeys } from "@/app/core/api/project";
import { toast } from "sonner";

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

async function mutateProjectIfPresent(
  projectPath: string | null,
  mutate: ReturnType<typeof useSWR<SavedProject>>["mutate"],
  project?: SavedProject,
) {
  if (!projectPath) {
    return;
  }

  if (project) {
    await mutate(project, { revalidate: false });
    return;
  }

  await mutate();
}

function useProjects() {
  const { data, mutate } = useSWR(projectKeys.list(), fetchProjects, {
    revalidateOnFocus: false,
    onError(err, key, config) {
      console.error(err, key, config);
      toast.error("Projects loading failed");
    },
  });

  return {
    projects: data ?? [],
    reloadProjects: async () => {
      await mutate();
    },
  };
}

function useSelectedProject(projectPath: string | null) {
  const { data, mutate } = useSWR(
    projectPath ? projectKeys.detail(projectPath) : null,
    () => fetchProject(projectPath!),
    {
      revalidateOnFocus: false,
      onError(err, key, config) {
        console.error(err, key, config);
        toast.error("Project loading failed");
      },
    },
  );

  return {
    project: data ?? { pages: [] },
    mutateProject: async (project: SavedProject) => {
      await mutateProjectIfPresent(projectPath, mutate, project);
    },
    reloadProject: async () => {
      await mutateProjectIfPresent(projectPath, mutate);
    },
  };
}

export function useProjectProviderValue(): ProjectContextValue {
  const projectPath = getProjectPathFromLocation(window.location.pathname);

  const projects = useProjects();
  const selectedProject = useSelectedProject(projectPath);

  return {
    projectPath,
    ...projects,
    ...selectedProject,
  };
}
