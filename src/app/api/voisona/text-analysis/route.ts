import { NextResponse } from "next/server";
import { z } from "zod";

import { analyzeVoisonaText } from "@/lib/voisona";

const requestSchema = z.object({
  text: z.string().min(1),
  language: z.string().default("ja_JP"),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    return NextResponse.json(await analyzeVoisonaText(body));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Analyze failed",
      },
      { status: 500 },
    );
  }
}
