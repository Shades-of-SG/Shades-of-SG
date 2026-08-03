-- Forward-only multi-creator role and schema alignment.
-- This migration preserves every existing row.

alter table users drop constraint if exists users_role_check;
alter table users add constraint users_role_check
    check (role in ('ADMIN', 'CREATOR', 'REGISTERED'));

alter table users add column if not exists account_status varchar(32) not null default 'ACTIVE';

-- Preserve the meaning of the legacy moderation flag where that column exists.
do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = current_schema()
          and table_name = 'users'
          and column_name = 'is_banned'
    ) then
        update users set account_status = 'SUSPENDED'
        where is_banned = true and account_status = 'ACTIVE';
    end if;
end $$;

alter table users drop constraint if exists users_account_status_check;
alter table users add constraint users_account_status_check
    check (account_status in ('ACTIVE', 'SUSPENDED'));

alter table songs add column if not exists transcription_segments jsonb;

create index if not exists generation_jobs_song_created_at_idx
    on generation_jobs (song_id, created_at desc);
create index if not exists scene_segments_song_start_time_idx
    on scene_segments (song_id, start_time);
create index if not exists generated_frames_scene_segment_order_idx
    on generated_frames (scene_segment_id, frame_order);
create index if not exists lessons_song_step_order_idx
    on lessons (song_id, step_order);
create index if not exists trivia_questions_song_created_at_idx
    on trivia_questions (song_id, created_at);
create index if not exists game_scores_song_created_at_idx
    on game_scores (song_id, created_at desc);
