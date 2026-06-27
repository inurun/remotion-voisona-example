import type { SavedProject } from "@/_schemas";
import { ProjectProvider } from "./context";
import { MainPage } from "../pages/main/main-page";
import { TransitionSeries } from "@remotion/transitions";
import { secondsToFrames } from "../utils/timing";
import { Fragment } from "react/jsx-runtime";

export function Composition({ project }: { project: SavedProject }) {
  return (
    <ProjectProvider value={project}>
      <TransitionSeries name={`project-ここにprojectのファイル名がほしい`}>
        {/* TODO: page.typeでmain, intro, outroの切り替え */}
        {project.pages.flatMap((page, index) => {
          return (
            <Fragment key={page.id}>
              <TransitionSeries.Sequence
                // TODO: page.durationSecを参照したい
                durationInFrames={secondsToFrames(12)}
                name={`main-page-${String(index).padStart(2, "0")}`}
                layout="none"
              >
                <MainPage page={page} />
              </TransitionSeries.Sequence>
            </Fragment>
          );
        })}
      </TransitionSeries>
    </ProjectProvider>
  );
}
