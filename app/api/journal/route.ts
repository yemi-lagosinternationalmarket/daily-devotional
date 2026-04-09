import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDevotional, insertJournalEntry, listDevotionals } from "@/lib/queries";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { devotional_id, step, response_text } = await request.json();

  if (!devotional_id || !step || !response_text) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  if (typeof response_text !== "string" || response_text.length > 5000) {
    return NextResponse.json({ error: "Response too long" }, { status: 400 });
  }

  // Verify devotional belongs to this user
  const devotional = await getDevotional(session.user.id, devotional_id);
  if (!devotional) {
    return NextResponse.json({ error: "Devotional not found" }, { status: 404 });
  }

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
