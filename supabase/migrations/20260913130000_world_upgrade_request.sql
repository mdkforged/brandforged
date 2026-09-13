alter table public.profiles
  add column if not exists world_upgrade_requested_at timestamptz,
  add column if not exists world_upgrade_note text;

create or replace function public.request_world_upgrade(note text default null)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles p
  set
    world_upgrade_requested_at = coalesce(p.world_upgrade_requested_at, now()),
    world_upgrade_note = coalesce(nullif(trim(note), ''), p.world_upgrade_note),
    updated_at = now()
  where p.id = auth.uid()
  returning * into row;

  if row.id is null then
    raise exception 'profile not found';
  end if;

  return row;
end;
$$;

revoke all on function public.request_world_upgrade(text) from public;
grant execute on function public.request_world_upgrade(text) to authenticated;

create or replace function public.grant_world_access(target_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.profiles;
begin
  if not public.is_platform_super() then
    raise exception 'only platform founder can grant Your World';
  end if;

  update public.profiles p
  set
    door_access = 'both',
    updated_at = now()
  where p.id = target_user_id
  returning * into row;

  if row.id is null then
    raise exception 'profile not found';
  end if;

  return row;
end;
$$;

revoke all on function public.grant_world_access(uuid) from public;
grant execute on function public.grant_world_access(uuid) to authenticated;