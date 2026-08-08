-- Owner: Shermaine
-- Feature area: Instrument Discovery Lab
-- Purpose: Adds playable sample maps and source attribution metadata

-- Real audio samples for the Instrument Discovery Lab.
-- Reuses the existing (until now unused-for-this-purpose) instruments table:
-- `slug` gives lab instruments (piano, angklung, kompang, erhu, tabla) a stable
-- lookup key distinct from the auto-generated uuid `id`, and `samples` maps a
-- note label to either a Cloudinary URL (direct recording) or
-- { url, playbackRate } (a recording borrowed from another note and pitch-shifted).
-- The existing singular `audio_url` column is unrelated legacy data and is left alone.

alter table instruments add column if not exists slug varchar(64);
alter table instruments add column if not exists samples jsonb not null default '{}'::jsonb;
alter table instruments add column if not exists sample_format varchar(16) not null default 'mp3';
alter table instruments add column if not exists sample_license varchar(255);
alter table instruments add column if not exists sample_attribution text;

create unique index if not exists instruments_slug_unique_idx
    on instruments (slug) where slug is not null;
