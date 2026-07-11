-- Safe lifecycle migration. Application writes require creator ownership immediately.
-- Existing orphaned creator_id rows must be reviewed before a later NOT NULL constraint.
alter table songs add column if not exists languages jsonb not null default '[]'::jsonb;
alter table songs add column if not exists other_languages jsonb not null default '[]'::jsonb;
alter table songs add column if not exists raw_lyrics text;
alter table songs add column if not exists cover_image_url text;
alter table songs add column if not exists cover_image_public_id varchar(255);
alter table songs add column if not exists audio_public_id varchar(255);
alter table songs add column if not exists source_youtube_url text;
alter table songs add column if not exists video_public_id varchar(255);
alter table songs add column if not exists duration_secs integer;

update songs set languages = jsonb_build_array(language)
where language is not null and language <> '' and languages = '[]'::jsonb;
update songs set raw_lyrics = lyrics where raw_lyrics is null and lyrics is not null;

alter table songs drop constraint if exists songs_status_check;
alter table songs add constraint songs_status_check
    check (status in ('DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED'));

alter table generation_jobs add column if not exists started_at timestamptz;
alter table generation_jobs add column if not exists completed_at timestamptz;
alter table generation_jobs drop constraint if exists generation_jobs_status_check;
update generation_jobs set status = case status
    when 'NOT_STARTED' then 'QUEUED'
    when 'IN_PROGRESS' then 'PROCESSING'
    else status
end;
alter table generation_jobs add constraint generation_jobs_status_check
    check (status in ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'));

create index if not exists songs_creator_status_updated_at_idx
    on songs (creator_id, status, updated_at desc);
create index if not exists songs_public_published_date_idx
    on songs (published_date desc) where status = 'PUBLISHED';
