-- Owner: Needs team confirmation
-- Feature area: AI-assisted song sections and formatted lyrics
-- Purpose: Stores section recommendations and creator confirmation time

ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS section_recommendations JSONB;

ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS section_recommendations_confirmed_at TIMESTAMPTZ;
