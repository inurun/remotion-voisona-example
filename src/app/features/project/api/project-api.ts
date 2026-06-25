import type { DraftProject, ProjectFileSummary, SavedProject } from "@/_schemas";
import { api } from "@/_shared/lib/api-client";
import { parseApiJson } from "@/_shared/lib/fetch-json";

function encodeProjectPathForUrl(projectPath: string) {
  return projectPath
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export const projectKeys = {
  list: () => ["projects"] as const,
  detail: (projectPath: string) => ["project", projectPath] as const,
};

export async function fetchProjects() {
  return parseApiJson<ProjectFileSummary[]>(await api.projects.$get());
}

export async function fetchProject(projectPath: string) {
  const encodedPath = encodeProjectPathForUrl(projectPath);
  return parseApiJson<SavedProject>(
    await api.project[":projectPath{.+}"].$get({
      param: { projectPath: encodedPath },
    }),
  );
}

export async function saveProject(projectPath: string, project: DraftProject) {
  const encodedPath = encodeProjectPathForUrl(projectPath);
  return parseApiJson<SavedProject>(
    await api.project[":projectPath{.+}"].$post({
      param: { projectPath: encodedPath },
      json: project,
    } as {
      json: DraftProject;
      param: { projectPath: string };
    }),
  );
}
