import { Composition } from "remotion";
import { sumBy } from "remeda";
import { SavedProject, savedProjectSchema } from "@/_schemas";
import { COMP_NAME, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/constants";
import projectJson from "../../../data/project.json";
import { Composition as RemotionVideo } from "./composition";
import { secondsToFrames } from "../utils/timing";

function calculateDurationInFrames(project: SavedProject) {
  const sumDurationSec = sumBy(project.pages, (page) => page.durationSec);
  return Math.max(1, secondsToFrames(sumDurationSec, VIDEO_FPS));
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
