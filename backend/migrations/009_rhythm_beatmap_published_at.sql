-- Owner: Shared - Ferlyn Ng and Htet Aung
-- Feature area: Rhythm beatmap publishing
-- Purpose: Repairs early beatmap schemas with a publication timestamp

-- Repair databases created from the early rhythm-beatmap schema.
-- The application model reads this column for every summary request.
alter table rhythm_beatmaps
    add column if not exists published_at timestamptz;
