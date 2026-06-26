import { Player } from "@remotion/player";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/_shared/components/ui/card";
import { getProjectPlayback } from "@/_shared/lib/project-playback";
import { VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/constants";
import { useProject } from "@/app/features/project";
import { usePreviewCard } from "./preview-card.hook";

export function PreviewCard() {
  const { project } = useProject();
  const component = usePreviewCard();
  const durationInFrames = useMemo(() => {
    return Math.max(1, Math.ceil(getProjectPlayback(project).durationSec * VIDEO_FPS));
  }, [project]);

  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-xl">Preview</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {component ? (
          <div className="overflow-hidden bg-muted/40">
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
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            Loading player...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
