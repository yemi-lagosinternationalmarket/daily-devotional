import { NextRequest, NextResponse } from "next/server";
import { getDevotional, getJournalEntries } from "@/lib/queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const devotional = await getDevotional(id);
  if (!devotional) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const entries = await getJournalEntries(id);
  return NextResponse.json({ ...devotional, journal_entries: entries });
}
