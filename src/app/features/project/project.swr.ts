"use client";

import useSWR from "swr";
import type { ProjectFileSummary, SavedProject } from "@/_schemas";
import { fetchJson } from "@/_shared/lib/fetch-json";
import { getProjectApiPath } from "@/app/features/project/project-path";

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
  const projectApiPath = projectPath ? getProjectApiPath(projectPath) : null;
  const swr = useSWR<SavedProject>(projectApiPath, fetchJson, {
    revalidateOnFocus: false,
  });

  return {
    project: swr.data ?? null,
    projectError: swr.error instanceof Error ? swr.error.message : null,
    isProjectLoading: Boolean(projectApiPath) && !swr.data && !swr.error,
    mutateProject: async (project: SavedProject) => {
      if (!projectApiPath) {
        return;
      }

      await swr.mutate(project, { revalidate: false });
    },
    reloadProject: async () => {
      if (!projectApiPath) {
        return;
      }

      await swr.mutate();
    },
  };
}
