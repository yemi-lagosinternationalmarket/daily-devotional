CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE input_type AS ENUM ('topic', 'mood', 'combined', 'free_text', 'blessed');
CREATE TYPE journal_step AS ENUM ('observe', 'apply');
CREATE TYPE vibe_type AS ENUM ('praise', 'worship', 'instrumental');

CREATE TABLE devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  topic TEXT,
  mood TEXT,
  free_text TEXT,
  input_type input_type NOT NULL,
  scripture_ref TEXT NOT NULL,
  scripture_text TEXT NOT NULL,
  scripture_translation TEXT NOT NULL DEFAULT 'NIV',
  full_chapter_text TEXT,
  observe_question TEXT NOT NULL,
  reflect_content TEXT NOT NULL,
  apply_action TEXT NOT NULL,
  apply_time_estimate TEXT NOT NULL DEFAULT '~5 minutes',
  pray_text TEXT NOT NULL,
  key_verse TEXT NOT NULL,
  is_want_more BOOLEAN NOT NULL DEFAULT false,
  parent_devotional_id UUID REFERENCES devotionals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  devotional_id UUID NOT NULL REFERENCES devotionals(id) ON DELETE CASCADE,
  step journal_step NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE worship_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  spotify_connected BOOLEAN NOT NULL DEFAULT false,
  spotify_refresh_token TEXT,
  default_vibe vibe_type NOT NULL DEFAULT 'worship',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devotionals_date ON devotionals(date DESC);
CREATE INDEX idx_journal_devotional ON journal_entries(devotional_id);
