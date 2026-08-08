-- Owner: Ferlyn Ng
-- Feature area: OAuth authentication
-- Purpose: Stores stable Google and Apple identity links without provider tokens

-- Store stable provider subject identifiers without exposing provider tokens.

begin;

create table if not exists auth_identities (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references users(id) on delete cascade,
    provider varchar(16) not null check (provider in ('GOOGLE', 'APPLE')),
    provider_subject varchar(255) not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (provider, provider_subject),
    unique (user_id, provider)
);

create index if not exists auth_identities_user_id_idx
    on auth_identities (user_id);

commit;
