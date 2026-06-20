import { z } from "zod";

const videoEnvSchema = z.object({
  VITE_VIDEO_WIDTH: z.coerce.number().int().positive().default(1280),
  VITE_VIDEO_HEIGHT: z.coerce.number().int().positive().default(720),
  VITE_VIDEO_FPS: z.coerce.number().int().positive().default(24),
});

const processEnv =
  typeof process !== "undefined" && process.env ? process.env : ({} as Record<string, string>);

const parsed = videoEnvSchema.parse({
  VITE_VIDEO_WIDTH:
    import.meta.env.VITE_VIDEO_WIDTH ??
    processEnv["VITE_VIDEO_WIDTH"] ??
    processEnv["NEXT_PUBLIC_VIDEO_WIDTH"],
  VITE_VIDEO_HEIGHT:
    import.meta.env.VITE_VIDEO_HEIGHT ??
    processEnv["VITE_VIDEO_HEIGHT"] ??
    processEnv["NEXT_PUBLIC_VIDEO_HEIGHT"],
  VITE_VIDEO_FPS:
    import.meta.env.VITE_VIDEO_FPS ??
    processEnv["VITE_VIDEO_FPS"] ??
    processEnv["NEXT_PUBLIC_VIDEO_FPS"],
});

export const VIDEO_WIDTH = parsed.VITE_VIDEO_WIDTH;
export const VIDEO_HEIGHT = parsed.VITE_VIDEO_HEIGHT;
export const VIDEO_FPS = parsed.VITE_VIDEO_FPS;
export const COMP_NAME = "RemotionVoisonaExample";
