import { Composition } from "remotion";

import { savedProjectSchema } from "@/_schemas";
import { getProjectPlayback } from "@/_shared/lib/project-playback";
import { COMP_NAME, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/constants";

import projectJson from "../../../data/project.json";
import { Composition as RemotionVideo } from "./composition";

const defaultProject = savedProjectSchema.parse(projectJson);

function getDurationInFrames(project = defaultProject) {
  const playback = getProjectPlayback(project);
  return Math.max(1, Math.ceil(playback.durationSec * VIDEO_FPS));
}

export function RemotionRoot() {
  return (
    <Composition
      id={COMP_NAME}
      component={RemotionVideo}
      durationInFrames={getDurationInFrames()}
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={{ project: defaultProject }}
      calculateMetadata={({ props }) => ({
        durationInFrames: getDurationInFrames(
          savedProjectSchema.parse(props.project ?? defaultProject),
        ),
      })}
    />
  );
}
