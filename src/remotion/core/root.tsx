import { Composition } from "remotion";

import { savedProjectSchema } from "@/_schemas";
import { getProjectPlayback } from "@/_shared/lib/project-playback";
import { COMP_NAME, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/constants";

import projectJson from "../../../data/project.json";
import { Composition as RemotionVideo } from "./composition";

const project = savedProjectSchema.parse(projectJson);
const playback = getProjectPlayback(project);

export function RemotionRoot() {
  return (
    <Composition
      id={COMP_NAME}
      component={RemotionVideo}
      durationInFrames={Math.max(1, Math.ceil(playback.durationSec * VIDEO_FPS))}
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={{ project }}
    />
  );
}
