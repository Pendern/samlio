-- ============================================================
-- Mitt Sameie V5 — Initial Schema
-- Kjør dette i Supabase SQL Editor
-- ============================================================

-- ── Fase 0: Grunnmur ──────────────────────────────────────────

-- Tenants (boligselskaper)
create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_nr text,
  address text,
  city text,
  zip text,
  year_built int,
  num_units int,
  building_type text,
  logo_url text,
  primary_color text default '#8b5cf6',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Profiles (brukerprofiler, koblet til auth.users)
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  full_name text,
  phone text,
  email text,
  role text not null default 'beboer' check (role in ('styreleder', 'styremedlem', 'varamedlem', 'vaktmester', 'beboer', 'ekstern')),
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Units (boenheter)
create table public.units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  unit_number text not null,
  unit_type text,
  size_sqm numeric,
  floor int,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unit owners (kobling enhet → eier)
create table public.unit_owners (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid references public.units(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  is_primary boolean default true,
  moved_in_at date,
  moved_out_at date,
  created_at timestamptz default now()
);

-- Audit log
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- AI suggestions
create table public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  type text not null,
  context_json jsonb,
  suggestion_text text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'deferred')),
  source_refs text[],
  model_used text,
  created_at timestamptz default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id)
);

-- ── Fase 1: Styrearbeid ────────────────────────────────────────

-- Board cases (styresaker)
create table public.board_cases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  description text,
  category text,
  status text not null default 'ny' check (status in ('ny', 'under_behandling', 'vedtatt', 'avvist', 'utsatt', 'arkivert')),
  created_by uuid references public.profiles(id),
  assigned_to uuid references public.profiles(id),
  meeting_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  filename text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  case_id uuid references public.board_cases(id) on delete set null,
  labels text[],
  uploaded_by uuid references public.profiles(id),
  ai_summary text,
  created_at timestamptz default now()
);

-- Tasks (oppgaver)
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  description text,
  status text not null default 'ny' check (status in ('ny', 'pagar', 'ferdig')),
  assigned_to uuid references public.profiles(id),
  case_id uuid references public.board_cases(id) on delete set null,
  due_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Fase 2: Møter ──────────────────────────────────────────────

-- Board meetings
create table public.board_meetings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  meeting_type text not null default 'styremote' check (meeting_type in ('styremote', 'arsmote', 'ekstraordinart')),
  title text not null,
  date date not null,
  time time,
  location text,
  video_link text,
  agenda_items jsonb,
  ai_protocol_draft text,
  signed_protocol_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Fiks foreign key for board_cases.meeting_id
alter table public.board_cases
  add constraint board_cases_meeting_fk
  foreign key (meeting_id) references public.board_meetings(id) on delete set null;

-- Board decisions (vedtak)
create table public.board_decisions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  case_id uuid references public.board_cases(id) on delete cascade not null,
  meeting_id uuid references public.board_meetings(id) on delete cascade not null,
  decision_text text not null,
  result text not null check (result in ('vedtatt', 'avvist', 'utsatt')),
  votes_for int,
  votes_against int,
  votes_abstain int,
  created_at timestamptz default now()
);

-- Meeting attendance
create table public.meeting_attendance (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid references public.board_meetings(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  status text not null default 'pending' check (status in ('confirmed', 'declined', 'pending')),
  proxy_for uuid references public.profiles(id)
);

-- ── Fase 3: HMS ────────────────────────────────────────────────

-- HMS areas
create table public.hms_areas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  description text,
  area_type text not null,
  risk_level text not null default 'lav' check (risk_level in ('lav', 'middels', 'hoy', 'kritisk')),
  created_at timestamptz default now()
);

-- HMS controls (kontrollrutiner)
create table public.hms_controls (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  area_id uuid references public.hms_areas(id) on delete cascade not null,
  title text not null,
  description text,
  frequency text not null check (frequency in ('monthly', 'quarterly', 'biannual', 'annual')),
  responsible_id uuid references public.profiles(id),
  next_due_date date not null,
  last_completed_at timestamptz,
  created_at timestamptz default now()
);

-- HMS deviations (avvik)
create table public.hms_deviations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  area_id uuid references public.hms_areas(id) on delete cascade not null,
  title text not null,
  description text not null,
  severity text not null check (severity in ('lav', 'middels', 'hoy', 'kritisk')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  reported_by uuid references public.profiles(id),
  assigned_to uuid references public.profiles(id),
  due_date date,
  resolved_at timestamptz,
  images text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Fase 4: Vedlikehold ────────────────────────────────────────

create table public.maintenance_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  building_part text not null,
  description text not null,
  condition text not null default 'god' check (condition in ('god', 'akseptabel', 'darlig', 'kritisk')),
  expected_lifetime_years int,
  last_maintained_at date,
  next_maintenance_at date,
  estimated_cost numeric,
  actual_cost numeric,
  notes text,
  attachments text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── Row Level Security ─────────────────────────────────────────

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.units enable row level security;
alter table public.unit_owners enable row level security;
alter table public.audit_log enable row level security;
alter table public.ai_suggestions enable row level security;
alter table public.board_cases enable row level security;
alter table public.documents enable row level security;
alter table public.tasks enable row level security;
alter table public.board_meetings enable row level security;
alter table public.board_decisions enable row level security;
alter table public.meeting_attendance enable row level security;
alter table public.hms_areas enable row level security;
alter table public.hms_controls enable row level security;
alter table public.hms_deviations enable row level security;
alter table public.maintenance_items enable row level security;

-- RLS policies: brukere ser kun data for sin tenant
create policy "Users see own tenant" on public.tenants
  for select using (
    id in (select tenant_id from public.profiles where user_id = auth.uid())
  );

create policy "Users see own profile" on public.profiles
  for all using (user_id = auth.uid());

-- Generic tenant-isolated read policies
create policy "Tenant isolation" on public.units
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.unit_owners
  for all using (unit_id in (select id from public.units where tenant_id in (select tenant_id from public.profiles where user_id = auth.uid())));

create policy "Tenant isolation" on public.board_cases
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.documents
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.tasks
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.board_meetings
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.board_decisions
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.meeting_attendance
  for all using (meeting_id in (select id from public.board_meetings where tenant_id in (select tenant_id from public.profiles where user_id = auth.uid())));

create policy "Tenant isolation" on public.audit_log
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.ai_suggestions
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.hms_areas
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.hms_controls
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.hms_deviations
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.maintenance_items
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

-- ── Updated_at trigger ─────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.tenants for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.profiles for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.units for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.board_cases for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.tasks for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.board_meetings for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.hms_deviations for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.maintenance_items for each row execute function public.handle_updated_at();

-- ── Auto-create profile on signup ──────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Nye brukere får IKKE automatisk profil — admin må opprette manuelt
  -- Dette hindrer at tilfeldige registreringer får tilgang
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
