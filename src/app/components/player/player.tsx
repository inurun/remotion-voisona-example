"use client";

import { Player } from "@remotion/player";
import { useEffect, useMemo, useState, type ComponentType } from "react";
import type { SavedProject } from "@/_schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { getProjectPlayback } from "@/_shared/lib/project-playback";
import { COMP_NAME, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/constants";

export function PlayerPane({ project }: { project: SavedProject }) {
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

  const durationInFrames = useMemo(() => {
    return Math.max(1, Math.ceil(getProjectPlayback(project).durationSec * VIDEO_FPS));
  }, [project]);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">Preview</CardTitle>
          <span className="text-xs text-muted-foreground sm:text-sm">{COMP_NAME}</span>
        </div>
      </CardHeader>
      <CardContent>
        {!component ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            Loading player...
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
}
