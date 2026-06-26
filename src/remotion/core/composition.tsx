import type { SavedProject } from "@/_schemas";
import { ProjectProvider } from "./context";
import { MainPage } from "../pages/main/main-page";
import { TransitionSeries } from "@remotion/transitions";
import { msToFrame } from "../utils/timing";

export function Composition({ project }: { project: SavedProject }) {
  return (
    <ProjectProvider value={project}>
      <TransitionSeries>
        {/* TODO: page.typeでmain, intro, outroの切り替え, それぞれのpageにdurationSecを設定してそこを参照したい */}
        {project.pages.map((page) => {
          return (
            <TransitionSeries.Sequence durationInFrames={msToFrame(10000)}>
              <MainPage page={page} />
            </TransitionSeries.Sequence>
          );
        })}
      </TransitionSeries>
    </ProjectProvider>
  );
}
