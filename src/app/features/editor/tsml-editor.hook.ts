import { useEffect, useState } from "react";
import {
  cloneTsmlDocument,
  getWordAttribute,
  parseTsml,
  type TsmlDocument,
  serializeTsml,
  setPhraseBoundaryChain,
  splitPronunciationIntoMoras,
  toggleWordHlAtIndex,
} from "@/app/features/editor/tsml";

type ParsedTsmlState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; document: TsmlDocument };

function getTsmlParseErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to parse TSML";
}

function parseTsmlState(value?: string): ParsedTsmlState {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return { status: "empty" };
  }

  try {
    return {
      status: "ready",
      document: parseTsml(trimmed),
    };
  } catch (error) {
    return {
      status: "error",
      message: getTsmlParseErrorMessage(error),
    };
  }
}

function useParsedTsml(value?: string): ParsedTsmlState {
  const [parsed, setParsed] = useState<ParsedTsmlState>({ status: "loading" });

  useEffect(() => {
    setParsed(parseTsmlState(value));
  }, [value]);

  return parsed;
}

export function useTsmlEditor(value?: string) {
  const parsed = useParsedTsml(value);

  function updateDocument(
    mutate: (document: TsmlDocument) => void,
    onChange: (nextValue: string) => void,
  ) {
    if (parsed.status !== "ready") {
      return;
    }

    const nextDocument = cloneTsmlDocument(parsed.document);
    mutate(nextDocument);
    onChange(serializeTsml(nextDocument));
  }

  return {
    parsed,
    getWordAttribute,
    splitPronunciationIntoMoras,
    toggleWordHlAtIndex,
    setPhraseBoundaryChain,
    updateDocument,
  };
}
