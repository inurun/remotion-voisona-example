import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export function jsonError(
  c: Context,
  status: ContentfulStatusCode,
  error: unknown,
  fallback: string,
) {
  return c.json(
    {
      error: error instanceof Error ? error.message : fallback,
    },
    { status },
  );
}

export function sseMessage(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}
