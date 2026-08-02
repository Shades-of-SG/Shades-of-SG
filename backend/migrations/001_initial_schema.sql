create extension if not exists "pgcrypto";

create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    role varchar(32) not null default 'REGISTERED' check (role in ('CREATOR', 'REGISTERED')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    guest_id varchar(255),
    expires_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists songs (
    id uuid primary key default gen_random_uuid(),
    creator_id uuid not null references users(id) on delete restrict,
    title varchar(255) not null,
    artist varchar(255),
    theme varchar(255),
    language varchar(255),
    mood_tags jsonb not null default '[]',
    lyrics text,
    description text,
    audio_url text,
    video_url text,
    status varchar(32) not null default 'DRAFT' check (status in ('DRAFT', 'PUBLISHED')),
    published_date timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists instruments (
    id uuid primary key default gen_random_uuid(),
    name varchar(255) not null,
    origin varchar(255),
    description text,
    image_url text,
    audio_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists song_instruments (
    song_id uuid not null references songs(id) on delete cascade,
    instrument_id uuid not null references instruments(id) on delete cascade,
    role varchar(255),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (song_id, instrument_id)
);

create table if not exists lessons (
    id uuid primary key default gen_random_uuid(),
    song_id uuid not null references songs(id) on delete cascade,
    title varchar(255) not null,
    content text not null,
    step_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists game_scores (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete set null,
    song_id uuid not null references songs(id) on delete cascade,
    score integer not null default 0,
    accuracy double precision,
    max_combo integer not null default 0,
    rank varchar(8) not null default 'C' check (rank in ('S', 'A', 'B', 'C')),
    difficulty varchar(32) not null default 'EASY' check (difficulty in ('EASY', 'MEDIUM', 'HARD')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists reflections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete set null,
    song_id uuid not null references songs(id) on delete cascade,
    display_name varchar(255),
    display_mode varchar(32) not null default 'ANONYMOUS' check (display_mode in ('PROFILE', 'ANONYMOUS')),
    guest_submission boolean not null default false,
    content text not null,
    tags jsonb not null default '[]'::jsonb,
    status varchar(32) not null default 'PENDING' check (status in ('PENDING', 'APPROVED', 'FLAGGED', 'REJECTED')),
    moderated_by uuid references users(id) on delete set null,
    moderated_at timestamptz,
    moderator_note text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists reflections_status_created_at_idx
    on reflections (status, created_at desc);

create table if not exists badges (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    name varchar(255) not null,
    description text,
    earned_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists trivia_questions (
    id uuid primary key default gen_random_uuid(),
    song_id uuid not null references songs(id) on delete cascade,
    prompt text not null,
    type varchar(32) not null default 'MULTIPLE_CHOICE' check (type in ('MULTIPLE_CHOICE', 'TRUE_FALSE')),
    options jsonb not null default '[]',
    correct_answer varchar(255) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists trivia_attempts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete set null,
    question_id uuid not null references trivia_questions(id) on delete cascade,
    selected_answer varchar(255) not null,
    is_correct boolean not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists generation_jobs (
    id uuid primary key default gen_random_uuid(),
    song_id uuid not null references songs(id) on delete cascade,
    status varchar(32) not null default 'NOT_STARTED' check (status in ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
    error_message text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists scene_segments (
    id uuid primary key default gen_random_uuid(),
    song_id uuid not null references songs(id) on delete cascade,
    start_time double precision not null,
    end_time double precision not null,
    lyrics text,
    emotion varchar(255),
    visual_prompt text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists generated_frames (
    id uuid primary key default gen_random_uuid(),
    scene_segment_id uuid not null references scene_segments(id) on delete cascade,
    prompt_hash varchar(255),
    cloudinary_id varchar(255),
    image_url text not null,
    frame_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);
