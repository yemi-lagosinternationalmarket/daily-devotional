import pool from "./db";
import type { Devotional, JournalEntry, InputType } from "./types";

export async function insertDevotional(params: {
  topic: string | null;
  mood: string | null;
  free_text: string | null;
  input_type: InputType;
  scripture_ref: string;
  scripture_text: string;
  scripture_translation: string;
  full_chapter_text: string | null;
  observe_question: string;
  reflect_content: string;
  apply_action: string;
  apply_time_estimate: string;
  pray_text: string;
  key_verse: string;
  is_want_more: boolean;
  parent_devotional_id: string | null;
}): Promise<Devotional> {
  const result = await pool.query(
    `INSERT INTO devotionals (
      topic, mood, free_text, input_type,
      scripture_ref, scripture_text, scripture_translation, full_chapter_text,
      observe_question, reflect_content, apply_action, apply_time_estimate,
      pray_text, key_verse, is_want_more, parent_devotional_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING *`,
    [
      params.topic, params.mood, params.free_text, params.input_type,
      params.scripture_ref, params.scripture_text, params.scripture_translation,
      params.full_chapter_text, params.observe_question, params.reflect_content,
      params.apply_action, params.apply_time_estimate, params.pray_text,
      params.key_verse, params.is_want_more, params.parent_devotional_id,
    ]
  );
  return result.rows[0];
}

export async function getDevotional(id: string): Promise<Devotional | null> {
  const result = await pool.query("SELECT * FROM devotionals WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function getRecentDevotionalRefs(limit: number = 7): Promise<string[]> {
  const result = await pool.query(
    "SELECT scripture_ref FROM devotionals ORDER BY created_at DESC LIMIT $1",
    [limit]
  );
  return result.rows.map((r: { scripture_ref: string }) => r.scripture_ref);
}

export async function listDevotionals(): Promise<Devotional[]> {
  const result = await pool.query(
    "SELECT * FROM devotionals WHERE is_want_more = false ORDER BY created_at DESC LIMIT 50"
  );
  return result.rows;
}

export async function insertJournalEntry(params: {
  devotional_id: string;
  step: "observe" | "apply";
  response_text: string;
}): Promise<JournalEntry> {
  const result = await pool.query(
    `INSERT INTO journal_entries (devotional_id, step, response_text)
     VALUES ($1, $2, $3) RETURNING *`,
    [params.devotional_id, params.step, params.response_text]
  );
  return result.rows[0];
}

export async function getJournalEntries(devotionalId: string): Promise<JournalEntry[]> {
  const result = await pool.query(
    "SELECT * FROM journal_entries WHERE devotional_id = $1 ORDER BY created_at",
    [devotionalId]
  );
  return result.rows;
}
