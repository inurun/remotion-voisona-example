import { AppClient } from "@/app/ui/app-client";
import { ensureSavedProjectFile, readSavedProject } from "@/lib/storage";

export default async function HomePage() {
  await ensureSavedProjectFile();
  const project = await readSavedProject();

  return <AppClient initialProject={project} />;
}
