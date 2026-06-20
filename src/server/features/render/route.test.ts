import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { registerRenderRoutes } from "./route";

const snapshot = {
  status: "idle" as const,
  logs: ["hello"],
  videoPath: null,
  updatedAt: 1,
  lastError: null,
};

const { readRenderSnapshotMock, startRenderMock, subscribeRenderMock, readFileMock } = vi.hoisted(
  () => ({
    readRenderSnapshotMock: vi.fn(),
    startRenderMock: vi.fn(),
    subscribeRenderMock: vi.fn(),
    readFileMock: vi.fn(),
  }),
);

vi.mock("./render-state", () => ({
  readRenderSnapshot: readRenderSnapshotMock,
  startRender: startRenderMock,
  subscribeRender: subscribeRenderMock,
}));

vi.mock("node:fs/promises", () => ({
  default: {
    readFile: readFileMock,
  },
}));

describe("render routes", () => {
  it("returns the current snapshot", async () => {
    readRenderSnapshotMock.mockResolvedValue(snapshot);

    const app = new Hono();
    registerRenderRoutes(app);

    const response = await app.request("/render");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(snapshot);
  });

  it("streams snapshots over SSE", async () => {
    readRenderSnapshotMock.mockResolvedValue(snapshot);
    subscribeRenderMock.mockImplementation((listener: (value: typeof snapshot) => void) => {
      listener(snapshot);
      return () => undefined;
    });

    const app = new Hono();
    registerRenderRoutes(app);

    const response = await app.request("/render/stream");
    expect(response.headers.get("content-type")).toBe("text/event-stream");

    const reader = response.body?.getReader();
    const chunk = await reader?.read();
    expect(new TextDecoder().decode(chunk?.value)).toContain('"status":"idle"');
  });

  it("serves the latest video file", async () => {
    readFileMock.mockResolvedValueOnce(Buffer.from("video"));

    const app = new Hono();
    registerRenderRoutes(app);

    const response = await app.request("/render/video");
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("video");
  });
});
