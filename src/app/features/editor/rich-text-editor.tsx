"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
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
import { useEffect, useRef, useState } from "react";

import { Button } from "@/_shared/components/ui/button";
import { isSingleImageRichText } from "@/_shared/lib/rich-text";
import { cn } from "@/_shared/lib/utils";
import { TiptapImage } from "@/app/features/editor/tiptap-image";
import { TiptapMarker } from "@/app/features/editor/tiptap-marker";

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

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageOnly = isSingleImageRichText(value);
  const editor = useEditor({
    extensions: [StarterKit, TiptapImage, TiptapMarker],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "rich-text-editor min-h-[280px] rounded-xl border border-border bg-muted/20 px-4 py-3 outline-none [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:text-2xl [&_h2]:font-semibold [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-xl [&_img]:shadow-md [&_li]:ml-5 [&_ol]:list-decimal [&_p]:min-h-6 [&_ul]:list-disc",
      },
    },
  });

  async function insertImage(file: File) {
    if (!editor) {
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/uploads/image", {
        body: formData,
        method: "POST",
      });
      const data = (await response.json()) as { error?: string; src?: string };

      if (!response.ok || !data.src) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }

      editor
        .chain()
        .focus()
        .insertContent({
          attrs: {
            alt: file.name,
            src: data.src,
            title: file.name,
          },
          type: "image",
        })
        .run();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();
    if (currentHtml !== value) {
      editor.commands.setContent(value || "<p></p>", false);
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className="grid gap-2">
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
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus />
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            void insertImage(file);
          }}
        />
      </div>
      <div className={cn("grid", imageOnly && "[&_img]:w-full")}>
        <EditorContent editor={editor} />
      </div>
      {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
    </div>
  );
}
