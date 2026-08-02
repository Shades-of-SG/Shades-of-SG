-- Align legacy score tables with the existing GameScore model.
-- Additive and backfilled so existing score history remains intact.
alter table game_scores
    add column if not exists max_combo integer not null default 0;

alter table game_scores
    add column if not exists rank varchar(8) not null default 'C';

alter table game_scores drop constraint if exists game_scores_rank_check;
alter table game_scores add constraint game_scores_rank_check
    check (rank in ('S', 'A', 'B', 'C'));

create index if not exists game_scores_user_created_at_idx
    on game_scores (user_id, created_at desc);
