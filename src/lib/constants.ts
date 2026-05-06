import { z } from "zod";

const videoEnvSchema = z.object({
  NEXT_PUBLIC_VIDEO_WIDTH: z.coerce.number().int().positive().default(1280),
  NEXT_PUBLIC_VIDEO_HEIGHT: z.coerce.number().int().positive().default(720),
  NEXT_PUBLIC_VIDEO_FPS: z.coerce.number().int().positive().default(24),
});

const parsed = videoEnvSchema.parse({
  NEXT_PUBLIC_VIDEO_WIDTH: process.env["NEXT_PUBLIC_VIDEO_WIDTH"],
  NEXT_PUBLIC_VIDEO_HEIGHT: process.env["NEXT_PUBLIC_VIDEO_HEIGHT"],
  NEXT_PUBLIC_VIDEO_FPS: process.env["NEXT_PUBLIC_VIDEO_FPS"],
});

export const VIDEO_WIDTH = parsed.NEXT_PUBLIC_VIDEO_WIDTH;
export const VIDEO_HEIGHT = parsed.NEXT_PUBLIC_VIDEO_HEIGHT;
export const VIDEO_FPS = parsed.NEXT_PUBLIC_VIDEO_FPS;
export const COMP_NAME = "RemotionVoisonaExample";
