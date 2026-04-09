import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ok } = rateLimit(`test-llm:${session.user.id}`, 5, 60 * 1000); // 5 per minute
  if (!ok) {
    return NextResponse.json({ error: "Too many attempts. Wait a minute." }, { status: 429 });
  }

  const { base_url, api_key, model } = await request.json();

  try {
    const client = new OpenAI({ baseURL: base_url, apiKey: api_key });
    const response = await client.chat.completions.create({
      model,
      max_tokens: 5,
      messages: [{ role: "user", content: "hi" }],
    });
    const text = response.choices[0]?.message?.content || "";
    return NextResponse.json({ ok: true, response: text });
  } catch (err) {
    console.error("[test-llm] Failed:", err);
    return NextResponse.json({ ok: false, error: "Connection failed. Check your API key and URL." }, { status: 400 });
  }
}
