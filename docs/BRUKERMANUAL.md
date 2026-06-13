# Samlio — Brukermanual

## Innhold
1. [Innlogging](#innlogging)
2. [Dashboard](#dashboard)
3. [Styresaker](#styresaker)
4. [Møter og protokoll](#møter-og-protokoll)
5. [HMS](#hms)
6. [Vedlikehold](#vedlikehold)
7. [Fellesskap](#fellesskap)
8. [Varsler](#varsler)
9. [Styreoversikt og eksport](#styreoversikt-og-eksport)
10. [Statistikk](#statistikk)
11. [Beboerportal](#beboerportal)
12. [Profil og innstillinger](#profil-og-innstillinger)

---

## Innlogging

Gå til **samlio.no** og logg inn med e-post og passord. Etter innlogging sendes du direkte til dashboardet.

Utlogging: Klikk **Logg ut** nederst i sidebaren.

---

## Dashboard

Startsiden for styremedlemmer. Viser:

- **Krever handling** — Røde og gule kort for saker og avvik som haster. Klikk for å gå direkte til saken.
- **Nøkkeltall** — Aktive saker, dager til neste styremøte, åpne HMS-avvik, felleskostnader.
- **AI-forslag** — Proaktive anbefalinger fra systemet. Hvert forslag kan aksepteres, redigeres eller avvises.
- **Moduler** — Hurtiglenker til alle moduler med live status.

---

## Styresaker

**Navigasjon:** Sidebaren → Saker

- **Se saker:** Alle aktive saker vises med tittel, status, kategori og opprettet-dato.
- **Opprett ny sak:** Klikk "Ny sak" → fyll inn tittel (påkrevd), kategori og beskrivelse.
- **Statuser:** Ny → Under behandling → Vedtatt / Avvist / Utsatt → Arkivert.

---

## Møter og protokoll

**Navigasjon:** Sidebaren → Møter

### Opprette møte
Klikk "Nytt møte" → velg type (styremøte/årsmøte/ekstraordinært), dato, klokkeslett og sted. Alle styremedlemmer inviteres automatisk.

### Møtedetaljer
Klikk på et møte for å se:
- Dato, tid og sted
- Deltakerliste med bekreftelsestatus (grønn/rød/grå prikk)
- Tilknyttede styresaker

### Protokollføring
1. Klikk **Generer protokollutkast** — systemet lager en mal med møteinfo og deltakere.
2. Rediger utkastet fritt i tekstfeltet.
3. Klikk **Lagre protokoll** for å lagre til databasen.
4. Bruk **Regenerer utkast** for å starte på nytt.

---

## HMS

**Navigasjon:** Sidebaren → HMS

HMS-modulen erstatter separate HMS-systemer (som Bevar HMS) med en integrert løsning.

### Oversikt
- **Kontrollområder** — Brannvern, El-anlegg, Lekeplass osv. med risikonivå.
- **Kontrollplan** — Alle kontrollrutiner med frekvens og neste dato. Forfalte markeres med rødt.
- **Åpne avvik** — Avvik med alvorlighetsgrad, frist og ansvarlig.

### Registrere avvik
Klikk "Nytt avvik" → velg kontrollområde, alvorlighetsgrad (lav/middels/høy/kritisk), beskriv avviket og sett frist.

---

## Vedlikehold

**Navigasjon:** Sidebaren → Vedlikehold

### Vedlikeholdsplan
Alle bygningsdeler vises med:
- Tilstand (god/akseptabel/dårlig/kritisk)
- Sist vedlikeholdt og neste vedlikeholdsdato
- Estimert kostnad og forventet levetid
- Forfalte tiltak markeres med rød ramme

### Oppgaver
- Opprett oppgaver med tittel, beskrivelse og frist.
- Endre status: **Start** (ny → pågår) → **Fullfør** (pågår → ferdig) → **Gjenåpne** (ferdig → ny).
- Forfalte oppgaver markeres med rødt.

### Nytt tiltak
Klikk "Nytt tiltak" → fyll inn bygningsdel, tilstand, levetid, neste vedlikeholdsdato og estimert kostnad.

---

## Fellesskap

**Navigasjon:** Sidebaren → Fellesskap

Sameiets "interne Facebook" — en felles arena for beboere og styre.

### Veggen
- **Styreoppslag:** Pinnes øverst med violet badge. Vises som "Styret" med skjold-ikon.
- **Beboerinnlegg:** Alle kan poste. Vises med navn og initialer.
- **Arrangementer:** Vises med dato, sted og påmeldingsknapp.
- **Kommentarer:** Skriv kommentar og trykk Enter eller Send.
- **Reaksjoner:** Klikk tommel opp for å like.
- **Pin:** Styret kan pinne/avpinne innlegg (amber markering).

### Rolle-identitet
- **I styremodus:** Du poster og kommenterer som "Styret" med violet skjold.
- **I beboermodus:** Du poster og kommenterer med ditt navn og initialer.

### Grupper
Temabaserte grupper (Hagegruppen, Dugnad, etc.) vises øverst på siden.
- Klikk "Bli med" for å melde deg inn.
- Klikk på en gruppe du er med i → "Forlat" for å melde deg ut.

### Arrangementer
- "Meld deg på" på arrangementer.
- Se antall deltakere.
- Klikk igjen for å melde deg av.

### Mitt engasjement
Klikk "Mitt engasjement" øverst til høyre for å se:
- Kommende arrangementer med countdown
- Tidligere arrangementer
- Mine grupper med forlat-knapp
- Andre grupper du kan bli med i

---

## Varsler

**Navigasjon:** Sidebaren → Varsler (klokkeikon)

Varsler genereres automatisk ved:
- Nye innlegg og oppslag
- Kommentarer på dine innlegg
- Arrangementer og påmeldinger
- HMS-avvik og oppgavetildelinger
- Møtepåminnelser

### Varslingsside
- Gruppert etter dag
- Uleste har violet prikk — klikk for å markere som lest
- "Marker alle som lest" — markerer alle uleste
- Klikk på et varsel for å navigere til relevant side

### Innstillinger
Under **Innstillinger** (tannhjul i sidebaren) kan du slå av/på 9 varseltyper:
- **Fellesskap:** Innlegg, kommentarer, reaksjoner
- **Arrangementer:** Påminnelser, påmeldinger
- **Styrearbeid:** HMS-avvik, oppgaver, møtepåminnelser

---

## Styreoversikt og eksport

**Navigasjon:** Sidebaren → Oversikt (eller `/oversikt`)

Samlet oversikt med tabbede faner: Saker, HMS, Oppgaver, Vedlikehold, Møter.

### Eksport
Tre knapper øverst til høyre:
- **PDF** — Laster ned formatert rapport med alle data.
- **Excel** — Laster ned arbeidsbok med separate ark per kategori.
- **Send på e-post** — Sender rapporten til alle styremedlemmer (krever Resend-integrasjon).

---

## Statistikk

**Navigasjon:** `/statistikk`

Visuell statistikk for styremøter og rapportering.

### Innhold
- **6 nøkkeltall:** Åpne avvik, løste avvik, forfalt kontroll, oppgaver fullført (%), oppgaver forfalt, snitt løsningstid.
- **HMS per alvorlighetsgrad:** Horisontale bars med åpne vs. løst.
- **HMS per område:** Bars per kontrollområde.
- **Oppgavestatus:** Donut-diagram med fullføringsprosent.
- **Oppgaver per person:** Progress bars per styremedlem.
- **Forfalt-seksjon:** Rød boks med alle forfalte HMS-avvik, oppgaver og kontroller.

### Eksport
- **PDF** — Statistikkrapport med alle tabeller.
- **Send til styret** — E-post med nøkkeltall, HMS-breakdown, oppgavestatus og forfalt-liste. Inkluderer neste møte-info i emnelinjen.

---

## Beboerportal

**Navigasjon:** Bytt til "Beboer" i rolleveksleren i sidebaren.

Beboervisningen viser:
- **Min bolig** — Enhetsnummer, type, størrelse, etasje.
- **Neste møte** — Dato, tid, sted.
- **Bygget** — Adresse, byggeår, antall enheter.
- **Aktive styresaker** — Tittel, kategori, status.
- **HMS-status** — Åpne avvik med alvorlighetsgrad og frist.
- **Styret** — Kontaktinfo for alle styremedlemmer.

---

## Profil og innstillinger

### Profil (`/profil`)
Klikk på logoen øverst i sidebaren.
- Se og oppdater navn, e-post og telefon.
- Se rolle (kan ikke endres her) og "medlem siden"-dato.
- Se boligselskap-info: navn, org.nr, adresse, byggeår, enheter.

### Innstillinger (`/innstillinger`)
- Varslingsinnstillinger med toggle per type.
- Lenke til profilredigering.
