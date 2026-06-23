-- ============================================================
-- Mitt Sameie V5 — Nybygg-modul
-- Reklamasjonsfrister, FDV-dokumentasjon, juridisk veiledning
-- ============================================================

-- Reklamasjoner / garantisaker
create table if not exists public.warranty_claims (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  description text,
  building_part text,
  contractor text,
  claim_type text check (claim_type in ('reklamasjon', 'garanti', 'mangel')),
  status text not null default 'active' check (status in ('active', 'submitted', 'resolved', 'expired')),
  discovered_at date,
  deadline date not null,
  legal_basis text,
  reported_by uuid references public.profiles(id),
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- FDV-dokumenter (Forvaltning, Drift, Vedlikehold)
create table if not exists public.fdv_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  title text not null,
  category text not null,
  building_part text,
  file_url text,
  file_type text,
  maintenance_interval text,
  next_maintenance_date date,
  notes text,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.warranty_claims enable row level security;
alter table public.fdv_documents enable row level security;

create policy "Tenant isolation" on public.warranty_claims
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));
create policy "Tenant isolation" on public.fdv_documents
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

create trigger set_updated_at before update on public.warranty_claims
  for each row execute function public.handle_updated_at();

-- Seed testdata
INSERT INTO public.warranty_claims (tenant_id, title, description, building_part, contractor, claim_type, status, discovered_at, deadline, legal_basis)
SELECT id, 'Reklamasjon fasade — sprekker i puss', 'Synlige sprekker i fasadepussen paa nordsiden. Oppdaget under befaring mars 2026.', 'Fasade/yttervegger', 'Veidekke Entreprenor AS', 'reklamasjon', 'active', '2026-03-15', '2026-08-01', 'Bustadsoppforingslova par 30 — 5 aars reklamasjonsfrist'
FROM public.tenants LIMIT 1;

INSERT INTO public.warranty_claims (tenant_id, title, description, building_part, contractor, claim_type, status, discovered_at, deadline, legal_basis)
SELECT id, 'Garanti tak — lekkasje ved gjennomforing', 'Fuktinntrengning ved pipe-gjennomforing i 4. etg. TakTek kontaktet.', 'Tak', 'TakTek AS', 'garanti', 'submitted', '2026-01-10', '2026-07-10', 'Bustadsoppforingslova par 30'
FROM public.tenants LIMIT 1;

INSERT INTO public.warranty_claims (tenant_id, title, description, building_part, contractor, claim_type, status, deadline, legal_basis)
SELECT id, 'Mangel balkongdorer — tetting', 'Flere beboere rapporterer trekk fra balkongdorer. Mulig feil i montering.', 'Vinduer/dorer', 'NorDoor AS', 'mangel', 'active', '2027-08-01', 'Bustadsoppforingslova par 30 — absolutt frist 5 aar'
FROM public.tenants LIMIT 1;

INSERT INTO public.warranty_claims (tenant_id, title, description, building_part, contractor, claim_type, status, deadline, legal_basis, resolved_at, resolution_notes)
SELECT id, 'Reklamasjon heis — stopp mellom etasjer', 'Heisen stoppet mellom 2. og 3. etasje to ganger i januar.', 'Heis', 'KONE AS', 'reklamasjon', 'resolved', '2026-12-31', 'Bustadsoppforingslova par 30', now(), 'Utbedret av KONE 15. februar. Ny styreenhet installert.'
FROM public.tenants LIMIT 1;

INSERT INTO public.fdv_documents (tenant_id, title, category, building_part, maintenance_interval, next_maintenance_date, notes)
SELECT id, 'Brukermanual ventilasjonsanlegg', 'Ventilasjon', 'VVS', 'Filterbytte hver 6. mnd', '2026-09-01', 'Flexit aggregat modell CS60. Filter type F7.'
FROM public.tenants LIMIT 1;

INSERT INTO public.fdv_documents (tenant_id, title, category, building_part, maintenance_interval, next_maintenance_date, notes)
SELECT id, 'Takrenner og nedlop — vedlikeholdsanvisning', 'Tak', 'Takrenner', 'Rensing aarlig', '2026-06-15', 'Aluminium takrenner. Rens for blader og mose for vinter.'
FROM public.tenants LIMIT 1;

INSERT INTO public.fdv_documents (tenant_id, title, category, building_part, maintenance_interval, next_maintenance_date, notes)
SELECT id, 'Fasade — vedlikeholdsplan', 'Fasade', 'Yttervegger', 'Inspeksjon hvert 5. aar', '2029-08-01', 'Pusset fasade. Sjekk for sprekker, fukt og avflassing.'
FROM public.tenants LIMIT 1;

INSERT INTO public.fdv_documents (tenant_id, title, category, building_part, maintenance_interval, notes)
SELECT id, 'Brannsikringsdokumentasjon', 'Brann', 'Fellesareal', 'Kontroll aarlig', 'Brannalarmsystem Autronica BS-310. Sentralapparat i teknisk rom.'
FROM public.tenants LIMIT 1;

INSERT INTO public.fdv_documents (tenant_id, title, category, building_part, maintenance_interval, next_maintenance_date, notes)
SELECT id, 'Heisdokumentasjon KONE', 'Heis', 'Heis', 'Service kvartalsvis', '2026-09-15', 'KONE MonoSpace 500. Serviceavtale med KONE AS.'
FROM public.tenants LIMIT 1;
