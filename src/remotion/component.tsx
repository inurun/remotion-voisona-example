import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import type { SavedProject } from "../lib/schema";

function secondsToFrames(value: number, fps: number) {
  return Math.round(value * fps);
}

export function RemotionVideo({ project }: { project: SavedProject }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;
  const activeIndex = project.timeline.findIndex(
    (item) => currentSec >= item.startSec && currentSec < item.endSec,
  );
  const activeItem = activeIndex >= 0 ? project.items[activeIndex] : project.items[0];

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at top left, rgba(255, 188, 128, 0.48), transparent 30%), linear-gradient(180deg, #11100d 0%, #241d16 100%)",
        color: "#fff7ea",
        justifyContent: "center",
        alignItems: "center",
        padding: 64,
      }}
    >
      {project.timeline.map((segment, index) => {
        const item = project.items[index];
        if (!item?.audio.src) {
          return null;
        }

        return (
          <Sequence
            key={segment.id}
            from={secondsToFrames(segment.startSec, fps)}
            durationInFrames={Math.max(1, secondsToFrames(item.durationSec, fps))}
          >
            <Audio src={staticFile(item.audio.src)} />
          </Sequence>
        );
      })}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
          alignItems: "center",
          maxWidth: 980,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 24,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255, 232, 201, 0.8)",
          }}
        >
          {activeItem?.voiceName || "No Voice"}
        </div>
        <div
          style={{
            fontSize: 64,
            lineHeight: 1.35,
            fontWeight: 700,
            whiteSpace: "pre-wrap",
          }}
        >
          {activeItem?.text || "No Script"}
        </div>
      </div>
    </AbsoluteFill>
  );
}
