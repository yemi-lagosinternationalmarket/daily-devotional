import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { insertDevotional, getRecentDevotionalRefs, getUserSettings } from "@/lib/queries";
import { generateDevotionalStreaming } from "@/lib/ai";
import type { DevotionalGenerationRequest } from "@/lib/types";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  const userId = session.user.id;

  // 20 generations per hour per user
  const { ok } = rateLimit(`generate:${userId}`, 20, 60 * 60 * 1000);
  if (!ok) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("event: error\ndata: You've reached the limit. Take a break and come back soon.\n\n"));
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
  }

  const body = await request.json();
  const { topic, mood, free_text, input_type, is_want_more, parent_devotional_id } = body;

  // Input length guards
  if (typeof free_text === "string" && free_text.length > 2000) {
    return new Response(JSON.stringify({ error: "Input too long" }), { status: 400 });
  }
  if (typeof topic === "string" && topic.length > 500) {
    return new Response(JSON.stringify({ error: "Input too long" }), { status: 400 });
  }

  const settings = await getUserSettings(userId);

  if (!settings?.llm_api_key && !process.env.OPENAI_API_KEY) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("event: error\ndata: No API key configured. Go to Settings to add your LLM provider.\n\n"));
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: string) {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      }

      try {
        const exclude_refs = await getRecentDevotionalRefs(userId);

        const req: DevotionalGenerationRequest = {
          topic: topic || null,
          mood: mood || null,
          free_text: free_text || null,
          input_type,
          exclude_refs,
        };

        const result = await generateDevotionalStreaming(req, settings, (status) => {
          send("status", status);
        });

        send("status", "Saving your devotional...");

        const devotional = await insertDevotional(userId, {
          ...result,
          topic: topic || null,
          mood: mood || null,
          free_text: free_text || null,
          input_type,
          is_want_more: is_want_more || false,
          parent_devotional_id: parent_devotional_id || null,
        });

        send("done", JSON.stringify(devotional));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("[devotional/generate] Generation failed:", errMsg, err);
        send("error", "Failed to generate devotional. Please try again.");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}
