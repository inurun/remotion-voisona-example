import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { Hono } from "hono";
import { imageUploadResponseSchema } from "./contract";
import { ensureProjectDirs, UPLOADS_DIR } from "@/server/_shared/storage";
import { jsonError } from "@/server/_shared/http";

const MIME_TO_EXTENSION = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export const registerUploadRoutes = <TApp extends Hono>(app: TApp) =>
  app.post("/uploads/image", async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file");

      if (!(file instanceof File)) {
        return c.json({ error: "file is required" }, 400);
      }

      const extension = MIME_TO_EXTENSION[file.type as keyof typeof MIME_TO_EXTENSION];
      if (!extension) {
        return c.json({ error: "unsupported image type" }, 400);
      }

      await ensureProjectDirs();

      const fileName = `${crypto.randomUUID()}.${extension}`;
      const outputPath = path.join(UPLOADS_DIR, fileName);
      const buffer = Buffer.from(await file.arrayBuffer());

      await fs.writeFile(outputPath, buffer);

      return c.json(imageUploadResponseSchema.parse({ src: `/uploads/${fileName}` }));
    } catch (error) {
      return jsonError(c, 500, error, "Failed to upload image");
    }
  });
