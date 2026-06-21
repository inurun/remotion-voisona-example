import { beforeEach, describe, expect, it, vi } from "vitest";

const readSavedProjectMock = vi.fn();
const writeSavedProjectMock = vi.fn();
const ensureSavedProjectFileMock = vi.fn();
const listSavedProjectsMock = vi.fn();
const parseDraftPayloadMock = vi.fn((payload: unknown) => payload);
const analyzeVoisonaTextMock = vi.fn();
const synthesizeVoisonaMock = vi.fn();

vi.mock("@/server/_shared/storage", () => ({
  ensureSavedProjectFile: ensureSavedProjectFileMock,
  listSavedProjects: listSavedProjectsMock,
  parseDraftPayload: parseDraftPayloadMock,
  readSavedProject: readSavedProjectMock,
  writeSavedProject: writeSavedProjectMock,
}));

vi.mock("@/server/features/voisona/use-case", () => ({
  analyzeVoisonaText: analyzeVoisonaTextMock,
  synthesizeVoisona: synthesizeVoisonaMock,
}));

describe("project use-case", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reuses previous synthesized items when the input did not change", async () => {
    const previous = {
      pages: [
        {
          id: "page-1",
          richText: "<p>Hello</p>",
          tts: [
            {
              id: "tts-1",
              text: "Hello",
              readText: "Hello",
              voiceName: "voice",
              voiceVersion: "1",
              durationSec: 1.2,
              audio: { src: "/tts/old.wav" },
              speech: { analyzedText: "Hello" },
            },
          ],
        },
      ],
    };

    readSavedProjectMock.mockResolvedValueOnce(previous);
    const { saveProject } = await import("./use-case");
    const result = await saveProject({}, "nested/example", {
      pages: [
        {
          id: "page-1",
          richText: "<p>Hello</p>",
          tts: [
            {
              id: "tts-1",
              text: "Hello",
              readText: "Hello",
              voiceName: "voice",
              voiceVersion: "1",
              speech: { analyzedText: "Hello" },
            },
          ],
        },
      ],
    });

    expect(result).toEqual(previous);
    expect(analyzeVoisonaTextMock).not.toHaveBeenCalled();
    expect(synthesizeVoisonaMock).not.toHaveBeenCalled();
    expect(writeSavedProjectMock).toHaveBeenCalledWith("nested/example", previous);
  });

  it("saves a freshly synthesized project", async () => {
    readSavedProjectMock.mockResolvedValueOnce({
      pages: [
        {
          id: "page-1",
          richText: "<p>Previous</p>",
          tts: [],
        },
      ],
    });
    analyzeVoisonaTextMock.mockResolvedValueOnce({ analyzedText: "analysis" });
    synthesizeVoisonaMock.mockResolvedValueOnce({
      audioSrc: "/tts/generated.wav",
      outputPath: "/tmp/generated.wav",
      durationSec: 2,
    });

    const { saveProject } = await import("./use-case");
    const saved = await saveProject({}, "project", {
      pages: [
        {
          id: "page-1",
          richText: "<p>Hello</p>",
          tts: [{ id: "tts-1", text: "Hello", voiceName: "voice", speech: {} }],
        },
      ],
    });

    expect(saved.pages[0]?.tts[0]?.audio.src).toBe("/tts/generated.wav");
    expect(writeSavedProjectMock).toHaveBeenCalledWith("project", saved);
  });

  it("lists saved projects", async () => {
    const projects = [
      { path: "a", name: "a", segments: ["a"], updatedAt: 10 },
      { path: "nested/b", name: "b", segments: ["nested", "b"], updatedAt: 9 },
    ];
    listSavedProjectsMock.mockResolvedValueOnce(projects);

    const { listProjects } = await import("./use-case");
    await expect(listProjects()).resolves.toEqual(projects);
  });
});
