-- Owner: Ferlyn Ng
-- Feature area: Account and creator-mode access
-- Purpose: Separates creator-tool suspension from whole-account suspension

-- Separate creator-tool access from whole-account access without deleting or
-- rewriting creator-owned content. Existing users default to active creator
-- access, and legacy creator-only suspensions are migrated when audit history
-- shows that no unresolved full-account suspension exists.

begin;

alter table users add column if not exists creator_access_status varchar(32) not null default 'ACTIVE';
alter table users add column if not exists creator_suspension_reason text;
alter table users add column if not exists account_suspension_reason text;

alter table users drop constraint if exists users_creator_access_status_check;
alter table users add constraint users_creator_access_status_check
    check (creator_access_status in ('ACTIVE', 'SUSPENDED'));

-- Before this migration, Admin -> Creators used account_status for creator-tool
-- suspensions and wrote CREATOR_SUSPENDED audit events. Move only those cases.
-- An unresolved USER_SUSPENDED/ACCOUNT_SUSPENDED event means the whole-account
-- suspension was intentional and must remain in place.
update users as creator
set creator_access_status = 'SUSPENDED',
    creator_suspension_reason = coalesce(
        creator_suspension_reason,
        'Creator access was suspended before access states were separated. Contact Shades of SG support for details or to appeal.'
    ),
    account_status = 'ACTIVE'
where creator.role = 'CREATOR'
  and creator.account_status = 'SUSPENDED'
  and exists (
      select 1 from audit_logs creator_action
      where creator_action.creator_id = creator.id
        and creator_action.action = 'CREATOR_SUSPENDED'
        and not exists (
            select 1 from audit_logs creator_restore
            where creator_restore.creator_id = creator.id
              and creator_restore.action in ('CREATOR_ACTIVE', 'CREATOR_RESTORED')
              and creator_restore.created_at > creator_action.created_at
        )
  )
  and not exists (
      select 1 from audit_logs account_action
      where account_action.entity_id = creator.id
        and account_action.action in ('USER_SUSPENDED', 'ACCOUNT_SUSPENDED')
        and not exists (
            select 1 from audit_logs account_restore
            where account_restore.entity_id = creator.id
              and account_restore.action in ('USER_ACTIVE', 'ACCOUNT_RESTORED')
              and account_restore.created_at > account_action.created_at
        )
  );

update users
set account_suspension_reason = coalesce(
    account_suspension_reason,
    'This account was suspended before suspension reasons were recorded. Contact Shades of SG support for details or to appeal.'
)
where account_status = 'SUSPENDED';

create index if not exists users_creator_access_status_idx
    on users (creator_access_status)
    where role = 'CREATOR';

commit;
