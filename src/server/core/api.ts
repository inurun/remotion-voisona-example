import fs from "node:fs/promises";
import path from "node:path";
import { Hono } from "hono";
import { renderToString } from "react-dom/server";
import { layoutHtml } from "@/app/core/layout";
import {
  ensureProjectDirs,
  getPublicFilePath,
  InvalidProjectPathError,
  listSavedProjects,
  ProjectNotFoundError,
  readSavedProject,
} from "@/server/_shared/storage";
import { registerProjectRoutes } from "@/server/features/project";
import { registerRenderRoutes } from "@/server/features/render";
import { registerUploadRoutes } from "@/server/features/uploads";
import { registerVoisonaRoutes } from "@/server/features/voisona";

const CONTENT_TYPES = new Map([
  [".gif", "image/gif"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".wav", "audio/wav"],
  [".webp", "image/webp"],
]);

async function servePublicAsset(publicPath: string) {
  const filePath = getPublicFilePath(publicPath);
  const file = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  return new Response(file, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": CONTENT_TYPES.get(ext) ?? "application/octet-stream",
    },
  });
}

async function resolveRootProjectPath() {
  const projects = await listSavedProjects();
  const project = projects[0];
  if (!project) {
    throw new ProjectNotFoundError("Project not found");
  }

  return `/${project.path}`;
}

async function assertProjectRouteExists(requestPath: string) {
  const projectPath = decodeURIComponent(requestPath.replace(/^\/+/u, ""));
  if (!projectPath) {
    throw new InvalidProjectPathError("Invalid project path");
  }

  await readSavedProject(projectPath);
}

function createApi() {
  const api = new Hono();

  registerProjectRoutes(api);
  registerVoisonaRoutes(api);
  registerRenderRoutes(api);
  registerUploadRoutes(api);

  return api;
}

export const createApp = () => {
  const app = new Hono();

  app.route("/api", createApi());

  app.get("/uploads/*", async (c) => {
    try {
      await ensureProjectDirs();
      return await servePublicAsset(c.req.path.replace(/^\/+/u, ""));
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });

  app.get("/tts/*", async (c) => {
    try {
      await ensureProjectDirs();
      return await servePublicAsset(c.req.path.replace(/^\/+/u, ""));
    } catch {
      return new Response("Not found", { status: 404 });
    }
  });

  app.get("/", async (c) => {
    try {
      return c.redirect(await resolveRootProjectPath());
    } catch {
      return c.html(renderToString(layoutHtml), 404);
    }
  });

  app.get("*", async (c) => {
    try {
      await assertProjectRouteExists(c.req.path);
      return c.html(renderToString(layoutHtml));
    } catch (error) {
      if (error instanceof InvalidProjectPathError || error instanceof ProjectNotFoundError) {
        return c.html(renderToString(layoutHtml), 404);
      }

      return c.html(renderToString(layoutHtml), 500);
    }
  });

  return app;
};
