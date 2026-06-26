import { Composition } from "remotion";

import { savedProjectSchema } from "@/_schemas";
import { getProjectPlayback } from "@/_shared/lib/project-playback";
import { COMP_NAME, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/constants";

import projectJson from "../../../data/project.json";
import { Composition as RemotionVideo } from "./composition";
import { msToFrame } from "../utils/timing";

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
        const project = savedProjectSchema.parse(savedProjectSchema.parse(projectJson));
        return {
          durationInFrames: msToFrame(getProjectPlayback(project).durationSec * 1000, VIDEO_FPS),
        };
      }}
    />
  );
}
