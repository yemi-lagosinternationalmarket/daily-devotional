export type InputType = "topic" | "mood" | "combined" | "free_text" | "blessed";
export type JournalStep = "observe" | "apply";
export type VibeType = "praise" | "worship" | "instrumental";

export interface Devotional {
  id: string;
  date: string;
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
  created_at: string;
}

export interface JournalEntry {
  id: string;
  devotional_id: string;
  step: JournalStep;
  response_text: string;
  created_at: string;
}

export interface DevotionalGenerationRequest {
  topic: string | null;
  mood: string | null;
  free_text: string | null;
  input_type: InputType;
  exclude_refs: string[];
}

export interface DevotionalGenerationResult {
  scripture_ref: string;
  scripture_text: string;
  scripture_translation: string;
  full_chapter_text: string;
  observe_question: string;
  reflect_content: string;
  apply_action: string;
  apply_time_estimate: string;
  pray_text: string;
  key_verse: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  llm_base_url: string;
  llm_api_key: string | null;
  llm_model: string;
  bible_translation: string;
  default_vibe: string;
  theme: string;
  spotify_access_token: string | null;
  spotify_refresh_token: string | null;
  spotify_connected: boolean;
  spotify_playlist_praise: string | null;
  spotify_playlist_worship: string | null;
  spotify_playlist_instrumental: string | null;
  updated_at: string;
}
