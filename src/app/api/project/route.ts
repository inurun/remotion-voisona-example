import { NextResponse } from "next/server";

import { buildSavedProject } from "@/lib/project-builder";
import { ensureSavedProjectFile, readSavedProject, writeSavedProject } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSavedProjectFile();
    return NextResponse.json(await readSavedProject());
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load project",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const previousProject = await readSavedProject().catch(() => undefined);
    const project = await buildSavedProject(await request.json(), previousProject);
    await writeSavedProject(project);
    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to save project",
      },
      { status: 500 },
    );
  }
}
