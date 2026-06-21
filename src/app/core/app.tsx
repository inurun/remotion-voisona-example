"use client";

import { useMemo } from "react";
import { AppScreen } from "@/app/components/app-screen";
import { getProjectPathFromLocation } from "@/app/features/project/project-path";

export default function App() {
  const selectedProjectPath = useMemo(
    () => getProjectPathFromLocation(window.location.pathname),
    [],
  );

  return <AppScreen selectedProjectPath={selectedProjectPath} />;
}
