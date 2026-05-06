import { NextResponse } from "next/server";

import { startRender } from "@/lib/render-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await startRender();

  if (!result.started) {
    return NextResponse.json(
      {
        error: "Render is already running.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ started: true });
}
