-- DR-2026-09-13-008: signup account kind + door access
-- Everyone starts with This is You only; Your World is an upgrade.
-- At signup we record individual vs business.

create type public.account_kind as enum ('individual', 'business');
create type public.door_access as enum ('you', 'both');

alter table public.profiles
  add column if not exists account_kind public.account_kind not null default 'individual',
  add column if not exists door_access public.door_access not null default 'you';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kind public.account_kind := 'individual';
begin
  if (new.raw_user_meta_data->>'account_kind') = 'business' then
    kind := 'business';
  elsif (new.raw_user_meta_data->>'account_kind') = 'individual' then
    kind := 'individual';
  end if;

  insert into public.profiles (id, display_name, account_kind, door_access)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    kind,
    'you'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.protect_door_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.door_access is distinct from old.door_access
     and not public.is_platform_super() then
    raise exception 'door_access can only be changed by a platform founder';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_door_access on public.profiles;
create trigger profiles_protect_door_access
  before update on public.profiles
  for each row
  execute function public.protect_door_access();