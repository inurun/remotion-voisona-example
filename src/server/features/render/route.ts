import fs from "node:fs/promises";
import type { Hono } from "hono";
import { LATEST_VIDEO_PATH } from "@/server/_shared/storage";
import { jsonError, sseMessage } from "@/server/_shared/http";
import { readRenderSnapshot, startRender, subscribeRender } from "./render-state";
import { renderSnapshotSchema, renderStartResponseSchema } from "./contract";

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
        const result = renderStartResponseSchema.parse(await startRender());
        if (!result.started) {
          return c.json({ error: "Render is already running.", ...result }, 409);
        }
        return c.json(result);
      } catch (error) {
        return jsonError(c, 500, error, "Render start failed");
      }
    })
    .get("/render/stream", async (c) => {
      const encoder = new TextEncoder();

      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          let closed = false;
          let lastUpdatedAt = -1;

          const pushSnapshot = (snapshot: Awaited<ReturnType<typeof readRenderSnapshot>>) => {
            if (closed || snapshot.updatedAt === lastUpdatedAt) {
              return;
            }

            lastUpdatedAt = snapshot.updatedAt;
            controller.enqueue(encoder.encode(sseMessage(renderSnapshotSchema.parse(snapshot))));
          };

          const unsubscribe = subscribeRender((snapshot) => {
            pushSnapshot(snapshot);
          });

          void readRenderSnapshot().then((snapshot) => {
            pushSnapshot(snapshot);
          });

          const polling = setInterval(() => {
            void readRenderSnapshot().then((snapshot) => {
              pushSnapshot(snapshot);
            });
          }, 500);

          const heartbeat = setInterval(() => {
            if (!closed) {
              controller.enqueue(encoder.encode(": keep-alive\n\n"));
            }
          }, 15_000);

          const close = () => {
            if (closed) {
              return;
            }

            closed = true;
            clearInterval(polling);
            clearInterval(heartbeat);
            unsubscribe();
            controller.close();
          };

          c.req.raw.signal.addEventListener("abort", close, { once: true });
        },
      });

      return new Response(stream, {
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
