import { readRenderSnapshot, subscribeRender } from "@/lib/render-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function encodeMessage(payload: unknown) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let lastUpdatedAt = -1;

      const pushSnapshot = (snapshot: Awaited<ReturnType<typeof readRenderSnapshot>>) => {
        if (closed || snapshot.updatedAt === lastUpdatedAt) {
          return;
        }

        lastUpdatedAt = snapshot.updatedAt;
        controller.enqueue(encoder.encode(encodeMessage(snapshot)));
      };

      const unsubscribe = subscribeRender((snapshot) => {
        pushSnapshot(snapshot);
      });

      void readRenderSnapshot().then((snapshot) => {
        pushSnapshot(snapshot);
      });

      const polling = setInterval(() => {
        void readRenderSnapshot().then((snapshot) => {
          pushSnapshot(snapshot);
        });
      }, 500);

      const heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        }
      }, 15_000);

      const close = () => {
        if (closed) {
          return;
        }

        closed = true;
        clearInterval(polling);
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
      };

      request.signal.addEventListener("abort", close, { once: true });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
