import { NextRequest, NextResponse } from "next/server";
import { insertJournalEntry, listDevotionals } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const { devotional_id, step, response_text } = await request.json();
  const entry = await insertJournalEntry({ devotional_id, step, response_text });
  return NextResponse.json(entry);
}

export async function GET() {
  const devotionals = await listDevotionals();
  return NextResponse.json(devotionals);
}
