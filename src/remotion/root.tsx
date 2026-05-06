import { Composition } from "remotion";

import { COMP_NAME, VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "../lib/constants";
import { savedProjectSchema } from "../lib/schema";

import projectJson from "../../data/sequences.json";
import { RemotionVideo } from "./component";

const project = savedProjectSchema.parse(projectJson);

export function RemotionRoot() {
  return (
    <Composition
      id={COMP_NAME}
      component={RemotionVideo}
      durationInFrames={Math.max(1, Math.ceil(project.durationSec * VIDEO_FPS))}
      fps={VIDEO_FPS}
      width={VIDEO_WIDTH}
      height={VIDEO_HEIGHT}
      defaultProps={{ project }}
    />
  );
}
