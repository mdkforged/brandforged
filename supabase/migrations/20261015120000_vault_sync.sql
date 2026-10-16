-- Account-synced Vault: private bucket + index table, each user sees only their own stills.

create table if not exists public.vault_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  path text not null,
  content_hash text not null,
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  constraint vault_items_path_in_own_folder check (path like user_id::text || '/%'),
  constraint vault_items_user_hash_unique unique (user_id, content_hash)
);

create index if not exists vault_items_user_created_idx
  on public.vault_items (user_id, created_at desc);

alter table public.vault_items enable row level security;

grant select, insert, delete on public.vault_items to authenticated;

drop policy if exists "vault_items select own" on public.vault_items;
create policy "vault_items select own" on public.vault_items
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "vault_items insert own" on public.vault_items;
create policy "vault_items insert own" on public.vault_items
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "vault_items delete own" on public.vault_items;
create policy "vault_items delete own" on public.vault_items
  for delete to authenticated using (user_id = (select auth.uid()));

-- Cap: 12 stills per account (serialised per user so two devices can't overshoot).
create or replace function public.vault_items_enforce_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext('vault_items:' || new.user_id::text));
  if (select count(*) from public.vault_items where user_id = new.user_id) >= 12 then
    raise exception 'vault_full' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.vault_items_enforce_cap() from public, anon, authenticated;

drop trigger if exists vault_items_cap on public.vault_items;
create trigger vault_items_cap
  before insert on public.vault_items
  for each row execute function public.vault_items_enforce_cap();

-- Private bucket; objects live under {user_id}/...
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vault', 'vault', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vault objects select own" on storage.objects;
create policy "vault objects select own" on storage.objects
  for select to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "vault objects insert own" on storage.objects;
create policy "vault objects insert own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "vault objects delete own" on storage.objects;
create policy "vault objects delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'vault' and (storage.foldername(name))[1] = (select auth.uid())::text);
