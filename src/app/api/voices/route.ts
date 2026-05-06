import { NextResponse } from "next/server";

import { listVoisonaVoices } from "@/lib/voisona";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const options = await listVoisonaVoices();
    return NextResponse.json({ options });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load voices",
      },
      { status: 500 },
    );
  }
}
