alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

-- Prefer RPC so clients can mark done without relying on column-level update quirks.
create or replace function public.mark_onboarding_completed()
returns public.profiles
language plpgsql
security definer
set search_path = public
as 
declare
  row public.profiles;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  update public.profiles p
  set
    onboarding_completed_at = coalesce(p.onboarding_completed_at, now()),
    updated_at = now()
  where p.id = auth.uid()
  returning * into row;

  if row.id is null then
    raise exception 'profile not found';
  end if;

  return row;
end;
;

revoke all on function public.mark_onboarding_completed() from public;
grant execute on function public.mark_onboarding_completed() to authenticated;
