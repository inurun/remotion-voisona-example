import { useRef, useState } from "react";
import type { Editor } from "@tiptap/react";

export type UploadImage = (file: File) => Promise<string>;

type UploadState = {
  inputRef: React.MutableRefObject<HTMLInputElement | null>;
  uploadError: string | null;
  uploadingImage: boolean;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  openFileDialog: () => void;
};

function insertUploadedImage(editor: Editor, src: string, fileName: string) {
  editor
    .chain()
    .focus()
    .insertContent({
      attrs: {
        alt: fileName,
        src,
        title: fileName,
      },
      type: "image",
    })
    .run();
}

export function useRichTextImageUpload({
  editor,
  uploadImage,
}: {
  editor: Editor | null;
  uploadImage: UploadImage;
}): UploadState {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const resetInput = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editor) {
      return;
    }

    setUploadingImage(true);
    setUploadError(null);

    void uploadImage(file)
      .then((src) => {
        insertUploadedImage(editor, src, file.name);
      })
      .catch((error: unknown) => {
        setUploadError(error instanceof Error ? error.message : "Failed to upload image");
      })
      .finally(() => {
        setUploadingImage(false);
        resetInput();
      });
  };

  return {
    inputRef,
    uploadError,
    uploadingImage,
    handleFileChange,
    openFileDialog: () => inputRef.current?.click(),
  };
}
