import type { Hono } from "hono";
import { getServerEnv } from "@/server/core/env";
import { jsonError } from "@/server/_shared/http";
import { InvalidProjectPathError, ProjectNotFoundError } from "@/server/_shared/storage";
import { listProjects, loadProject, saveProject } from "./use-case";
import { projectContract } from "./contract";

function getProjectPath(pathParam: string | undefined) {
  const projectPath = pathParam?.trim();
  if (!projectPath) {
    throw new InvalidProjectPathError("Project path is required");
  }

  return decodeURIComponent(projectPath);
}

function getProjectErrorStatus(error: unknown) {
  if (error instanceof InvalidProjectPathError) {
    return 400;
  }

  if (error instanceof ProjectNotFoundError) {
    return 404;
  }

  return 500;
}

function getProjectErrorMessage(status: number, action: "load" | "save" | "list") {
  if (status === 400) {
    return "Invalid project path";
  }

  if (status === 404) {
    return "Project not found";
  }

  return action === "list" ? "Failed to list projects" : `Failed to ${action} project`;
}

export const registerProjectRoutes = <TApp extends Hono>(app: TApp) =>
  app
    .get("/projects", async (c) => {
      try {
        return c.json(projectContract.list.response.parse(await listProjects()));
      } catch (error) {
        const status = getProjectErrorStatus(error);
        return jsonError(c, status, error, getProjectErrorMessage(status, "list"));
      }
    })
    .get("/project/:projectPath{.+}", async (c) => {
      try {
        const projectPath = getProjectPath(c.req.param("projectPath"));
        return c.json(projectContract.get.response.parse(await loadProject(projectPath)));
      } catch (error) {
        const status = getProjectErrorStatus(error);
        return jsonError(c, status, error, getProjectErrorMessage(status, "load"));
      }
    })
    .post("/project/:projectPath{.+}", async (c) => {
      try {
        const projectPath = getProjectPath(c.req.param("projectPath"));
        const json = projectContract.save.json.parse(await c.req.json());
        return c.json(
          projectContract.save.response.parse(
            await saveProject(getServerEnv(c), projectPath, json),
          ),
        );
      } catch (error) {
        const status = getProjectErrorStatus(error);
        return jsonError(c, status, error, getProjectErrorMessage(status, "save"));
      }
    });
