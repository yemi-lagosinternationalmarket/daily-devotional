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
