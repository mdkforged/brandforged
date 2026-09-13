create or replace function public.protect_door_access()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
     and new.door_access is distinct from old.door_access then
    if auth.uid() is null then
      return new;
    end if;
    if not public.is_platform_super() then
      raise exception 'door_access can only be changed by a platform founder';
    end if;
  end if;
  return new;
end;
$$;