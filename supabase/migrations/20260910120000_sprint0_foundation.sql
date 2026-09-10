-- Sprint 0 foundation: profiles, workspaces, memberships, audit_events + RLS
-- No tenant/workspace seed data.

create extension if not exists "pgcrypto";

-- Profiles mirror auth.users (1:1).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  status text not null default 'active'
    check (status in ('active', 'invited', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_memberships_user_id_idx
  on public.workspace_memberships (user_id);

create index if not exists workspace_memberships_workspace_id_idx
  on public.workspace_memberships (workspace_id);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  correlation_id text,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_workspace_id_idx
  on public.audit_events (workspace_id);

create index if not exists audit_events_created_at_idx
  on public.audit_events (created_at desc);

-- Helper: is the current user an active member of the workspace?
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_memberships m
    where m.workspace_id = target_workspace_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_memberships enable row level security;
alter table public.audit_events enable row level security;

-- Profiles: users can read/update their own row.
create policy profiles_select_own
  on public.profiles for select
  using (id = auth.uid());

create policy profiles_update_own
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Workspaces: members can select workspaces they belong to.
create policy workspaces_select_member
  on public.workspaces for select
  using (public.is_workspace_member(id));

-- Memberships: members can see memberships in their workspaces.
create policy memberships_select_member
  on public.workspace_memberships for select
  using (public.is_workspace_member(workspace_id));

-- Audit events: members can read events for their workspaces.
create policy audit_events_select_member
  on public.audit_events for select
  using (
    workspace_id is not null
    and public.is_workspace_member(workspace_id)
  );

-- Inserts/updates for workspaces/memberships/audit are expected via
-- service role or future privileged RPCs; no broad insert policies here.
