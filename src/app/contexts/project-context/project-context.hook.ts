import useSWR from "swr";
import type { ProjectFileSummary, SavedProject } from "@/_schemas";
import { fetchJson } from "@/_shared/lib/fetch-json";
import { getProjectApiPath, getProjectPathFromLocation } from "@/app/features/project/project-path";
import { toast } from "sonner";

export type ProjectContextValue = {
  projects: ProjectFileSummary[];
  projectPath: string | null;
  project: SavedProject;
  reloadProjects: () => Promise<void>;
  mutateProject: (project: SavedProject) => Promise<void>;
  reloadProject: () => Promise<void>;
};

function getProjectRequestPath(projectPath: string | null) {
  return projectPath ? getProjectApiPath(projectPath) : null;
}

async function mutateProjectIfPresent(
  projectApiPath: string | null,
  mutate: ReturnType<typeof useSWR<SavedProject>>["mutate"],
  project?: SavedProject,
) {
  if (!projectApiPath) {
    return;
  }

  if (project) {
    await mutate(project, { revalidate: false });
    return;
  }

  await mutate();
}

function useProjects() {
  const { data, mutate } = useSWR<ProjectFileSummary[]>("/api/projects", fetchJson, {
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
  const projectApiPath = getProjectRequestPath(projectPath);
  const { data, mutate } = useSWR<SavedProject>(projectApiPath, fetchJson, {
    revalidateOnFocus: false,
    onError(err, key, config) {
      console.error(err, key, config);
      toast.error("Project loading failed");
    },
  });

  return {
    project: data ?? { pages: [] },
    mutateProject: async (project: SavedProject) => {
      await mutateProjectIfPresent(projectApiPath, mutate, project);
    },
    reloadProject: async () => {
      await mutateProjectIfPresent(projectApiPath, mutate);
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
