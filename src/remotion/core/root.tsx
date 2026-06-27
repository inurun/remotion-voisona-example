import { Composition } from "remotion";
import { SavedProject, savedProjectSchema } from "@/_schemas";
import { COMP_NAME, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/constants";
import projectJson from "../../../data/project.json";
import { Composition as RemotionVideo } from "./composition";
import { secondsToFrames } from "../utils/timing";

function calculateDurationInFrames(project: SavedProject) {
  const sumDurationSec = project.pages.reduce(
    (acc, page) => acc + page.tts.reduce((acc, tts) => acc + tts.durationSec, 0),
    0,
  );
  return secondsToFrames(sumDurationSec, VIDEO_FPS);
}

export function RemotionRoot() {
  return (
    <Composition
      id={COMP_NAME}
      component={RemotionVideo}
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={{
        project: {
          pages: [],
        },
      }}
      calculateMetadata={() => {
        const project = savedProjectSchema.parse(projectJson);
        const durationInFrames = calculateDurationInFrames(project);
        return {
          props: { project },
          durationInFrames,
        };
      }}
    />
  );
}
