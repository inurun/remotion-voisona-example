import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import { getProjectPlayback } from "@/lib/project-playback";
import type { SavedProject } from "@/lib/schema";

function secondsToFrames(value: number, fps: number) {
  return Math.round(value * fps);
}

export function RemotionVideo({ project }: { project: SavedProject }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSec = frame / fps;
  const playback = getProjectPlayback(project);
  const activeItem = playback.tts.find(
    (item) => currentSec >= item.startSec && currentSec < item.endSec,
  );

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
      {playback.tts.map((item) => {
        if (!item.tts.audio.src) {
          return null;
        }

        return (
          <Sequence
            key={item.tts.id}
            from={secondsToFrames(item.startSec, fps)}
            durationInFrames={Math.max(1, secondsToFrames(item.tts.durationSec, fps))}
          >
            <Audio src={staticFile(item.tts.audio.src)} />
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
          {activeItem?.tts.voiceName || "No Voice"}
        </div>
        <div
          style={{
            fontSize: 64,
            lineHeight: 1.35,
            fontWeight: 700,
            whiteSpace: "pre-wrap",
          }}
        >
          {activeItem?.tts.text || "No Script"}
        </div>
      </div>
    </AbsoluteFill>
  );
}
