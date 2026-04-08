import pool from "./db";
import type { Devotional, JournalEntry, UserSettings, InputType } from "./types";

// ── Users ──

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const result = await pool.query("SELECT * FROM user_settings WHERE user_id = $1", [userId]);
  return result.rows[0] || null;
}

export async function updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 2;

  const allowed = ["llm_base_url", "llm_api_key", "llm_model", "bible_translation", "default_vibe", "theme", "spotify_access_token", "spotify_refresh_token", "spotify_connected", "spotify_playlist_praise", "spotify_playlist_worship", "spotify_playlist_instrumental"];
  for (const key of allowed) {
    if (key in settings) {
      fields.push(`${key} = $${idx}`);
      values.push((settings as Record<string, unknown>)[key]);
      idx++;
    }
  }

  if (fields.length === 0) {
    const current = await getUserSettings(userId);
    if (!current) throw new Error("Settings not found");
    return current;
  }

  fields.push(`updated_at = NOW()`);
  const result = await pool.query(
    `UPDATE user_settings SET ${fields.join(", ")} WHERE user_id = $1 RETURNING *`,
    [userId, ...values]
  );
  return result.rows[0];
}

// ── Devotionals ──

export async function insertDevotional(userId: string, params: {
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
      user_id, topic, mood, free_text, input_type,
      scripture_ref, scripture_text, scripture_translation, full_chapter_text,
      observe_question, reflect_content, apply_action, apply_time_estimate,
      pray_text, key_verse, is_want_more, parent_devotional_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    RETURNING *`,
    [
      userId, params.topic, params.mood, params.free_text, params.input_type,
      params.scripture_ref, params.scripture_text, params.scripture_translation,
      params.full_chapter_text, params.observe_question, params.reflect_content,
      params.apply_action, params.apply_time_estimate, params.pray_text,
      params.key_verse, params.is_want_more, params.parent_devotional_id,
    ]
  );
  return result.rows[0];
}

export async function getDevotional(userId: string, id: string): Promise<Devotional | null> {
  const result = await pool.query(
    "SELECT * FROM devotionals WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return result.rows[0] || null;
}

export async function getRecentDevotionalRefs(userId: string, limit: number = 7): Promise<string[]> {
  const result = await pool.query(
    "SELECT scripture_ref FROM devotionals WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
    [userId, limit]
  );
  return result.rows.map((r: { scripture_ref: string }) => r.scripture_ref);
}

export async function listDevotionals(userId: string): Promise<Devotional[]> {
  const result = await pool.query(
    "SELECT * FROM devotionals WHERE user_id = $1 AND is_want_more = false ORDER BY created_at DESC LIMIT 50",
    [userId]
  );
  return result.rows;
}

// ── Journal ──

export async function insertJournalEntry(userId: string, params: {
  devotional_id: string;
  step: "observe" | "apply";
  response_text: string;
}): Promise<JournalEntry> {
  const result = await pool.query(
    `INSERT INTO journal_entries (user_id, devotional_id, step, response_text)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, params.devotional_id, params.step, params.response_text]
  );
  return result.rows[0];
}

export async function getJournalEntries(userId: string, devotionalId: string): Promise<JournalEntry[]> {
  const result = await pool.query(
    "SELECT * FROM journal_entries WHERE devotional_id = $1 AND user_id = $2 ORDER BY created_at",
    [devotionalId, userId]
  );
  return result.rows;
}
