-- Owner: Shermaine
-- Feature area: Badges, login streaks, and instrument challenges
-- Purpose: Adds streak fields, unique badge awards, and challenge progress

-- Login-streak tracking, race-safe badge awarding, and instrument-challenge progress.

alter table users add column if not exists last_active_date date;
alter table users add column if not exists current_login_streak integer not null default 0;
alter table users add column if not exists longest_login_streak integer not null default 0;

drop index if exists badges_user_id_name_idx;
create unique index badges_user_id_name_idx on badges (user_id, name);

create table if not exists instrument_challenge_progress (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    challenge_id varchar(64) not null,
    completed_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create unique index if not exists instrument_challenge_progress_user_challenge_idx
    on instrument_challenge_progress (user_id, challenge_id);
