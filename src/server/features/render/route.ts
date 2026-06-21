import fs from "node:fs/promises";
import type { Hono } from "hono";
import {
  InvalidProjectPathError,
  LATEST_VIDEO_PATH,
  ProjectNotFoundError,
} from "@/server/_shared/storage";
import { jsonError } from "@/server/_shared/http";
import { readRenderSnapshot, startRender } from "./render-state";
import {
  renderSnapshotSchema,
  renderStartRequestSchema,
  renderStartResponseSchema,
} from "./contract";
import { createRenderStream } from "./render-stream";

export const registerRenderRoutes = <TApp extends Hono>(app: TApp) =>
  app
    .get("/render", async (c) => {
      try {
        return c.json(renderSnapshotSchema.parse(await readRenderSnapshot()));
      } catch (error) {
        return jsonError(c, 500, error, "Failed to load render state");
      }
    })
    .post("/render", async (c) => {
      try {
        const payload = renderStartRequestSchema.parse(await c.req.json());
        const result = renderStartResponseSchema.parse(await startRender(payload.projectPath));
        if (!result.started) {
          return c.json({ error: "Render is already running.", ...result }, 409);
        }
        return c.json(result);
      } catch (error) {
        const status =
          error instanceof InvalidProjectPathError
            ? 400
            : error instanceof ProjectNotFoundError
              ? 404
              : 500;
        return jsonError(c, status, error, "Render start failed");
      }
    })
    .get("/render/stream", async (c) => {
      return new Response(createRenderStream(c.req.raw.signal), {
        headers: {
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "Content-Type": "text/event-stream",
        },
      });
    })
    .get("/render/video", async () => {
      try {
        const file = await fs.readFile(LATEST_VIDEO_PATH);
        return new Response(file, {
          headers: {
            "Cache-Control": "no-store",
            "Content-Type": "video/mp4",
          },
        });
      } catch {
        return new Response("Not found", { status: 404 });
      }
    });
