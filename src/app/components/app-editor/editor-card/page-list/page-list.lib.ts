import type { SavedProject } from "@/_schemas";

type PageTiming = {
  id?: string;
  startSec: number;
  endSec: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  if (item === undefined) {
    return items;
  }

  next.splice(toIndex, 0, item);
  return next;
}

export function getPageThumbnailFrame(page: PageTiming, fps: number, durationInFrames: number) {
  const lastProjectFrame = Math.max(0, durationInFrames - 1);
  const pageStartFrame = clamp(Math.round(page.startSec * fps), 0, lastProjectFrame);
  const pageEndFrame = Math.max(
    pageStartFrame,
    clamp(Math.ceil(page.endSec * fps) - 1, pageStartFrame, lastProjectFrame),
  );
  const preferredFrame = Math.round((page.startSec + 1) * fps);

  return clamp(preferredFrame, pageStartFrame, pageEndFrame);
}

export function getProjectPageTimings(project: SavedProject): PageTiming[] {
  let currentSec = 0;

  return project.pages.map((page) => {
    const startSec = currentSec;
    currentSec += page.durationSec;

    return {
      id: page.id,
      startSec,
      endSec: currentSec,
    };
  });
}

function resolveSelectedPageIndexAfterMove(
  pageIds: string[],
  selectedPageIndex: number | null,
  fromIndex: number,
  toIndex: number,
) {
  if (selectedPageIndex === null) {
    return null;
  }

  const selectedPageId = pageIds[selectedPageIndex];
  if (!selectedPageId) {
    return null;
  }

  return moveItem(pageIds, fromIndex, toIndex).findIndex((id) => id === selectedPageId);
}

function isPageIndexInRange(pageCount: number, index: number) {
  return index >= 0 && index < pageCount;
}

function canMovePage(pageCount: number, fromIndex: number, toIndex: number) {
  return (
    fromIndex !== toIndex &&
    isPageIndexInRange(pageCount, fromIndex) &&
    isPageIndexInRange(pageCount, toIndex)
  );
}

export function getPageMoveState(
  pageIds: string[],
  selectedPageIndex: number | null,
  fromIndex: number,
  toIndex: number,
) {
  if (!canMovePage(pageIds.length, fromIndex, toIndex)) {
    return null;
  }

  return {
    fromIndex,
    toIndex,
    nextSelectedPageIndex: resolveSelectedPageIndexAfterMove(
      pageIds,
      selectedPageIndex,
      fromIndex,
      toIndex,
    ),
  };
}
