import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { Thumbnail } from "@remotion/player";
import { FilePlus2, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/_shared/components/ui/button";
import type { SavedProject } from "@/_schemas";
import { VIDEO_FPS, VIDEO_HEIGHT, VIDEO_WIDTH } from "@/constants";
import { usePageList } from "@/app/components/app-editor/editor-card/page-list/use-page-list";
import type { ComponentType } from "react";

type PageThumbnailProps = {
  component: ComponentType<{ project: SavedProject }>;
  durationInFrames: number;
  frameToDisplay: number | null;
  project: SavedProject;
};

type PageListItemProps = {
  index: number;
  isSelected: boolean;
  onRemove: () => void;
  onSelect: () => void;
  pageId: string;
  thumbnail: PageThumbnailProps;
};

function ThumbnailPlaceholder() {
  return (
    <div className="flex aspect-video items-center justify-center bg-muted/40 px-3 text-xs text-muted-foreground">
      Unsaved
    </div>
  );
}

function PageThumbnail({
  component,
  durationInFrames,
  frameToDisplay,
  project,
}: PageThumbnailProps) {
  if (frameToDisplay === null) {
    return <ThumbnailPlaceholder />;
  }

  return (
    <Thumbnail
      component={component}
      inputProps={{ project }}
      durationInFrames={durationInFrames}
      fps={VIDEO_FPS}
      compositionWidth={VIDEO_WIDTH}
      compositionHeight={VIDEO_HEIGHT}
      frameToDisplay={frameToDisplay}
      style={{ width: "100%" }}
    />
  );
}

function PageListItemContent({
  handleRef,
  index,
  onSelect,
  thumbnail,
}: {
  handleRef: (element: Element | null) => void;
  index: number;
  onSelect: () => void;
  thumbnail: PageThumbnailProps;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="grid cursor-pointer gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="overflow-hidden rounded-md border border-border bg-muted/30">
        <PageThumbnail {...thumbnail} />
      </div>
      <div className="flex min-w-0 items-center justify-between gap-2 px-0.5">
        <span className="truncate text-xs font-medium text-foreground">Page {index + 1}</span>
        <span
          ref={handleRef}
          className="inline-flex size-6 cursor-grab items-center justify-center rounded-md text-muted-foreground active:cursor-grabbing"
          aria-label="並び替え"
          title="並び替え"
        >
          <GripVertical className="size-4" />
        </span>
      </div>
    </button>
  );
}

function PageRemoveButton({ index, onRemove }: { index: number; onRemove: () => void }) {
  return (
    <Button
      type="button"
      size="icon-xs"
      variant="destructive"
      title="削除"
      aria-label={`Page ${index + 1} を削除`}
      onClick={onRemove}
      className="absolute top-3 right-3 opacity-100 shadow-sm sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover/page:opacity-100"
    >
      <Trash2 />
    </Button>
  );
}

function PageListItem({
  index,
  isSelected,
  onRemove,
  onSelect,
  pageId,
  thumbnail,
}: PageListItemProps) {
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({
    id: pageId,
    index,
    transition: {
      duration: 160,
      easing: "cubic-bezier(0.2, 0, 0, 1)",
      idle: true,
    },
  });

  return (
    <article
      ref={ref}
      data-dragging={isDragging}
      data-drop-target={isDropTarget && !isDragging}
      data-selected={isSelected}
      className="group/page relative grid gap-2 rounded-lg border border-border bg-card p-2 transition data-[dragging=true]:opacity-70 data-[drop-target=true]:border-primary/60 data-[selected=true]:border-primary data-[selected=true]:ring-2 data-[selected=true]:ring-primary/20"
    >
      <PageListItemContent
        handleRef={handleRef}
        index={index}
        onSelect={onSelect}
        thumbnail={thumbnail}
      />
      <PageRemoveButton index={index} onRemove={onRemove} />
    </article>
  );
}

export function PageList() {
  const {
    component,
    durationInFrames,
    getThumbnailFrame,
    handleDragEnd,
    pageFields,
    project,
    remove,
    selectedPageIndex,
    selectPage,
    append,
  } = usePageList();

  if (!component) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        Loading pages...
      </div>
    );
  }

  return (
    <aside className="grid content-start gap-3">
      <div className="text-xs font-medium text-muted-foreground">Pages</div>
      {pageFields.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
          No pages.
        </div>
      ) : (
        <DragDropProvider onDragEnd={handleDragEnd}>
          <div className="grid gap-2">
            {pageFields.map((field, index) => (
              <PageListItem
                key={field.fieldKey}
                index={index}
                isSelected={selectedPageIndex === index}
                onRemove={() => remove(index)}
                onSelect={() => selectPage(index)}
                pageId={field.id}
                thumbnail={{
                  component,
                  durationInFrames,
                  frameToDisplay: getThumbnailFrame(field.id),
                  project,
                }}
              />
            ))}
          </div>
        </DragDropProvider>
      )}
      <Button
        type="button"
        size="sm"
        title="ページ追加"
        aria-label="ページ追加"
        variant="default"
        className="w-full justify-center"
        onClick={append}
      >
        <FilePlus2 />
        Add
      </Button>
    </aside>
  );
}
