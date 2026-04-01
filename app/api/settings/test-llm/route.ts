import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
