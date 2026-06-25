export function resolveTtsIndexForPage(ttsCount: number): number | null {
  return ttsCount > 0 ? 0 : null;
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
