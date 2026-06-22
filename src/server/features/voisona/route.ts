import { Hono } from "hono";
import { getServerEnv } from "@/server/core/env";
import { jsonError } from "@/server/_shared/http";
import { listVoisonaVoices, analyzeVoisonaText, synthesizeVoisona } from "./use-case";
import {
  synthesizeRequestSchema,
  synthesizeResponseSchema,
  textAnalysisRequestSchema,
  textAnalysisResponseSchema,
  voicesResponseSchema,
} from "./contract";

export const voisonaApp = new Hono()
  .get("/voisona/voices", async (c) => {
    try {
      return c.json(
        voicesResponseSchema.parse({ options: await listVoisonaVoices(getServerEnv(c)) }),
      );
    } catch (error) {
      return jsonError(c, 500, error, "Failed to load voices");
    }
  })
  .post("/voisona/text-analysis", async (c) => {
    try {
      const json = textAnalysisRequestSchema.parse(await c.req.json());
      return c.json(
        textAnalysisResponseSchema.parse(await analyzeVoisonaText(getServerEnv(c), json)),
      );
    } catch (error) {
      return jsonError(c, 500, error, "Analyze failed");
    }
  })
  .post("/voisona/synthesize", async (c) => {
    try {
      const json = synthesizeRequestSchema.parse(await c.req.json());
      return c.json(
        synthesizeResponseSchema.parse(
          await synthesizeVoisona({
            serverEnv: getServerEnv(c),
            ...json,
          }),
        ),
      );
    } catch (error) {
      return jsonError(c, 500, error, "Synthesize failed");
    }
  });
