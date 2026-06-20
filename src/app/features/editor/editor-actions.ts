"use client";

import { useRef, useState } from "react";
import { type DraftProject, type DraftTts, type SavedProject } from "@/_schemas";
import {
  requestPreviewSynthesis,
  requestSaveProject,
  requestTextAnalysis,
} from "@/app/features/editor/editor-api";

export function useEditorActions({
  onSavedProjectChange,
}: {
  onSavedProjectChange: (project: SavedProject) => void;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyById, setBusyById] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  function setItemBusy(id: string, reason: string | null) {
    setBusyById((current) => {
      const next = { ...current };
      if (reason) {
        next[id] = reason;
      } else {
        delete next[id];
      }
      return next;
    });
  }

  function clearFeedback() {
    setError(null);
    setMessage(null);
  }

  async function runItemTask<T>(
    id: string,
    reason: string,
    task: () => Promise<T>,
    onSuccess?: (value: T) => void,
  ) {
    clearFeedback();
    setItemBusy(id, reason);

    try {
      const result = await task();
      onSuccess?.(result);
      return result;
    } catch (error) {
      setError(error instanceof Error ? error.message : `${reason} failed`);
      return null;
    } finally {
      setItemBusy(id, null);
    }
  }

  async function analyzeItem(item: DraftTts) {
    return runItemTask(
      item.id,
      "analyze",
      () => requestTextAnalysis(item),
      () => {
        setMessage("TSML を更新した。");
      },
    );
  }

  async function playPreview(audioSrc: string) {
    previewAudioRef.current?.pause();
    const audio = new Audio(audioSrc);
    previewAudioRef.current = audio;
    await audio.play();
  }

  async function previewItem(item: DraftTts) {
    return runItemTask(
      item.id,
      "preview",
      () => requestPreviewSynthesis(item),
      async (audioSrc) => {
        if (!audioSrc) {
          return;
        }

        await playPreview(audioSrc);
        setMessage("Preview を再生した。");
      },
    );
  }

  async function saveProject(project: DraftProject) {
    setSaving(true);
    clearFeedback();

    try {
      const savedProject = await requestSaveProject(project);
      onSavedProjectChange(savedProject);
      setMessage("保存して音声を更新した。");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return {
    busyById,
    error,
    message,
    saving,
    setError,
    setMessage,
    analyzeItem,
    previewItem,
    saveProject,
  };
}
