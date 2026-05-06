import fs from "node:fs/promises";

import { LATEST_VIDEO_PATH } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const file = await fs.readFile(LATEST_VIDEO_PATH);
    return new Response(file, {
      headers: {
        "Content-Type": "video/mp4",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
