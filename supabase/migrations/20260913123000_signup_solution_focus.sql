-- After account_kind: branding vs all-in-one business solution
create type public.solution_focus as enum ('branding', 'all_in_one');

alter table public.profiles
  add column if not exists solution_focus public.solution_focus not null default 'branding';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kind public.account_kind := 'individual';
  focus public.solution_focus := 'branding';
begin
  if (new.raw_user_meta_data->>'account_kind') = 'business' then
    kind := 'business';
  elsif (new.raw_user_meta_data->>'account_kind') = 'individual' then
    kind := 'individual';
  end if;

  if (new.raw_user_meta_data->>'solution_focus') = 'all_in_one' then
    focus := 'all_in_one';
  elsif (new.raw_user_meta_data->>'solution_focus') = 'branding' then
    focus := 'branding';
  else
    if kind = 'business' then
      focus := 'all_in_one';
    else
      focus := 'branding';
    end if;
  end if;

  insert into public.profiles (id, display_name, account_kind, door_access, solution_focus)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    kind,
    'you',
    focus
  )
  on conflict (id) do nothing;

  return new;
end;
$$;