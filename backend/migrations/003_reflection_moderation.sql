alter table reflections
    add column if not exists tags jsonb not null default '[]'::jsonb;

alter table reflections
    add column if not exists moderated_by uuid;

alter table reflections
    add column if not exists moderated_at timestamptz;

alter table reflections
    add column if not exists moderator_note text;

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'reflections_moderated_by_fkey'
    ) then
        alter table reflections
            add constraint reflections_moderated_by_fkey
            foreign key (moderated_by) references users(id) on delete set null;
    end if;
end $$;

create index if not exists reflections_status_created_at_idx
    on reflections (status, created_at desc);
