import { SavedPage } from "@/_schemas";

export type MainPageProps = {
  page: SavedPage;
};

export function useMainPage(page: MainPageProps) {
  // TODO: Page単位でシーケンスするので、currentFrameが0に戻る、今のProject全体を計算するgetProjectPlaybackは使えない

  return {
    ...page,
  };
}
