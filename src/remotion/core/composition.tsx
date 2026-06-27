import type { SavedProject } from "@/_schemas";
import { ProjectProvider } from "./context";
import { MainPage } from "../pages/main/main-page";
import { TransitionSeries } from "@remotion/transitions";
import { msToFrame } from "../utils/timing";
import { Fragment } from "react/jsx-runtime";

export function Composition({ project }: { project: SavedProject }) {
  return (
    <ProjectProvider value={project}>
      <TransitionSeries>
        {/* TODO: page.typeでmain, intro, outroの切り替え, それぞれのpageにdurationSecを設定してそこを参照したい */}
        {project.pages.flatMap((page) => {
          return (
            <Fragment key={page.id}>
              {/* padBeforeSec */}
              <TransitionSeries.Sequence durationInFrames={msToFrame(1000)} />
              {/* main page */}
              <TransitionSeries.Sequence durationInFrames={msToFrame(10000)}>
                <MainPage page={page} />
              </TransitionSeries.Sequence>
              {/* padAfterSec */}
              <TransitionSeries.Sequence durationInFrames={msToFrame(1000)} />
            </Fragment>
          );
        })}
      </TransitionSeries>
    </ProjectProvider>
  );
}
