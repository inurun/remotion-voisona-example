"use client";

import { Player } from "@remotion/player";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import type { SavedProject } from "@/_schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { getProjectPlayback } from "@/_shared/lib/project-playback";
import { COMP_NAME, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/constants";

function usePlayerComponent() {
  const [component, setComponent] = useState<ComponentType<{ project: SavedProject }> | null>(null);
  useEffect(() => {
    let cancelled = false;

    void import("@/remotion/core/composition").then((module) => {
      if (!cancelled) {
        setComponent(() => module.Composition);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return component;
}

function LoadingPlayer() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
      Loading player...
    </div>
  );
}

function PreviewHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <CardTitle className="text-xl">Preview</CardTitle>
      <span className="text-xs text-muted-foreground sm:text-sm">{COMP_NAME}</span>
    </div>
  );
}

function PreviewPlayer({
  component,
  durationInFrames,
  project,
}: {
  component: ComponentType<{ project: SavedProject }>;
  durationInFrames: number;
  project: SavedProject;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
      <Player
        component={component}
        inputProps={{ project }}
        durationInFrames={durationInFrames}
        fps={VIDEO_FPS}
        compositionWidth={VIDEO_WIDTH}
        compositionHeight={VIDEO_HEIGHT}
        style={{ width: "100%" }}
        controls
        loop={false}
        autoPlay={false}
      />
    </div>
  );
}

export function PlayerPane({ project }: { project: SavedProject }) {
  const component = usePlayerComponent();

  const durationInFrames = useMemo(() => {
    return Math.max(1, Math.ceil(getProjectPlayback(project).durationSec * VIDEO_FPS));
  }, [project]);

  return (
    <Card>
      <CardHeader className="gap-2">
        <PreviewHeader />
      </CardHeader>
      <CardContent>
        {component ? (
          <PreviewPlayer
            component={component}
            durationInFrames={durationInFrames}
            project={project}
          />
        ) : (
          <LoadingPlayer />
        )}
      </CardContent>
    </Card>
  );
}
