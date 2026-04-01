import { NextRequest, NextResponse } from "next/server";
import { generateDevotional } from "@/lib/ai";
import { insertDevotional, getRecentDevotionalRefs } from "@/lib/queries";
import type { DevotionalGenerationRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { topic, mood, free_text, input_type, is_want_more, parent_devotional_id } = body;

  const exclude_refs = await getRecentDevotionalRefs();

  const req: DevotionalGenerationRequest = {
    topic: topic || null,
    mood: mood || null,
    free_text: free_text || null,
    input_type,
    exclude_refs,
  };

  const result = await generateDevotional(req);

  const devotional = await insertDevotional({
    ...result,
    topic: topic || null,
    mood: mood || null,
    free_text: free_text || null,
    input_type,
    is_want_more: is_want_more || false,
    parent_devotional_id: parent_devotional_id || null,
  });

  return NextResponse.json(devotional);
}
