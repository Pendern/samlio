-- ============================================================
-- Mitt Sameie V5 — Generalforsamling / Årsmøte
-- ============================================================

-- Generalforsamlinger
create table if not exists public.assemblies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  date date not null,
  time time,
  location text,
  status text not null default 'draft' check (status in ('draft', 'notice_sent', 'open', 'voting', 'closed')),
  notice_deadline date,
  digital_enabled boolean default true,
  created_by uuid references public.profiles(id),
  annual_report_draft text,
  protocol_draft text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Saksliste for generalforsamling
create table if not exists public.assembly_items (
  id uuid primary key default gen_random_uuid(),
  assembly_id uuid references public.assemblies(id) on delete cascade not null,
  item_number int not null,
  title text not null,
  description text,
  item_type text not null default 'sak' check (item_type in ('sak', 'valg', 'orientering', 'vedtektsendring')),
  proposed_by text default 'Styret',
  requires_vote boolean default true,
  created_at timestamptz default now()
);

-- Stemmer
create table if not exists public.assembly_votes (
  id uuid primary key default gen_random_uuid(),
  assembly_item_id uuid references public.assembly_items(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  vote text not null check (vote in ('for', 'against', 'abstain')),
  voted_at timestamptz default now(),
  unique(assembly_item_id, profile_id)
);

-- Innmeldte saker fra beboere
create table if not exists public.assembly_motions (
  id uuid primary key default gen_random_uuid(),
  assembly_id uuid references public.assemblies(id) on delete cascade not null,
  submitted_by uuid references public.profiles(id) not null,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now()
);

-- Oppmøte/fullmakter for generalforsamling
create table if not exists public.assembly_attendance (
  id uuid primary key default gen_random_uuid(),
  assembly_id uuid references public.assemblies(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  attended boolean default false,
  proxy_for text,
  vote_weight numeric default 1,
  registered_at timestamptz default now(),
  unique(assembly_id, profile_id)
);

alter table public.assemblies enable row level security;
alter table public.assembly_items enable row level security;
alter table public.assembly_votes enable row level security;
alter table public.assembly_motions enable row level security;
alter table public.assembly_attendance enable row level security;

create policy "Tenant isolation" on public.assemblies
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));
create policy "Tenant isolation" on public.assembly_items
  for all using (assembly_id in (select id from public.assemblies where tenant_id in (select tenant_id from public.profiles where user_id = auth.uid())));
create policy "Tenant isolation" on public.assembly_votes
  for all using (assembly_item_id in (select id from public.assembly_items where assembly_id in (select id from public.assemblies where tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()))));
create policy "Tenant isolation" on public.assembly_motions
  for all using (assembly_id in (select id from public.assemblies where tenant_id in (select tenant_id from public.profiles where user_id = auth.uid())));
create policy "Tenant isolation" on public.assembly_attendance
  for all using (assembly_id in (select id from public.assemblies where tenant_id in (select tenant_id from public.profiles where user_id = auth.uid())));

create trigger set_updated_at before update on public.assemblies
  for each row execute function public.handle_updated_at();
