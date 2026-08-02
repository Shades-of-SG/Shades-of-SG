CREATE TABLE IF NOT EXISTS rhythm_beatmaps (
  beatmap_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  difficulty VARCHAR(16) NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
  version INTEGER NOT NULL DEFAULT 1,
  bpm DECIMAL(7,2),
  offset_ms INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL,
  notes JSONB NOT NULL,
  generation_source VARCHAR(16) NOT NULL CHECK (generation_source IN ('AI', 'FALLBACK', 'MANUAL')),
  status VARCHAR(16) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'FAILED')),
  error_message TEXT,
  generated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rhythm_beatmaps_song_difficulty_version_key UNIQUE (song_id, difficulty, version)
);

CREATE INDEX IF NOT EXISTS rhythm_beatmaps_ready_lookup
  ON rhythm_beatmaps (song_id, difficulty, status);

CREATE UNIQUE INDEX IF NOT EXISTS rhythm_beatmaps_one_draft
  ON rhythm_beatmaps (song_id, difficulty) WHERE status = 'DRAFT';

CREATE UNIQUE INDEX IF NOT EXISTS rhythm_beatmaps_one_published
  ON rhythm_beatmaps (song_id, difficulty) WHERE status = 'PUBLISHED';
