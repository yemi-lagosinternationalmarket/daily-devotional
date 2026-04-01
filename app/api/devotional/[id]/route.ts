import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDevotional, getJournalEntries } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const devotional = await getDevotional(session.user.id, id);
  if (!devotional) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const entries = await getJournalEntries(session.user.id, id);
  return NextResponse.json({ ...devotional, journal_entries: entries });
}
