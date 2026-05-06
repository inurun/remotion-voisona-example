"use client";

import { useMemo } from "react";

type TsmlAttribute = {
  name: string;
  value: string;
};

type TsmlWord = {
  text: string;
  attributes: TsmlAttribute[];
};

type TsmlPhrase = {
  words: TsmlWord[];
};

type TsmlDocument = {
  phrases: TsmlPhrase[];
};

const COMBINING_MORA_CHARS = new Set([
  "ゃ",
  "ゅ",
  "ょ",
  "ぁ",
  "ぃ",
  "ぅ",
  "ぇ",
  "ぉ",
  "ゎ",
  "ャ",
  "ュ",
  "ョ",
  "ァ",
  "ィ",
  "ゥ",
  "ェ",
  "ォ",
  "ヮ",
  "ヵ",
  "ヶ",
]);

function parseTsml(input: string): TsmlDocument {
  const parser = new DOMParser();
  const document = parser.parseFromString(input, "application/xml");
  const parserError = document.querySelector("parsererror");

  if (parserError) {
    throw new Error("Invalid TSML");
  }

  const root = document.documentElement;
  if (!root || root.tagName !== "tsml") {
    throw new Error("TSML root element is missing");
  }

  return {
    phrases: Array.from(root.children).map((phraseElement) => {
      if (phraseElement.tagName !== "acoustic_phrase") {
        throw new Error("Unsupported TSML element inside <tsml>");
      }

      return {
        words: Array.from(phraseElement.children).map((wordElement) => {
          if (wordElement.tagName !== "word") {
            throw new Error("Unsupported TSML element inside <acoustic_phrase>");
          }

          return {
            text: wordElement.textContent ?? "",
            attributes: wordElement.getAttributeNames().map((name) => ({
              name,
              value: wordElement.getAttribute(name) ?? "",
            })),
          };
        }),
      };
    }),
  };
}

function cloneTsmlDocument(document: TsmlDocument): TsmlDocument {
  return {
    phrases: document.phrases.map((phrase) => ({
      words: phrase.words.map((word) => ({
        text: word.text,
        attributes: word.attributes.map((attribute) => ({ ...attribute })),
      })),
    })),
  };
}

function getWordAttribute(word: TsmlWord, name: string) {
  return word.attributes.find((attribute) => attribute.name === name)?.value;
}

function setWordAttribute(word: TsmlWord, name: string, value: string) {
  const existing = word.attributes.find((attribute) => attribute.name === name);
  if (existing) {
    existing.value = value;
    return;
  }

  word.attributes.push({ name, value });
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function serializeTsml(document: TsmlDocument) {
  return `<tsml>${document.phrases
    .map(
      (phrase) =>
        `<acoustic_phrase>${phrase.words
          .map((word) => {
            const attributes = word.attributes
              .map(({ name, value }) => `${name}="${escapeXml(value)}"`)
              .join(" ");

            return `<word${attributes ? ` ${attributes}` : ""}>${escapeXml(word.text)}</word>`;
          })
          .join("")}</acoustic_phrase>`,
    )
    .join("")}</tsml>`;
}

function splitPronunciationIntoMoras(pronunciation: string) {
  const normalized = pronunciation.replaceAll(/[’']/g, "").trim();
  const moras: string[] = [];

  for (const character of normalized) {
    if (moras.length > 0 && COMBINING_MORA_CHARS.has(character)) {
      moras[moras.length - 1] += character;
      continue;
    }

    moras.push(character);
  }

  return moras;
}

function toggleWordHlAtIndex(word: TsmlWord, index: number) {
  const current = getWordAttribute(word, "hl") ?? "";
  if (index < 0 || index >= current.length) {
    return;
  }

  const nextValue =
    current[index] === "h"
      ? `${current.slice(0, index)}l${current.slice(index + 1)}`
      : `${current.slice(0, index)}h${current.slice(index + 1)}`;

  setWordAttribute(word, "hl", nextValue);
}

function setPhraseBoundaryChain(
  document: TsmlDocument,
  phraseIndex: number,
  wordIndex: number,
  chained: boolean,
) {
  const nextWord = document.phrases[phraseIndex]?.words[wordIndex + 1];
  if (!nextWord) {
    return;
  }

  setWordAttribute(nextWord, "chain", chained ? "1" : "0");
}

function getWordLabel(word: TsmlWord) {
  return word.text.trim() || getWordAttribute(word, "original") || "(blank)";
}

export function TsmlEditor({
  value,
  onChange,
}: {
  value?: string;
  onChange: (nextValue: string) => void;
}) {
  const parsed = useMemo(() => {
    const trimmed = value?.trim() ?? "";
    if (!trimmed) {
      return { status: "empty" as const };
    }

    try {
      return {
        status: "ready" as const,
        document: parseTsml(trimmed),
      };
    } catch (error) {
      return {
        status: "error" as const,
        message: error instanceof Error ? error.message : "Failed to parse TSML",
      };
    }
  }, [value]);

  if (parsed.status === "empty") {
    return <div className="hint">Analyze を実行すると TSML を編集できる。</div>;
  }

  if (parsed.status === "error") {
    return <div className="error-text">{parsed.message}</div>;
  }

  const updateDocument = (mutate: (document: TsmlDocument) => void) => {
    const nextDocument = cloneTsmlDocument(parsed.document);
    mutate(nextDocument);
    onChange(serializeTsml(nextDocument));
  };

  return (
    <div className="field-grid">
      {parsed.document.phrases.map((phrase, phraseIndex) => (
        <div key={`phrase-${phraseIndex}`} className="tone-grid">
          {phrase.words.map((word, wordIndex) => {
            const wordLabel = getWordLabel(word);
            const pronunciation = getWordAttribute(word, "pronunciation") ?? "";
            const moras = splitPronunciationIntoMoras(pronunciation);
            const hl = getWordAttribute(word, "hl") ?? "";
            const editable = Boolean(hl) && hl.length === moras.length && moras.length > 0;
            const nextWord = phrase.words[wordIndex + 1];
            const isChained = nextWord
              ? (getWordAttribute(nextWord, "chain") ?? "0") === "1"
              : false;

            if (!editable) {
              return null;
            }

            return (
              <div key={`${phraseIndex}-${wordIndex}`} className="tone-card">
                <strong>{wordLabel}</strong>
                <div className="tone-buttons">
                  {moras.map((mora, moraIndex) => (
                    <button
                      key={`${phraseIndex}-${wordIndex}-${moraIndex}`}
                      type="button"
                      className={`tone-button ${hl[moraIndex] === "h" ? "active" : ""}`}
                      onClick={() => {
                        updateDocument((document) => {
                          const next = document.phrases[phraseIndex]?.words[wordIndex];
                          if (!next) {
                            return;
                          }

                          toggleWordHlAtIndex(next, moraIndex);
                        });
                      }}
                    >
                      {mora}
                    </button>
                  ))}
                </div>
                {nextWord ? (
                  <button
                    type="button"
                    className={`button ${isChained ? "" : "secondary"}`}
                    onClick={() => {
                      updateDocument((document) => {
                        setPhraseBoundaryChain(document, phraseIndex, wordIndex, !isChained);
                      });
                    }}
                  >
                    {isChained ? "連結中" : "連結なし"}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
