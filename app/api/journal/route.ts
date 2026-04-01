import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { insertJournalEntry, listDevotionals } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { devotional_id, step, response_text } = await request.json();
  const entry = await insertJournalEntry(session.user.id, { devotional_id, step, response_text });
  return NextResponse.json(entry);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const devotionals = await listDevotionals(session.user.id);
  return NextResponse.json(devotionals);
}
