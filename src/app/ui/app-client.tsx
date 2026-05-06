"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PlayerPane } from "@/app/ui/player-pane";
import { TsmlEditor } from "@/app/ui/tsml-editor";
import { type DraftItem, type SavedProject, type VoiceOption } from "@/lib/schema";

type VoiceState =
  | { status: "loading"; options: VoiceOption[]; error: string | null }
  | { status: "ready"; options: VoiceOption[]; error: string | null }
  | { status: "error"; options: VoiceOption[]; error: string };

type RenderState = {
  status: "idle" | "running" | "success" | "error";
  logs: string[];
  videoPath: string | null;
  lastError: string | null;
};

function toDraftItems(project: SavedProject): DraftItem[] {
  return project.items.map((item) => ({
    id: item.id,
    text: item.text,
    readText: item.readText,
    voiceName: item.voiceName,
    ...(item.voiceVersion ? { voiceVersion: item.voiceVersion } : {}),
    speech: {
      analyzedText: item.speech.analyzedText,
    },
  }));
}

function createDraftItem(): DraftItem {
  return {
    id: crypto.randomUUID(),
    text: "",
    readText: "",
    voiceName: "",
    voiceVersion: "",
    speech: {},
  };
}

export function AppClient({ initialProject }: { initialProject: SavedProject }) {
  const [savedProject, setSavedProject] = useState(initialProject);
  const [items, setItems] = useState<DraftItem[]>(() => toDraftItems(initialProject));
  const [voices, setVoices] = useState<VoiceState>({
    status: "loading",
    options: [],
    error: null,
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyById, setBusyById] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [renderState, setRenderState] = useState<RenderState>({
    status: "idle",
    logs: [],
    videoPath: null,
    lastError: null,
  });
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const voicesAvailable = voices.status === "ready" && voices.options.length > 0;

  useEffect(() => {
    const eventSource = new EventSource("/api/render/stream");
    eventSource.onmessage = (event) => {
      const payload = JSON.parse(event.data) as RenderState;
      setRenderState(payload);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    void loadVoices();
  }, []);

  const canRunTts = voicesAvailable && !saving;
  const videoHref = renderState.videoPath
    ? `${renderState.videoPath}?t=${renderState.logs.length}`
    : null;

  async function loadVoices() {
    setVoices({
      status: "loading",
      options: [],
      error: null,
    });

    try {
      const response = await fetch("/api/voices", { cache: "no-store" });
      const data = (await response.json()) as
        | { options: VoiceOption[] }
        | { error: string };

      if (!response.ok || !("options" in data)) {
        throw new Error("error" in data ? data.error : `HTTP ${response.status}`);
      }

      setVoices({
        status: "ready",
        options: data.options,
        error: null,
      });
      setItems((current) =>
        current.map((item) => {
          if (item.voiceName || data.options.length === 0) {
            return item;
          }

          const fallback = data.options[0];
          if (!fallback) {
            return item;
          }

          return {
            ...item,
            voiceName: fallback.voiceName,
            voiceVersion: fallback.voiceVersion ?? "",
          };
        }),
      );
    } catch (loadError) {
      setVoices({
        status: "error",
        options: [],
        error: loadError instanceof Error ? loadError.message : "Failed to load voices",
      });
    }
  }

  function updateItem(id: string, update: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          ...update,
          speech:
            update.speech || item.speech
              ? {
                  ...item.speech,
                  ...update.speech,
                }
              : undefined,
        };
      }),
    );
  }

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

  async function analyzeItem(item: DraftItem) {
    setError(null);
    setMessage(null);
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

      updateItem(item.id, {
        speech: {
          analyzedText: data.analyzedText,
        },
      });
      setMessage("TSML を更新した。");
    } catch (analyzeError) {
      setError(analyzeError instanceof Error ? analyzeError.message : "Analyze failed");
    } finally {
      setItemBusy(item.id, null);
    }
  }

  async function previewItem(item: DraftItem) {
    setError(null);
    setMessage(null);
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

  async function saveProject() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/sequences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });
      const data = (await response.json()) as SavedProject | { error: string };

      if (!response.ok || !("items" in data)) {
        throw new Error("error" in data ? data.error : `HTTP ${response.status}`);
      }

      setSavedProject(data);
      setItems(toDraftItems(data));
      setMessage("保存して音声を更新した。");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function startRender() {
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/render", {
        method: "POST",
      });
      const data = (await response.json()) as { started?: boolean; error?: string };
      if (!response.ok || !data.started) {
        throw new Error(data.error ?? "Render start failed");
      }
      setMessage("Render を開始した。");
    } catch (renderError) {
      setError(renderError instanceof Error ? renderError.message : "Render failed");
    }
  }

  const voiceSelectOptions = useMemo(() => voices.options, [voices.options]);

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Remotion + VoiSona Example</h1>
        <p>保存済み preview と編集中フォームを分離した最小管理画面。</p>
      </header>

      <div className="layout-grid">
        <aside className="sticky-column">
          <PlayerPane project={savedProject} />

          <section className="panel">
            <div className="panel-body">
              <div className="section-head">
                <h2>Render</h2>
                <span
                  className={`badge ${renderState.status === "error" ? "error" : ""}`}
                >
                  {renderState.status}
                </span>
              </div>
              <p className="panel-copy">
                保存済み `data/sequences.json` を使って `out/latest.mp4` を上書きする。
              </p>
              <div className="actions" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="button"
                  disabled={!canRunTts || renderState.status === "running"}
                  onClick={() => {
                    void startRender();
                  }}
                >
                  Render
                </button>
                {videoHref ? (
                  <a className="button secondary" href={videoHref} target="_blank">
                    latest.mp4
                  </a>
                ) : null}
              </div>
              <div className="log-box" style={{ marginTop: 14 }}>
                <pre>{renderState.logs.join("\n") || "No logs yet."}</pre>
              </div>
              {renderState.lastError ? (
                <div className="error-text" style={{ marginTop: 10 }}>
                  {renderState.lastError}
                </div>
              ) : null}
            </div>
          </section>
        </aside>

        <section className="editor-column">
          <div className="panel">
            <div className="panel-body">
              <div className="section-head">
                <h2>Editor</h2>
                <div className="actions">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => {
                      setItems((current) => {
                        const next = [...current, createDraftItem()];
                        if (voicesAvailable && voiceSelectOptions[0]) {
                          const fallback = voiceSelectOptions[0];
                          const last = next[next.length - 1];
                          if (last && !last.voiceName) {
                            last.voiceName = fallback.voiceName;
                            last.voiceVersion = fallback.voiceVersion ?? "";
                          }
                        }
                        return next;
                      });
                    }}
                  >
                    行を追加
                  </button>
                  <button
                    type="button"
                    className="button"
                    disabled={!canRunTts || items.length === 0}
                    onClick={() => {
                      void saveProject();
                    }}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="actions" style={{ marginBottom: 14 }}>
                <span className={`badge ${voices.status === "error" ? "error" : ""}`}>
                  {voices.status === "loading"
                    ? "voices loading"
                    : voices.status === "ready"
                      ? `${voices.options.length} voices`
                      : "voices unavailable"}
                </span>
                <button type="button" className="button ghost" onClick={() => void loadVoices()}>
                  voices 再取得
                </button>
              </div>

              {voices.status === "error" ? (
                <div className="error-text" style={{ marginBottom: 14 }}>
                  {voices.error}
                </div>
              ) : null}
              {message ? <div className="hint" style={{ marginBottom: 14 }}>{message}</div> : null}
              {error ? <div className="error-text" style={{ marginBottom: 14 }}>{error}</div> : null}

              {items.length === 0 ? (
                <div className="hint">行がない。追加して開始。</div>
              ) : (
                items.map((item, index) => {
                  const busy = busyById[item.id];

                  return (
                    <article key={item.id} className="item-card">
                      <div className="item-head">
                        <div className="item-title">Line {index + 1}</div>
                        <button
                          type="button"
                          className="button ghost"
                          onClick={() => {
                            setItems((current) => current.filter((entry) => entry.id !== item.id));
                          }}
                        >
                          削除
                        </button>
                      </div>

                      <div className="field-row">
                        <div className="field">
                          <label>Voice</label>
                          <select
                            value={`${item.voiceName}::${item.voiceVersion ?? ""}`}
                            onChange={(event) => {
                              const [voiceName, voiceVersion] = event.target.value.split("::");
                              updateItem(item.id, {
                                voiceName,
                                voiceVersion,
                              });
                            }}
                          >
                            <option value="::">Select a voice</option>
                            {voiceSelectOptions.map((option) => (
                              <option
                                key={`${option.voiceName}:${option.voiceVersion ?? ""}`}
                                value={`${option.voiceName}::${option.voiceVersion ?? ""}`}
                              >
                                {option.displayName}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="field">
                          <label>Read Text</label>
                          <input
                            value={item.readText ?? ""}
                            onChange={(event) => {
                              updateItem(item.id, { readText: event.target.value });
                            }}
                            placeholder="空なら text をそのまま使う"
                          />
                        </div>
                      </div>

                      <div className="field">
                        <label>Text</label>
                        <textarea
                          value={item.text}
                          onChange={(event) => {
                            updateItem(item.id, { text: event.target.value });
                          }}
                        />
                      </div>

                      <div className="actions">
                        <button
                          type="button"
                          className="button secondary"
                          disabled={!canRunTts || !item.text.trim() || !item.voiceName || Boolean(busy)}
                          onClick={() => {
                            void analyzeItem(item);
                          }}
                        >
                          {busy === "analyze" ? "Analyzing..." : "Analyze"}
                        </button>
                        <button
                          type="button"
                          className="button ghost"
                          disabled={!canRunTts || !item.text.trim() || !item.voiceName || Boolean(busy)}
                          onClick={() => {
                            void previewItem(item);
                          }}
                        >
                          {busy === "preview" ? "Previewing..." : "Preview"}
                        </button>
                      </div>

                      <div className="field">
                        <label>TSML</label>
                        <TsmlEditor
                          value={item.speech?.analyzedText}
                          onChange={(nextValue) => {
                            updateItem(item.id, {
                              speech: {
                                analyzedText: nextValue,
                              },
                            });
                          }}
                        />
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
