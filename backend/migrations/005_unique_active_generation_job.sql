-- Owner: Shared - Ferlyn Ng and Htet Aung
-- Feature area: AI generation concurrency
-- Purpose: Prevents more than one active generation job per song

-- Prevent concurrent requests from creating more than one active job per song.
create unique index if not exists generation_jobs_one_active_per_song_idx
    on generation_jobs (song_id)
    where status in ('QUEUED', 'PROCESSING');
