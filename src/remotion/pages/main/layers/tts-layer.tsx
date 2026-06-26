import { Html5Audio } from "remotion";
import { MainPageProps } from "../use-main-page";
import { createSequentialSegments } from "@/remotion/utils/timing/timing-helpers";
import { secondsToFrames } from "@/remotion/utils/timing";
import { Layer } from "@/remotion/components/layter";
import { SequenceUnstyled } from "@/remotion/components/sequence-unstyled";

export function TtsLayer({ page }: MainPageProps) {
  const segments = createSequentialSegments(
    page.tts.map((tts) => secondsToFrames(tts.durationSec)),
  );
  return (
    <Layer className="flex justify-center items-center">
      {segments.map((segment, index) => {
        const tts = page.tts[index];
        return (
          <SequenceUnstyled key={tts.id} from={segment.start} durationInFrames={segment.duration}>
            <p className="text-8xl font-bold">{tts.text}</p>
            <Html5Audio src={tts.audio.src} />
          </SequenceUnstyled>
        );
      })}
    </Layer>
  );
}
