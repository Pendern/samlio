# Samlio — Prosjektstatus

**Sist oppdatert:** 19. juli 2026
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

## Ferdigstilte sider (24 stk)

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
| Mine boliger | `/boliger` | Enheter, nøkler, bookinger, bygningsstatus |
| Brukere | `/brukere` | Brukeradmin, roller, invitasjon (kun styreleder) |
| Drift | `/drift` | Forsikring, nøkler, booking, leverandører |
| Spør AI | `/ai` | Chat med kontekstuell AI-assistent |

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
- `src/lib/audit.ts` — Gjenbrukbar audit logging helper (fire-and-forget)
- `src/lib/ai/` — AI-motorlag: provider.ts (interface), mock-provider.ts, engine.ts, index.ts
- `src/lib/supabase/admin.ts` — Supabase admin-klient (service_role key)
- `src/components/layout/Sidebar.tsx` — Sidebar med Styre/Beboer-veksling
- `src/components/layout/AppShell.tsx` — Mobil hamburger-meny + desktop sidebar
- `src/app/actions.ts` — Globale server actions

## Auth — Testbrukere
- **Styreleder:** andreas@waagmartinsen.no (eksisterende passord)
- **Styremedlem:** kari@samlio.no / Samlio2026!
- **Beboer:** erik@samlio.no / Samlio2026! (enhet H0204, 58m², 2. etg)
- `email_confirmed_at` ble satt manuelt for første bruker

## DNS
- samlio.no: A record → 216.198.79.1, CNAME www → Vercel
- Registrar: Uniweb

## Utviklingslogg

### Sesjon 23. juni 2026
- Opprettet Drift/Selskapet-modul (forsikring, nøkler, booking, leverandører)
- SQL-migrasjon 009 med 5 tabeller, RLS og seed data
- Opprettet GitHub-repo: github.com/Pendern/samlio
- Deployet til Vercel: www.samlio.no

### Sesjon 27. juni 2026
- AI-integrasjon: mock provider, suggestion engine, chat (/ai)
- Auto-generering av forslag ved dashboard-lasting (1t cache)
- Toast-notifikasjoner (Sonner) for alle AI-operasjoner
- Kategori-filtrering i forslagslisten
- Forslagshistorikk (kollapserbar, siste 20 resolved)
- Audit logging for alle AI-interaksjoner (src/lib/audit.ts)
- Chat keyword-prioritet fikset (forsikring vs sak)
- Brukeradministrasjon: /brukere med inviter, roller, fjern
- Supabase admin-klient (src/lib/supabase/admin.ts)
- Seed-brukere: Kari Johansen (styremedlem), Erik Berg (beboer)
- Responsivt design: mobil hamburger-meny, responsive brukerkort
- Passordendring på profilsiden
- Mine Boliger-side (/boliger)
- 48 AI unit-tester (totalt 143 tester)

### Sesjon 19. juli 2026
- Supabase-prosjekt gjenopprettet (pauset etter 3 uker inaktivitet)
- OpenAI-integrasjon: GPT-4o-mini provider (`src/lib/ai/openai-provider.ts`)
- System prompt: Samlio AI — norsk styreassistent med live datakontekst
- OPENAI_API_KEY konfigurert i .env.local + Vercel env vars
- PWA-støtte: manifest.json, service worker, ikoner (192+512), Apple Web App
- E-postsystem: gjenbrukbar email-tjeneste (`src/lib/email.ts`)
- Daglig digest-e-post: analyserer HMS/fakturaer/forsikring/vedlikehold
- Instant alert-funksjon for kritiske enkelthendelser
- "Send oppsummering"-knapp på /varsler med toast-feedback
- Cross-project standards: delt kunnskapsbase på Dropbox for alle prosjekter
- AGENTS.md oppgradert med deploy, smoke test, env vars, update policy
- Alpha-Engine: ny AGENTS.md opprettet med cross-project referanse

## Tester
- **143 tester** i 7 filer, alle bestått
- Dekker: typer, utils, export, notifications, statistikk, generalforsamling, AI

## Oppsett som gjenstår (manuelt)
- [ ] **RESEND_API_KEY** — Opprett konto på resend.com, verifiser samlio.no-domenet, legg til nøkkel i .env.local + Vercel
- [ ] **SUPABASE_SERVICE_ROLE_KEY** — Legg til i .env.local og Vercel for full invitasjonsflyt

## Neste utviklingsfase — prioriterte forbedringer

### Fra Sendeklar-læring (høy verdi, lav innsats)
- [ ] **Cmd+K kommandopalett** — Global hurtignavigasjon over 24 sider (~30 min)
- [ ] **Loading skeletons** — loading.tsx for alle sider med datainnlasting (~20 min)
- [ ] **GitHub Actions CI** — Automatisk build+test+lint på push (~10 min)
- [ ] **Personvern + vilkår** — GDPR-sider for samlio.no (~20 min)

### Funksjonelle forbedringer
- [ ] **Forsikringsskadehåndtering** — Utvidelse av drift: registrer skade → koble til polise → spor status
- [ ] **Dokumenthåndtering** — AI-oppsummering av opplastede dokumenter via OpenAI
- [ ] **Push-varsler** — Web Push API for sanntidsvarsler på mobil/desktop
- [ ] **Flerspråklig** — Engelsk UI-oversettelse
