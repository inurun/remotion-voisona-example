import { useCallback } from "react";
import type { DragEndEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import { getProjectPlayback } from "@/_shared/lib/project-playback";
import { VIDEO_FPS } from "@/constants";
import { useRemotionComposition } from "@/app/components/app-editor/use-remotion-composition";
import {
  getPageMoveState,
  getPageThumbnailFrame,
} from "@/app/components/app-editor/editor-card/page-list/page-list.lib";
import { useProject } from "@/app/features/project";
import { usePage } from "@/app/features/page";
import { getLandingPageTtsCount, resolveSelectedPageIndexAfterRemove } from "@/app/features/page";
import { useTts } from "@/app/features/tts";
import { createUuid } from "@/_shared/lib/utils";

export function usePageList() {
  const { project } = useProject();
  const component = useRemotionComposition();
  const { pageFields, selectedPageIndex, setSelectedPageIndex, movePage, removePage, appendPage } =
    usePage();
  const { syncForPage, clearSelection } = useTts();
  const playback = getProjectPlayback(project);
  const durationInFrames = Math.max(1, Math.ceil(playback.durationSec * VIDEO_FPS));
  const savedPagesById = new Map(playback.pages.map((page) => [page.id, page]));

  const selectPage = useCallback(
    (index: number) => {
      setSelectedPageIndex(index);
      syncForPage(pageFields[index]?.tts.length ?? 0);
    },
    [pageFields, setSelectedPageIndex, syncForPage],
  );

  const append = useCallback(() => {
    setSelectedPageIndex(pageFields.length);
    clearSelection();
    appendPage({
      id: createUuid(),
      richText: "<p></p>",
      tts: [],
    });
  }, [appendPage, clearSelection, pageFields.length, setSelectedPageIndex]);

  const remove = useCallback(
    (index: number) => {
      const nextLength = pageFields.length - 1;
      const nextPageIndex = resolveSelectedPageIndexAfterRemove(
        selectedPageIndex,
        index,
        nextLength,
      );
      const landingTtsCount = getLandingPageTtsCount(pageFields, index, nextPageIndex);

      removePage(index);
      setSelectedPageIndex(nextPageIndex);
      syncForPage(landingTtsCount);
    },
    [pageFields, removePage, selectedPageIndex, setSelectedPageIndex, syncForPage],
  );

  const move = useCallback(
    (fromIndex: number, toIndex: number) => {
      const pageMove = getPageMoveState(
        pageFields.map((field) => field.id),
        selectedPageIndex,
        fromIndex,
        toIndex,
      );

      if (!pageMove) {
        return;
      }

      movePage(pageMove.fromIndex, pageMove.toIndex);
      setSelectedPageIndex(pageMove.nextSelectedPageIndex);
    },
    [movePage, pageFields, selectedPageIndex, setSelectedPageIndex],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled) {
        return;
      }

      const { source } = event.operation;
      if (!isSortable(source)) {
        return;
      }

      move(source.initialIndex, source.index);
    },
    [move],
  );

  return {
    component,
    durationInFrames,
    project,
    pageFields,
    selectedPageIndex,
    selectPage,
    append,
    remove,
    handleDragEnd,
    getThumbnailFrame: (pageId: string) => {
      const savedPage = savedPagesById.get(pageId);
      return savedPage ? getPageThumbnailFrame(savedPage, VIDEO_FPS, durationInFrames) : null;
    },
  };
}
