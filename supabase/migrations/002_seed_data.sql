-- ============================================================
-- Mitt Sameie V5 — Seed Data
-- Kjør dette ETTER 001_initial_schema.sql
-- OG ETTER at testbruker er opprettet i Supabase Auth
-- ============================================================

-- STEG 1: Erstatt denne UUID-en med den faktiske user_id fra Supabase Auth
-- Du finner den under Authentication → Users i Supabase Dashboard
-- ────────────────────────────────────────────────────────────────
-- VIKTIG: Etter du har opprettet testbrukeren, kopier user-ID-en
-- og erstatt '00000000-0000-0000-0000-000000000000' nedenfor
-- ────────────────────────────────────────────────────────────────

do $$
declare
  v_user_id uuid;
  v_tenant_id uuid;
  v_profile_id uuid;
  v_profile2_id uuid;
  v_unit1_id uuid;
  v_unit2_id uuid;
  v_area_brann uuid;
  v_area_lekeplass uuid;
  v_area_el uuid;
  v_case1_id uuid;
  v_case2_id uuid;
  v_case3_id uuid;
  v_meeting_id uuid;
begin
  -- Finn testbrukeren (siste opprettede bruker)
  select id into v_user_id from auth.users order by created_at desc limit 1;

  if v_user_id is null then
    raise exception 'Ingen bruker funnet i auth.users. Opprett testbruker først!';
  end if;

  -- Opprett tenant (boligselskap)
  insert into public.tenants (name, org_nr, address, city, zip, year_built, num_units, building_type)
  values ('Bryggepromenaden 1 Moss Boligsameie', '923456789', 'Bryggepromenaden 1', 'Moss', '1530', 2019, 24, 'Leilighetsbygg')
  returning id into v_tenant_id;

  -- Opprett profil for testbruker (styreleder)
  insert into public.profiles (user_id, tenant_id, full_name, phone, email, role)
  values (v_user_id, v_tenant_id, 'Andreas Waag Martinsen', '+47 900 00 000', 'andreas@test.no', 'styreleder')
  returning id into v_profile_id;

  -- Opprett et styremedlem (fiktiv, uten auth-bruker — bare for visning)
  insert into public.profiles (user_id, tenant_id, full_name, phone, email, role)
  values (v_user_id, v_tenant_id, 'Kari Nordmann', '+47 911 11 111', 'kari@test.no', 'styremedlem')
  returning id into v_profile2_id;

  -- Boenheter
  insert into public.units (tenant_id, unit_number, unit_type, size_sqm, floor)
  values (v_tenant_id, 'H0101', 'Leilighet', 75, 1)
  returning id into v_unit1_id;

  insert into public.units (tenant_id, unit_number, unit_type, size_sqm, floor)
  values (v_tenant_id, 'H0201', 'Leilighet', 92, 2)
  returning id into v_unit2_id;

  -- Koble eier til boenhet
  insert into public.unit_owners (unit_id, profile_id, is_primary, moved_in_at)
  values (v_unit1_id, v_profile_id, true, '2019-08-01');

  -- ── Styresaker ───────────────────────────────────────────────

  insert into public.board_cases (tenant_id, title, description, category, status, created_by)
  values (v_tenant_id, 'Reklamasjon tak — lekkasje', 'Lekkasje oppdaget i 4. etasje. TakTek AS kontaktet men har ikke svart.', 'Vedlikehold', 'under_behandling', v_profile_id)
  returning id into v_case1_id;

  insert into public.board_cases (tenant_id, title, description, category, status, created_by)
  values (v_tenant_id, 'Parkeringsregler — gjesteparkering', 'Flere beboere klager på manglende gjesteparkering. Forslag om å innføre gjesteparkeringsskilt.', 'Drift', 'ny', v_profile_id)
  returning id into v_case2_id;

  insert into public.board_cases (tenant_id, title, description, category, status, created_by)
  values (v_tenant_id, 'Budsjett 2027 — forberedelser', 'Budsjettet for 2027 må forberedes innen september. Vedlikeholdsplanen viser store tiltak.', 'Økonomi', 'ny', v_profile_id)
  returning id into v_case3_id;

  -- ── Oppgaver ─────────────────────────────────────────────────

  insert into public.tasks (tenant_id, title, description, status, assigned_to, case_id, due_date, created_by)
  values
    (v_tenant_id, 'Purre TakTek AS', 'Send ny henvendelse til TakTek om status reklamasjon', 'ny', v_profile_id, v_case1_id, current_date + 3, v_profile_id),
    (v_tenant_id, 'Innhent tilbud gjesteparkering-skilt', 'Kontakt leverandør for pris på skilt', 'ny', v_profile2_id, v_case2_id, current_date + 14, v_profile_id),
    (v_tenant_id, 'Forbered budsjettgrunnlag', 'Samle tall fra vedlikeholdsplan og regnskap', 'pagar', v_profile_id, v_case3_id, current_date + 30, v_profile_id);

  -- ── Møte ─────────────────────────────────────────────────────

  insert into public.board_meetings (tenant_id, meeting_type, title, date, time, location, created_by)
  values (v_tenant_id, 'styremote', 'Styremøte juni 2026', current_date + 11, '18:00', 'Felleslokalet, 1. etg', v_profile_id)
  returning id into v_meeting_id;

  insert into public.meeting_attendance (meeting_id, profile_id, status) values
    (v_meeting_id, v_profile_id, 'confirmed'),
    (v_meeting_id, v_profile2_id, 'confirmed');

  -- ── HMS ──────────────────────────────────────────────────────

  insert into public.hms_areas (tenant_id, name, description, area_type, risk_level) values
    (v_tenant_id, 'Brannvern', 'Brannalarmer, slukkeutstyr, rømningsveier', 'brann', 'middels')
  returning id into v_area_brann;

  insert into public.hms_areas (tenant_id, name, description, area_type, risk_level) values
    (v_tenant_id, 'Lekeplass', 'Lekeplass ved sør-inngang', 'lekeplass', 'middels')
  returning id into v_area_lekeplass;

  insert into public.hms_areas (tenant_id, name, description, area_type, risk_level) values
    (v_tenant_id, 'El-anlegg', 'Hovedtavle og fellesareal', 'el', 'lav')
  returning id into v_area_el;

  -- HMS kontroller
  insert into public.hms_controls (tenant_id, area_id, title, description, frequency, responsible_id, next_due_date) values
    (v_tenant_id, v_area_brann, 'Kontroll brannalarmer', 'Test alle brannalarmer i fellesareal', 'quarterly', v_profile_id, current_date + 15),
    (v_tenant_id, v_area_brann, 'Kontroll slukkeutstyr', 'Sjekk dato og trykk på alle brannslukkeapparater', 'annual', v_profile_id, current_date + 90),
    (v_tenant_id, v_area_lekeplass, 'Årlig lekeplassinspeksjon', 'Visuell kontroll av alle apparater iht. forskrift', 'annual', v_profile2_id, current_date - 21),
    (v_tenant_id, v_area_el, 'El-kontroll fellesareal', 'Kontroll av hovedtavle og jordfeilbrytere', 'annual', v_profile_id, current_date + 120);

  -- HMS avvik (lekeplass er forfalt)
  insert into public.hms_deviations (tenant_id, area_id, title, description, severity, status, reported_by, assigned_to, due_date) values
    (v_tenant_id, v_area_lekeplass, 'Lekeplassinspeksjon ikke gjennomført', 'Årlig inspeksjon var planlagt 15. mai men er ikke utført. Styret er ansvarlig iht. internkontrollforskriften.', 'hoy', 'open', v_profile_id, v_profile2_id, current_date + 7),
    (v_tenant_id, v_area_brann, 'Brannslukkapparat 3. etg utgått', 'Brannslukkeapparat ved trapp 3. etg har utgått dato (mai 2026).', 'middels', 'open', v_profile2_id, v_profile_id, current_date + 14);

  -- ── Vedlikehold ──────────────────────────────────────────────

  insert into public.maintenance_items (tenant_id, building_part, description, condition, expected_lifetime_years, last_maintained_at, next_maintenance_at, estimated_cost) values
    (v_tenant_id, '361 Takrenner', 'Takrenner og nedløp — rensing og kontroll', 'akseptabel', 1, '2025-06-15', '2026-06-15', 15000),
    (v_tenant_id, '234 Yttervegger', 'Fasade — visuell kontroll og vedlikehold', 'god', 10, '2019-08-01', '2029-08-01', 850000),
    (v_tenant_id, '311 Vinduer', 'Vinduer fellesareal — beslag og tetting', 'akseptabel', 5, '2023-09-01', '2028-09-01', 120000),
    (v_tenant_id, '221 Tak', 'Taktekking — kontroll og utbedring', 'darlig', 15, '2019-08-01', '2027-01-01', 1200000),
    (v_tenant_id, '412 Vann og avløp', 'Rørgjennomgang fellesareal', 'god', 30, '2019-08-01', '2049-08-01', 3500000);

  -- ── AI-forslag ───────────────────────────────────────────────

  insert into public.ai_suggestions (tenant_id, type, suggestion_text, status, source_refs, model_used) values
    (v_tenant_id, 'juridisk', 'Basert på byggeår (2019) og at 5-års reklamasjonsfristen nærmer seg, anbefaler vi å bestille en ekstern befaring av fasaden innen august.', 'pending', array['FDV-dokumentasjon', 'Bustadsoppføringslova §30'], 'claude-4-sonnet'),
    (v_tenant_id, 'vedlikehold', 'Vedlikeholdsplanen viser at takrenner bør renses. Sist utført: juni 2025. Anbefalt: årlig. Vil du opprette oppgave?', 'pending', array['Vedlikeholdsplan', 'bygningsdel 361'], 'claude-4-sonnet'),
    (v_tenant_id, 'styrearbeid', 'Det er 3 ubehandlede saker som kan være relevante for neste styremøte (20. juni). Vil du generere et agendaforslag?', 'pending', array['Styresaker #12, #15, #18'], 'claude-4-sonnet');

end $$;

-- ── Sperre nye registreringer ──────────────────────────────────
-- Hindrer at hvem som helst kan registrere seg

-- Deaktiver signup via Supabase Dashboard:
-- Authentication → Providers → Email → Disable "Enable Sign Up"
-- Eller legg til denne RLS-policyen som blokkerer nye profiler:

-- (Gjøres manuelt i Dashboard for å være sikker)
