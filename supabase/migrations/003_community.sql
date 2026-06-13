-- ============================================================
-- Mitt Sameie V5 — Fellesskap + Kommunikasjon
-- Kjør dette i Supabase SQL Editor
-- ============================================================

-- Grupper
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  description text,
  is_private boolean default false,
  is_official boolean default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Gruppemedlemskap
create table public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(group_id, profile_id)
);

-- Innlegg (veggen + gruppeinnlegg + oppslag)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade,
  author_id uuid references public.profiles(id) not null,
  type text not null default 'post' check (type in ('post', 'announcement', 'event')),
  title text,
  body text not null,
  image_url text,
  is_pinned boolean default false,
  comments_locked boolean default false,
  event_date timestamptz,
  event_location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Kommentarer
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) not null,
  body text not null,
  created_at timestamptz default now()
);

-- Reaksjoner
create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  type text not null default 'like' check (type in ('like', 'heart')),
  created_at timestamptz default now(),
  unique(post_id, profile_id)
);

-- Arrangementspåmelding
create table public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade not null,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('attending', 'not_attending')),
  created_at timestamptz default now(),
  unique(post_id, profile_id)
);

-- RLS
alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.event_rsvps enable row level security;

create policy "Tenant isolation" on public.groups
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.group_memberships
  for all using (group_id in (select id from public.groups where tenant_id in (select tenant_id from public.profiles where user_id = auth.uid())));

create policy "Tenant isolation" on public.posts
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create policy "Tenant isolation" on public.comments
  for all using (post_id in (select id from public.posts where tenant_id in (select tenant_id from public.profiles where user_id = auth.uid())));

create policy "Tenant isolation" on public.reactions
  for all using (post_id in (select id from public.posts where tenant_id in (select tenant_id from public.profiles where user_id = auth.uid())));

create policy "Tenant isolation" on public.event_rsvps
  for all using (post_id in (select id from public.posts where tenant_id in (select tenant_id from public.profiles where user_id = auth.uid())));

-- Triggers
create trigger set_updated_at before update on public.posts for each row execute function public.handle_updated_at();

-- ── Seed testdata ──────────────────────────────────────────────

do $$
declare
  v_tenant_id uuid;
  v_profile_id uuid;
  v_profile2_id uuid;
  v_group_hage uuid;
  v_group_dugnad uuid;
  v_post1 uuid;
  v_post2 uuid;
  v_post3 uuid;
begin
  select id into v_tenant_id from public.tenants limit 1;
  select id into v_profile_id from public.profiles where role = 'styreleder' and tenant_id = v_tenant_id limit 1;
  select id into v_profile2_id from public.profiles where role = 'styremedlem' and tenant_id = v_tenant_id limit 1;

  -- Grupper
  insert into public.groups (tenant_id, name, description, is_official, created_by)
  values (v_tenant_id, 'Hagegruppen', 'For alle som er interessert i å stelle fellesområdene', false, v_profile_id)
  returning id into v_group_hage;

  insert into public.groups (tenant_id, name, description, is_official, created_by)
  values (v_tenant_id, 'Dugnad', 'Planlegging og koordinering av dugnad', true, v_profile_id)
  returning id into v_group_dugnad;

  -- Medlemskap
  insert into public.group_memberships (group_id, profile_id) values
    (v_group_hage, v_profile_id),
    (v_group_hage, v_profile2_id),
    (v_group_dugnad, v_profile_id),
    (v_group_dugnad, v_profile2_id);

  -- Innlegg på veggen
  insert into public.posts (tenant_id, author_id, type, title, body, is_pinned)
  values (v_tenant_id, v_profile_id, 'announcement', 'Brannalarm forrige uke', 'Brannalarmen som gikk torsdag kveld var en falsk alarm. Feilen er identifisert og utbedret av servicetekniker fredag. Beklager ulempen!', true)
  returning id into v_post1;

  insert into public.posts (tenant_id, author_id, type, body)
  values (v_tenant_id, v_profile2_id, 'post', 'Har plantene i fellesarealet blitt vannet denne uka? De ser litt triste ut 🌱')
  returning id into v_post2;

  insert into public.posts (tenant_id, author_id, type, title, body, event_date, event_location)
  values (v_tenant_id, v_profile_id, 'event', 'Sommerdugnad 2026', 'Tid for årets sommerdugnad! Vi vasker fasaden, rydder boder og griller etterpå. Ta med godt humør! 🧹🌞', (current_date + 14)::timestamptz, 'Fellesområdet')
  returning id into v_post3;

  -- Kommentarer
  insert into public.comments (post_id, author_id, body) values
    (v_post2, v_profile_id, 'Bra du sier fra! Jeg kan ta en runde i morgen.'),
    (v_post3, v_profile2_id, 'Flott! Jeg stiller med grillen 🔥');

  -- Reaksjoner
  insert into public.reactions (post_id, profile_id, type) values
    (v_post1, v_profile2_id, 'like'),
    (v_post2, v_profile_id, 'heart'),
    (v_post3, v_profile_id, 'like'),
    (v_post3, v_profile2_id, 'like');

  -- RSVP for arrangement
  insert into public.event_rsvps (post_id, profile_id, status) values
    (v_post3, v_profile_id, 'attending'),
    (v_post3, v_profile2_id, 'attending');

end $$;
