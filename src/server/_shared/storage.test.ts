import { beforeEach, describe, expect, it, vi } from "vitest";

const { accessMock, mkdirMock, readFileMock, readdirMock, statMock, writeFileMock } = vi.hoisted(
  () => ({
    accessMock: vi.fn(),
    mkdirMock: vi.fn(),
    readFileMock: vi.fn(),
    readdirMock: vi.fn(),
    statMock: vi.fn(),
    writeFileMock: vi.fn(),
  }),
);

vi.mock("node:fs/promises", () => ({
  default: {
    access: accessMock,
    mkdir: mkdirMock,
    readFile: readFileMock,
    readdir: readdirMock,
    stat: statMock,
    writeFile: writeFileMock,
  },
}));

describe("storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid project paths", async () => {
    const { InvalidProjectPathError, readSavedProject } = await import("./storage");

    await expect(readSavedProject("../bad")).rejects.toBeInstanceOf(InvalidProjectPathError);
  });

  it("throws ProjectNotFoundError when the project file is missing", async () => {
    const { ProjectNotFoundError, readSavedProject } = await import("./storage");
    readFileMock.mockRejectedValueOnce({ code: "ENOENT" });

    await expect(readSavedProject("missing")).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("creates the default project when no saved projects exist", async () => {
    readdirMock.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        isDirectory: () => false,
        isFile: () => true,
        name: "project.json",
      },
    ]);
    accessMock.mockRejectedValueOnce({ code: "ENOENT" });
    statMock.mockResolvedValueOnce({ mtimeMs: 42 });

    const { listSavedProjects } = await import("./storage");
    const projects = await listSavedProjects();

    expect(projects).toEqual([
      {
        path: "project",
        name: "project",
        segments: ["project"],
        updatedAt: 42,
      },
    ]);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
  });
});
