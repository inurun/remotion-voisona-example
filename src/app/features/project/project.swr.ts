import useSWR from "swr";
import type { ProjectFileSummary, SavedProject } from "@/_schemas";
import { fetchJson } from "@/_shared/lib/fetch-json";
import { getProjectApiPath } from "@/app/features/project/project-path";

function getProjectRequestPath(projectPath: string | null) {
  return projectPath ? getProjectApiPath(projectPath) : null;
}

function isProjectPending(
  projectApiPath: string | null,
  project: SavedProject | undefined,
  error: unknown,
) {
  return Boolean(projectApiPath) && !project && !error;
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

export function useProjects() {
  const { data, error, mutate } = useSWR<ProjectFileSummary[]>("/api/projects", fetchJson, {
    revalidateOnFocus: false,
  });

  return {
    projects: data ?? [],
    projectsError: error instanceof Error ? error.message : null,
    isProjectsLoading: !data && !error,
    reloadProjects: async () => {
      await mutate();
    },
  };
}

export function useProject(projectPath: string | null) {
  const projectApiPath = getProjectRequestPath(projectPath);
  const { data, error, mutate } = useSWR<SavedProject>(projectApiPath, fetchJson, {
    revalidateOnFocus: false,
  });

  return {
    project: data ?? null,
    projectError: error instanceof Error ? error.message : null,
    isProjectLoading: isProjectPending(projectApiPath, data, error),
    mutateProject: async (project: SavedProject) => {
      await mutateProjectIfPresent(projectApiPath, mutate, project);
    },
    reloadProject: async () => {
      await mutateProjectIfPresent(projectApiPath, mutate);
    },
  };
}
