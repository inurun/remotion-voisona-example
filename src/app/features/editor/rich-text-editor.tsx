"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

import { cn } from "@/_shared/lib/utils";
import { RichTextEditorToolbar } from "@/app/features/editor/rich-text-editor-toolbar";
import { useRichTextImageUpload } from "@/app/features/editor/rich-text-image-upload";
import { isSingleImageRichText } from "@/app/features/editor/rich-text";
import { TiptapImage } from "@/app/features/editor/tiptap-image";
import { TiptapMarker } from "@/app/features/editor/tiptap-marker";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
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
  const { handleFileChange, inputRef, openFileDialog, uploadError, uploadingImage } =
    useRichTextImageUpload(editor);

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
      <RichTextEditorToolbar
        editor={editor}
        inputRef={inputRef}
        onFileChange={handleFileChange}
        onOpenFileDialog={openFileDialog}
        uploadingImage={uploadingImage}
      />
      <div className={cn("grid", imageOnly && "[&_img]:w-full")}>
        <EditorContent editor={editor} />
      </div>
      {uploadError ? <p className="text-sm text-destructive">{uploadError}</p> : null}
    </div>
  );
}
