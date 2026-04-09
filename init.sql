CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE input_type AS ENUM ('topic', 'mood', 'combined', 'free_text', 'blessed');
CREATE TYPE journal_step AS ENUM ('observe', 'apply');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  llm_base_url TEXT DEFAULT 'https://api.openai.com/v1',
  llm_api_key TEXT,
  llm_model TEXT DEFAULT 'gpt-4o',
  bible_translation TEXT DEFAULT 'ESV',
  default_vibe TEXT DEFAULT 'worship',
  theme TEXT DEFAULT 'dark',
  spotify_access_token TEXT,
  spotify_refresh_token TEXT,
  spotify_connected BOOLEAN DEFAULT false,
  spotify_playlist_praise TEXT,
  spotify_playlist_worship TEXT,
  spotify_playlist_instrumental TEXT,
  persona JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE devotionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  devotional_id UUID NOT NULL REFERENCES devotionals(id) ON DELETE CASCADE,
  step journal_step NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_devotionals_user_date ON devotionals(user_id, date DESC);
CREATE INDEX idx_journal_user ON journal_entries(user_id);
CREATE INDEX idx_journal_devotional ON journal_entries(devotional_id);
