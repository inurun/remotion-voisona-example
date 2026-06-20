import type { Context } from "hono";
import { env } from "hono/adapter";

export type ServerEnv = {
  NEXT_PUBLIC_VIDEO_FPS?: string;
  NEXT_PUBLIC_VIDEO_HEIGHT?: string;
  NEXT_PUBLIC_VIDEO_WIDTH?: string;
  VITE_VIDEO_FPS?: string;
  VITE_VIDEO_HEIGHT?: string;
  VITE_VIDEO_WIDTH?: string;
  VOISONA_BASE?: string;
  VOISONA_PASSWORD?: string;
  VOISONA_USERNAME?: string;
  VOISONA_VOICES_PATH?: string;
};

export function getServerEnv(c: Context): ServerEnv {
  return env<ServerEnv>(c);
}
