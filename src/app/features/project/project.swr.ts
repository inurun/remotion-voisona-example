"use client";

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
  const swr = useSWR<ProjectFileSummary[]>("/api/projects", fetchJson, {
    revalidateOnFocus: false,
  });

  return {
    projects: swr.data ?? [],
    projectsError: swr.error instanceof Error ? swr.error.message : null,
    isProjectsLoading: !swr.data && !swr.error,
    reloadProjects: async () => {
      await swr.mutate();
    },
  };
}

export function useProject(projectPath: string | null) {
  const projectApiPath = getProjectRequestPath(projectPath);
  const swr = useSWR<SavedProject>(projectApiPath, fetchJson, {
    revalidateOnFocus: false,
  });

  return {
    project: swr.data ?? null,
    projectError: swr.error instanceof Error ? swr.error.message : null,
    isProjectLoading: isProjectPending(projectApiPath, swr.data, swr.error),
    mutateProject: async (project: SavedProject) => {
      await mutateProjectIfPresent(projectApiPath, swr.mutate, project);
    },
    reloadProject: async () => {
      await mutateProjectIfPresent(projectApiPath, swr.mutate);
    },
  };
}
