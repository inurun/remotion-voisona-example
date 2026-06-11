import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

import { UPLOADS_DIR, ensureProjectDirs } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_TO_EXTENSION = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const extension = MIME_TO_EXTENSION[file.type as keyof typeof MIME_TO_EXTENSION];
    if (!extension) {
      return NextResponse.json({ error: "unsupported image type" }, { status: 400 });
    }

    await ensureProjectDirs();

    const fileName = `${crypto.randomUUID()}.${extension}`;
    const outputPath = path.join(UPLOADS_DIR, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());

    await fs.writeFile(outputPath, buffer);

    return NextResponse.json({
      src: `/uploads/${fileName}`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload image",
      },
      { status: 500 },
    );
  }
}
