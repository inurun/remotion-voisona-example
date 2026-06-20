"use client";

import {
  Bold,
  Heading1,
  Heading2,
  Highlighter,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { Button } from "@/_shared/components/ui/button";

function ToolbarButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button type="button" size="icon-sm" variant={active ? "default" : "outline"} onClick={onClick}>
      {children}
    </Button>
  );
}

export function RichTextEditorToolbar({
  editor,
  inputRef,
  onFileChange,
  onOpenFileDialog,
  uploadingImage,
}: {
  editor: Editor;
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenFileDialog: () => void;
  uploadingImage: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <ToolbarButton
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("marker")}
        onClick={() => editor.chain().focus().toggleMark("marker").run()}
      >
        <Highlighter />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered />
      </ToolbarButton>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        disabled={uploadingImage}
        onClick={onOpenFileDialog}
      >
        <ImagePlus />
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
