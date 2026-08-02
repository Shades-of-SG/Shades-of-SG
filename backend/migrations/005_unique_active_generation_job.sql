-- Prevent concurrent requests from creating more than one active job per song.
create unique index if not exists generation_jobs_one_active_per_song_idx
    on generation_jobs (song_id)
    where status in ('QUEUED', 'PROCESSING');
