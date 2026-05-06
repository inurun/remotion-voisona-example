"use client";

import { Player } from "@remotion/player";
import { useEffect, useMemo, useState, type ComponentType } from "react";

import { COMP_NAME, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/lib/constants";
import type { SavedProject } from "@/lib/schema";

export function PlayerPane({ project }: { project: SavedProject }) {
  const [component, setComponent] = useState<ComponentType<{ project: SavedProject }> | null>(
    null,
  );

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
    return Math.max(1, Math.ceil(project.durationSec * VIDEO_FPS));
  }, [project.durationSec]);

  if (!component) {
    return <div className="panel"><div className="panel-body">Loading player...</div></div>;
  }

  return (
    <div className="panel">
      <div className="panel-body">
        <div className="section-head">
          <h2>Preview</h2>
          <span className="muted-line">{COMP_NAME}</span>
        </div>
        <div className="player-frame">
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
      </div>
    </div>
  );
}
