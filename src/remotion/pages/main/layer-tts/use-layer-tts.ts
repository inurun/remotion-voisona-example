import { createSequentialSegments } from "@/remotion/utils/timing/timing-helpers";
import { useMainPageContext } from "../context";
import { secondsToFrames } from "@/remotion/utils/timing";
import { staticFile } from "remotion";

export function useLayerTts() {
  const { page } = useMainPageContext();

  const segments = createSequentialSegments(
    page.tts.map((tts) => secondsToFrames(tts.durationSec)),
  );

  const ttsSegments = segments.map((segment, index) => {
    const tts = page.tts[index];
    return {
      start: segment.start,
      duration: segment.duration,
      ...tts,
      audio: {
        src: staticFile(tts.audio.src),
      },
    };
  });

  return {
    ttsSegments,
  };
}
