import { describe, expect, it, vi } from "vitest";
import { projectApp } from "./route";
import { InvalidProjectPathError, ProjectNotFoundError } from "@/server/_shared/storage";

const { listProjectsMock, loadProjectMock, saveProjectMock } = vi.hoisted(() => ({
  listProjectsMock: vi.fn(),
  loadProjectMock: vi.fn(),
  saveProjectMock: vi.fn(),
}));

vi.mock("./use-case", () => ({
  listProjects: listProjectsMock,
  loadProject: loadProjectMock,
  saveProject: saveProjectMock,
}));

describe("project routes", () => {
  it("lists projects", async () => {
    listProjectsMock.mockResolvedValueOnce([
      { path: "project", name: "project", segments: ["project"], updatedAt: 1 },
    ]);

    const response = await projectApp.request("/projects");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { path: "project", name: "project", segments: ["project"], updatedAt: 1 },
    ]);
  });

  it("loads a nested project", async () => {
    loadProjectMock.mockResolvedValueOnce({ pages: [] });

    const response = await projectApp.request("/project/nested/example");
    expect(response.status).toBe(200);
    expect(loadProjectMock).toHaveBeenCalledWith("nested/example");
  });

  it("returns not found for missing project", async () => {
    loadProjectMock.mockRejectedValueOnce(new ProjectNotFoundError("missing"));

    const response = await projectApp.request("/project/missing");
    expect(response.status).toBe(404);
  });

  it("returns bad request for missing path", async () => {
    saveProjectMock.mockRejectedValueOnce(new InvalidProjectPathError("bad"));

    const response = await projectApp.request("/project/bad.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pages: [] }),
    });
    expect(response.status).toBe(400);
  });
});
