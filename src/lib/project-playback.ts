import { type SavedProject, type SavedTts } from "@/lib/schema";

export type PlaybackTts = {
  pageId: string;
  pageIndex: number;
  pageRichText: string;
  tts: SavedTts;
  ttsIndex: number;
  startSec: number;
  endSec: number;
};

export type PlaybackPage = {
  id: string;
  richText: string;
  startSec: number;
  endSec: number;
  tts: PlaybackTts[];
};

export function getProjectPlayback(project: SavedProject) {
  let currentSec = 0;

  const pages: PlaybackPage[] = project.pages.map((page, pageIndex) => {
    const startSec = currentSec;
    const tts = page.tts.map((item, ttsIndex) => {
      const ttsStartSec = currentSec;
      currentSec += item.durationSec;
      return {
        pageId: page.id,
        pageIndex,
        pageRichText: page.richText,
        tts: item,
        ttsIndex,
        startSec: ttsStartSec,
        endSec: currentSec,
      };
    });

    return {
      id: page.id,
      richText: page.richText,
      startSec,
      endSec: currentSec,
      tts,
    };
  });

  return {
    pages,
    tts: pages.flatMap((page) => page.tts),
    durationSec: currentSec,
  };
}
