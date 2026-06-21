"use client";

import { useRef, useState } from "react";
import { type DraftProject, type DraftTts, type SavedProject } from "@/_schemas";
import {
  requestPreviewSynthesis,
  requestSaveProject,
  requestTextAnalysis,
} from "@/app/features/editor/editor-api";

export function useEditorActions({
  onError,
  onSavedProjectChange,
  onSuccess,
  projectPath,
}: {
  onError: (message: string) => void;
  onSavedProjectChange: (project: SavedProject) => void;
  onSuccess: (message: string) => void;
  projectPath: string | null;
}) {
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

  async function runItemTask<T>(
    id: string,
    reason: string,
    task: () => Promise<T>,
    onSuccess?: (value: T) => void,
  ) {
    setItemBusy(id, reason);

    try {
      const result = await task();
      onSuccess?.(result);
      return result;
    } catch (error) {
      onError(error instanceof Error ? error.message : `${reason} failed`);
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
        onSuccess("TSML を更新した。");
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
        onSuccess("Preview を再生した。");
      },
    );
  }

  async function saveProject(project: DraftProject) {
    if (!projectPath) {
      onError("Project path is required");
      return;
    }

    setSaving(true);

    try {
      const savedProject = await requestSaveProject(projectPath, project);
      onSavedProjectChange(savedProject);
      onSuccess("保存して音声を更新した。");
    } catch (saveError) {
      onError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return {
    busyById,
    saving,
    analyzeItem,
    previewItem,
    saveProject,
  };
}
