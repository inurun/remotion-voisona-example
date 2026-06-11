"use client";

import { Player } from "@remotion/player";
import { useEffect, useMemo, useState, type ComponentType } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMP_NAME, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/lib/constants";
import { getProjectPlayback } from "@/lib/project-playback";
import type { SavedProject } from "@/lib/schema";

export function PlayerPane({ project }: { project: SavedProject }) {
  const [component, setComponent] = useState<ComponentType<{ project: SavedProject }> | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import("@/remotion/component").then((module) => {
      if (!cancelled) {
        setComponent(() => module.RemotionVideo);
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
