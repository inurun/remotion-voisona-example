type PageWithTts = {
  tts: unknown[];
};

export function resolveTtsIndexForPage(ttsCount: number): number | null {
  return ttsCount > 0 ? 0 : null;
}

export function resolveSelectedPageIndexAfterRemove(
  current: number | null,
  removedIndex: number,
  nextLength: number,
): number | null {
  if (current === null) {
    return null;
  }

  if (removedIndex !== current) {
    return current + (removedIndex < current ? -1 : 0);
  }

  if (nextLength === 0) {
    return null;
  }

  return Math.min(removedIndex, nextLength - 1);
}

export function resolvePageIndexFromFieldCount(
  current: number | null,
  pageCount: number,
): number | null {
  if (pageCount === 0) {
    return null;
  }

  if (current === null) {
    return 0;
  }

  return current < pageCount ? current : pageCount - 1;
}

export function resolveTtsIndexAfterRemove(
  ttsCountBeforeRemove: number,
  removedIndex: number,
): number | null {
  if (ttsCountBeforeRemove <= 1) {
    return null;
  }

  return Math.min(removedIndex, ttsCountBeforeRemove - 2);
}

export function getLandingPageTtsCount(
  pageFields: PageWithTts[],
  removedPageIndex: number,
  nextPageIndex: number | null,
): number {
  if (nextPageIndex === null) {
    return 0;
  }

  const oldPageIndex = nextPageIndex < removedPageIndex ? nextPageIndex : nextPageIndex + 1;

  return pageFields[oldPageIndex]?.tts.length ?? 0;
}
