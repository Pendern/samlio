# Samlio — Prosjektstatus

**Sist oppdatert:** 23. juni 2026
**Repo:** https://github.com/Pendern/samlio
**Live:** https://www.samlio.no (Vercel: `samlio` i `penderns-projects`)
**Supabase:** `fmdgrzujvuoslqafejzv.supabase.co` (Free tier)

## Tech Stack
- Next.js 16+ (App Router, Server Components)
- React 19 + TypeScript 5
- Tailwind CSS 4 via @tailwindcss/postcss
- shadcn/ui (zinc dark theme)
- Supabase (Auth, PostgreSQL, Storage, RLS)
- Inter font, Lucide React icons

## Ferdigstilte sider (20 stk)

| Side | Rute | Beskrivelse |
|------|------|-------------|
| Dashboard | `/` | AI-drevet oversikt, urgency-kort, modulkort |
| Login | `/login` | Supabase email/password auth |
| Saker | `/saker` | Styresaker med opprett-dialog |
| Møter | `/moter` | Møteoversikt |
| Møtedetalj | `/moter/[id]` | Protokolleditor |
| HMS | `/hms` | Kontroller, avvik, områder |
| Vedlikehold | `/vedlikehold` | 10-årsplan, oppgaver |
| Økonomi | `/okonomi` | Bankkontoer, fakturaer, budsjett, utlegg |
| Nybygg | `/nybygg` | Reklamasjoner, FDV-dokumenter (Storage) |
| Fellesskap | `/fellesskap` | Innlegg, grupper, arrangementer, RSVP |
| Mitt fellesskap | `/fellesskap/mitt` | Personlig feed |
| Generalforsamling | `/generalforsamling` | Saksliste, digital stemming |
| Drift | `/drift` | Forsikring, nøkler, booking, leverandører |
| Oversikt | `/oversikt` | Tabbed export (PDF/Excel/email) |
| Statistikk | `/statistikk` | Visuell statistikk med PDF-export |
| Varsler | `/varsler` | Notifikasjoner, gruppert per dag |
| Innstillinger | `/innstillinger` | 9 varselpreferanser |
| Profil | `/profil` | Redigerbar kontaktinfo |
| Beboer | `/beboer` | Beboeroversikt |

## Database-migrasjoner (9 stk)

| # | Fil | Tabeller |
|---|-----|----------|
| 001 | Initial schema | tenants, profiles, units, unit_owners, board_cases, documents, tasks, audit_log, ai_suggestions |
| 002 | Meetings | board_meetings, board_decisions, meeting_attendance |
| 003 | HMS | hms_areas, hms_controls, hms_checklists, hms_deviations |
| 004 | Maintenance | maintenance_items |
| 005 | Economy | bank_accounts, invoices, budget_items, expenses |
| 006 | Community | community_posts, community_groups, community_events, event_rsvps |
| 007 | Notifications | notifications, notification_preferences |
| 008 | Generalforsamling | assemblies, assembly_items, assembly_votes, assembly_motions, assembly_attendance |
| 009 | Drift | insurance_policies, key_register, booking_resources, bookings, suppliers |

Alle tabeller har RLS med tenant isolation. Seed data for alle moduler.

## Nøkkelfiler

- `src/lib/auth.ts` — `getAuthContext()` (bruker `.limit(1)` ikke `.single()`)
- `src/lib/config.ts` — Alle status/severity/condition configs + formatering
- `src/lib/notifications.ts` — Notification-opprettelse med preferansesjekk
- `src/lib/export.ts` — PDF/Excel-generering
- `src/components/layout/Sidebar.tsx` — Sidebar med Styre/Beboer-veksling
- `src/components/layout/AppShell.tsx` — Skjuler sidebar på /login
- `src/app/actions.ts` — Globale server actions (createBoardCase, createHmsDeviation, signOut)

## Auth
- Bruker: `andreas@waagmartinsen.no`
- `email_confirmed_at` ble satt manuelt (Auto Confirm var ikke på)

## DNS
- samlio.no: A record → 216.198.79.1, CNAME www → Vercel
- Registrar: Uniweb

## Ferdigstilt AI-integrasjon
- Mock AI-provider (gratis, ingen API-kall) med provider-interface for enkel Claude-swap
- Suggestion engine analyserer 9 datakilder: HMS-kontroller, avvik, vedlikehold (frist + tilstand), fakturaer, budsjett, forsikring, stale saker, kommende møter
- Dashboard: "Oppdater forslag"-knapp, kategori-filter (HMS/Vedlikehold/Økonomi/Forsikring/Saker/Møter), aksepter/utsett/avvis med toast-feedback
- `/ai` chat-side med kontekstuelle svar basert på live data, inkludert "gi meg en statusoversikt"
- Sonner toast-notifikasjoner (dark theme, bottom-right)
- Arkitektur: `src/lib/ai/provider.ts` (interface), `mock-provider.ts`, `engine.ts`, `index.ts` (factory)

## Neste utviklingsfase — prioriterte forbedringer

### Prioritet 1 — Høy verdi, lav innsats
- [ ] **Automatisk forslagsgenerering** — Kall engine server-side ved dashboard-lasting med caching (maks 1x/time), slik at brukeren alltid ser ferske forslag uten å klikke
- [ ] **AI-tester** — Unit-tester for MockAiProvider (chat-routing, suggestion-generering) og engine (dataanalyse-logikk)
- [ ] **Audit logging av AI** — Logge alle AI-interaksjoner (forslag generert, akseptert, avvist) til `audit_log`
- [ ] **Forslagshistorikk** — Vis aksepterte/avviste forslag i en egen fane, ikke bare pending

### Prioritet 2 — Høy verdi, middels innsats
- [ ] **Claude API-integrasjon** — Implementer `ClaudeProvider` i `src/lib/ai/`, sett `ANTHROPIC_API_KEY` i env. Mock forblir fallback
- [ ] **Brukeradministrasjon** — Invite-flow: styreleder inviterer nye brukere via e-post, automatisk profil-opprettelse med riktig tenant_id
- [ ] **Flere seed-brukere** — Legg til styremedlem + beboer for å teste rolleveksling ordentlig
- [ ] **Responsivt design** — Finjuster mobilvisning: sidebar som drawer, filter-chips scroll horisontalt, chat fullskjerm

### Prioritet 3 — Middels verdi, høyere innsats
- [ ] **PWA-støtte** — Service worker, manifest.json, offline-tilgang, push-varsler
- [ ] **Forsikringsskadehåndtering** — Utvidelse av drift-modulen: registrer skade → koble til polise → spor status
- [ ] **Dokumenthåndtering** — AI-oppsummering av opplastede dokumenter (krever Claude)
- [ ] **E-post-integrasjon** — Resend-baserte varsler for kritiske hendelser (HMS-avvik, forsikring utløper)
- [ ] **Flerspråklig** — Engelsk UI-oversettelse for internasjonale sameier
