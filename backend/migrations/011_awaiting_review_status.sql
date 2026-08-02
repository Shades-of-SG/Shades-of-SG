-- Add AWAITING_REVIEW to generation_jobs status enum.
-- Also update the unique active-job index to include AWAITING_REVIEW.

alter table generation_jobs drop constraint if exists generation_jobs_status_check;
alter table generation_jobs add constraint generation_jobs_status_check
    check (status in ('QUEUED', 'PROCESSING', 'AWAITING_REVIEW', 'COMPLETED', 'FAILED'));

-- Recreate the unique active-job index to also prevent a new job while one is awaiting review.
drop index if exists generation_jobs_one_active_per_song_idx;
create unique index generation_jobs_one_active_per_song_idx
    on generation_jobs (song_id)
    where status in ('QUEUED', 'PROCESSING', 'AWAITING_REVIEW');
