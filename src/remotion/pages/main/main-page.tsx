import { BackgroundLayer } from "./layers/background-layer";
import { TtsLayer } from "./layers/tts-layer";
import { MainPageProps, useMainPage } from "./use-main-page";

export function MainPage(props: MainPageProps) {
  const { page } = useMainPage(props);
  console.log(page);
  return (
    <>
      <BackgroundLayer />
      <TtsLayer page={page} />
    </>
  );
}
