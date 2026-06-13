# Changelog — Samlio

## [0.1.0] — 2026-06-13

Første MVP-release med 16 sider, 74 enhetstester og full Supabase-integrasjon.

### Grunnmur
- Multi-tenant arkitektur med Row Level Security
- Supabase Auth med e-post/passord-innlogging
- Middleware som beskytter alle ruter
- Sømløs rolleveksling Styre ↔ Beboer i sidebar
- Delt auth-kontekst (`getAuthContext`) og konfig (`config.ts`)

### Dashboard
- AI-drevet dashboard med urgency-kort og live Supabase-data
- Personalisert hilsen basert på tid og brukernavn
- Nøkkeltall: aktive saker, dager til møte, HMS-avvik, felleskostnader
- AI-forslag med aksepter/rediger/avvis (mock — Claude-integrasjon kommer)
- Modulkort med live status

### Styresaker (`/saker`)
- Liste over alle aktive saker med statusbadges
- Opprett ny sak med tittel, kategori og beskrivelse
- Klient- og serverside-validering

### Møter (`/moter`, `/moter/[id]`)
- Møteoversikt med kommende og gjennomførte møter
- Opprett møte med type, dato, tid, sted — alle styremedlemmer inviteres automatisk
- Møtedetalj med deltakerliste og bekreftelsestatus
- Protokolleditor med mal-generering og lagring

### HMS (`/hms`)
- Kontrollområder med risikonivå (brann, el, lekeplass, garasje)
- Kontrollplan med frekvens og forfalt-markering
- Åpne avvik med alvorlighetsgrad og frist
- Registrere nytt avvik med validering

### Vedlikehold (`/vedlikehold`)
- 10-års vedlikeholdsplan med bygningsdeler, tilstand, kostnad
- Oppgaver med interaktiv statusendring (Start → Fullfør → Gjenåpne)
- Forfalt-markering og ansvarlig person
- Opprett nye vedlikeholdstiltak og oppgaver

### Fellesskap (`/fellesskap`)
- Aktivitetsstrøm med styreoppslag, beboerinnlegg og arrangementer
- Rolle-bevisst identitet: styret poster som "Styret" med skjold, beboere med navn
- Kommentarer med rolle-identitet
- Reaksjoner (like/unlike toggle)
- Grupper med bli med/forlat-funksjonalitet
- Arrangementspåmelding (RSVP toggle)
- Pin/unpin av innlegg (kun styre)
- "Mitt engasjement"-side med egne arrangementer og grupper

### Varsler (`/varsler`)
- Automatisk varselgenerering ved nye innlegg, kommentarer, HMS-avvik m.m.
- Varslingsside gruppert etter dag med ulest-markering
- Marker som lest (enkelt og alle)
- 9 varseltyper med fargekodet ikon
- Respekterer brukerens varslingsinnstillinger

### Innstillinger (`/innstillinger`)
- 9 toggles for varslingstyper gruppert i 3 kategorier
- Lagring med upsert-logikk
- Standardverdier (alt på) for nye brukere

### Statistikk (`/statistikk`)
- 6 KPI-kort: åpne avvik, løste, forfalt kontroll, oppgaver fullført %, forfalt, snitt løsningstid
- HMS per alvorlighetsgrad med stacked bars
- HMS per område med breakdown
- Oppgavestatus donut-diagram med fullføringsprosent
- Oppgaver per person med progress bars
- Forfalt-seksjon med samlet oversikt
- PDF-eksport av statistikkrapport
- E-post statistikkrapport til styremedlemmer med møtekontekst

### Styreoversikt (`/oversikt`)
- Tabbede faner: Saker, HMS, Oppgaver, Vedlikehold, Møter
- PDF- og Excel-eksport
- E-postrapport til styremedlemmer

### Beboerportal (`/beboer`)
- Min bolig med enhetsinformasjon
- Neste møte, bygginformasjon
- Aktive saker og HMS-status
- Styrekontaktinfo

### Profil (`/profil`)
- Profilkort med initialer, rolle, medlem siden-dato
- Redigerbar kontaktinfo med validering
- Boligselskap-info

### Teknisk
- 5 testfiler, 74 enhetstester (vitest)
- Delt `getAuthContext()` — eliminerer auth-duplisering
- Delt `config.ts` — single source of truth for status/severity/roller
- 5 SQL-migreringer med RLS og seed data
- Vercel-deploy med www.samlio.no
- Dark mode first med zinc-palette og shadcn/ui
