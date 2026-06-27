import type { SavedPage, SavedProject } from "@/_schemas";
import { ProjectProvider } from "./context";
import { IntroPage } from "../pages/intro/intro-page";
import { MainPage } from "../pages/main/main-page";
import { OutroPage } from "../pages/outro/outro-page";
import { TransitionSeries } from "@remotion/transitions";
import { secondsToFrames } from "../utils/timing";
import { Fragment } from "react/jsx-runtime";

function PageByType({ page }: { page: SavedPage }) {
  switch (page.type) {
    case "intro":
      return <IntroPage page={page} />;
    case "main":
      return <MainPage page={page} />;
    case "outro":
      return <OutroPage page={page} />;
  }
}

export function Composition({ project }: { project: SavedProject }) {
  return (
    <ProjectProvider value={project}>
      <TransitionSeries name={`project-ここにprojectのファイル名がほしい`}>
        {project.pages.flatMap((page, index) => {
          return (
            <Fragment key={page.id}>
              <TransitionSeries.Sequence
                durationInFrames={Math.max(1, secondsToFrames(page.durationSec))}
                name={`${page.type}-page-${String(index).padStart(2, "0")}`}
                layout="none"
              >
                <PageByType page={page} />
              </TransitionSeries.Sequence>
            </Fragment>
          );
        })}
      </TransitionSeries>
    </ProjectProvider>
  );
}
