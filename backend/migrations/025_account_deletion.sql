-- Adds a soft-delete account status. Deleting an account never removes rows;
-- it marks the user row as deleted, which blocks login/API access the same
-- way a suspension does, and stops the profile resolving publicly.

begin;

alter table users add column if not exists deleted_at timestamptz;

alter table users drop constraint if exists users_account_status_check;
alter table users add constraint users_account_status_check
    check (account_status in ('ACTIVE', 'SUSPENDED', 'DELETED'));

commit;
