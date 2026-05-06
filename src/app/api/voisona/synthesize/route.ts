import { NextResponse } from "next/server";
import { z } from "zod";

import { synthesizeVoisona } from "@/lib/voisona";

const requestSchema = z.object({
  text: z.string().min(1),
  analyzedText: z.string().optional(),
  voiceName: z.string().min(1),
  voiceVersion: z.string().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    return NextResponse.json(await synthesizeVoisona(body));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Synthesize failed",
      },
      { status: 500 },
    );
  }
}
