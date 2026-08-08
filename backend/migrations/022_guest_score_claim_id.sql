-- Owner: Ferlyn Ng
-- Feature area: Rhythm guest-score claiming
-- Purpose: Adds an idempotency key for authenticated guest-result claims

-- Idempotency key for authenticated claims of temporary guest rhythm results.
-- Existing attempts remain unchanged because the column is nullable.
alter table game_scores
    add column if not exists claim_id uuid;

create unique index if not exists game_scores_claim_id_unique_idx
    on game_scores (claim_id)
    where claim_id is not null;
