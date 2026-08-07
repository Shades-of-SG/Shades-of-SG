ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS section_recommendations JSONB;

ALTER TABLE songs
  ADD COLUMN IF NOT EXISTS section_recommendations_confirmed_at TIMESTAMPTZ;
