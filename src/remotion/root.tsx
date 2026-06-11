import { Composition } from "remotion";

import { COMP_NAME, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "../lib/constants";
import { getProjectPlayback } from "../lib/project-playback";
import { savedProjectSchema } from "../lib/schema";

import projectJson from "../../data/project.json";
import { RemotionVideo } from "./component";

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
