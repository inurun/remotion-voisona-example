import type { Hono } from "hono";
import { jsonError } from "@/server/_shared/http";
import { loadProject, saveProject } from "./use-case";
import { projectContract } from "./contract";

export const registerProjectRoutes = <TApp extends Hono>(app: TApp) =>
  app
    .get("/project", async (c) => {
      try {
        return c.json(projectContract.get.response.parse(await loadProject()));
      } catch (error) {
        return jsonError(c, 500, error, "Failed to load project");
      }
    })
    .post("/project", async (c) => {
      try {
        const json = projectContract.save.json.parse(await c.req.json());
        return c.json(projectContract.save.response.parse(await saveProject(json)));
      } catch (error) {
        return jsonError(c, 500, error, "Failed to save project");
      }
    });
