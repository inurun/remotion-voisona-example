import { describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { registerVoisonaRoutes } from "./route";

const { listVoisonaVoicesMock, analyzeVoisonaTextMock, synthesizeVoisonaMock } = vi.hoisted(() => ({
  listVoisonaVoicesMock: vi.fn(),
  analyzeVoisonaTextMock: vi.fn(),
  synthesizeVoisonaMock: vi.fn(),
}));

vi.mock("./use-case", () => ({
  listVoisonaVoices: listVoisonaVoicesMock,
  analyzeVoisonaText: analyzeVoisonaTextMock,
  synthesizeVoisona: synthesizeVoisonaMock,
}));

describe("voisona routes", () => {
  it("returns voices", async () => {
    listVoisonaVoicesMock.mockResolvedValueOnce([
      { voiceName: "voice", displayName: "voice", voiceVersion: "1" },
    ]);

    const app = new Hono();
    registerVoisonaRoutes(app);

    const response = await app.request("/voisona/voices");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      options: [{ voiceName: "voice", displayName: "voice", voiceVersion: "1" }],
    });
  });

  it("validates synthesize payloads", async () => {
    const app = new Hono();
    registerVoisonaRoutes(app);

    const response = await app.request("/voisona/synthesize", {
      method: "POST",
      body: JSON.stringify({ text: "", voiceName: "" }),
      headers: { "Content-Type": "application/json" },
    });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ error: expect.any(String) });
  });
});
