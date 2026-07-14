-- Repair databases created from the early rhythm-beatmap schema.
-- The application model reads this column for every summary request.
alter table rhythm_beatmaps
    add column if not exists published_at timestamptz;
