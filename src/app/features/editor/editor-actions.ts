"use client";

import { useRef, useState } from "react";

import { type DraftProject, type DraftTts, type SavedProject } from "@/_schemas";

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

  async function analyzeItem(item: DraftTts) {
    clearFeedback();
    setItemBusy(item.id, "analyze");

    try {
      const response = await fetch("/api/voisona/text-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: item.readText?.trim() || item.text,
          language: "ja_JP",
        }),
      });
      const data = (await response.json()) as { analyzedText?: string; error?: string };
      if (!response.ok || !data.analyzedText) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }

      setMessage("TSML を更新した。");
      return data.analyzedText;
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : "Analyze failed");
      return null;
    } finally {
      setItemBusy(item.id, null);
    }
  }

  async function previewItem(item: DraftTts) {
    clearFeedback();
    setItemBusy(item.id, "preview");

    try {
      const response = await fetch("/api/voisona/synthesize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: item.readText?.trim() || item.text,
          ...(item.speech?.analyzedText?.trim()
            ? { analyzedText: item.speech.analyzedText.trim() }
            : {}),
          voiceName: item.voiceName,
          ...(item.voiceVersion?.trim() ? { voiceVersion: item.voiceVersion.trim() } : {}),
        }),
      });
      const data = (await response.json()) as { audioSrc?: string; error?: string };
      if (!response.ok || !data.audioSrc) {
        throw new Error(data.error ?? `HTTP ${response.status}`);
      }

      previewAudioRef.current?.pause();
      const audio = new Audio(data.audioSrc);
      previewAudioRef.current = audio;
      await audio.play();
      setMessage("Preview を再生した。");
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Preview failed");
    } finally {
      setItemBusy(item.id, null);
    }
  }

  async function saveProject(project: DraftProject) {
    setSaving(true);
    clearFeedback();

    try {
      const response = await fetch("/api/project", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(project),
      });
      const data = (await response.json()) as SavedProject | { error: string };

      if (!response.ok || !("pages" in data)) {
        throw new Error("error" in data ? data.error : `HTTP ${response.status}`);
      }

      onSavedProjectChange(data);
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
