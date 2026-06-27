import { createSequentialSegments } from "@/remotion/utils/timing/timing-helpers";
import { useIntroPageContext } from "../context";
import { secondsToFrames } from "@/remotion/utils/timing";
import { staticFile } from "remotion";

export function useLayerTts() {
  const { page } = useIntroPageContext();

  const segments = createSequentialSegments(
    page.tts.map((tts) => secondsToFrames(tts.durationSec)),
    secondsToFrames(page.padBeforeSec),
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
