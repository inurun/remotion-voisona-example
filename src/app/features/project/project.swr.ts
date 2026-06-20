"use client";

import useSWR from "swr";
import type { SavedProject } from "@/_schemas";
import { fetchJson } from "@/_shared/lib/fetch-json";

export function useProject() {
  const swr = useSWR<SavedProject>("/api/project", fetchJson, {
    revalidateOnFocus: false,
  });

  return {
    project: swr.data ?? null,
    projectError: swr.error instanceof Error ? swr.error.message : null,
    isProjectLoading: !swr.data && !swr.error,
    mutateProject: async (project: SavedProject) => {
      await swr.mutate(project, { revalidate: false });
    },
    reloadProject: async () => {
      await swr.mutate();
    },
  };
}
