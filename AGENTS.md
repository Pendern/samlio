<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Mitt Sameie V5

## Project Overview
**Mitt Sameie V5** is an AI-driven housing cooperative portal for Norwegian borettslag and sameier. It replaces fragmented systems (Bonabo, Styrerommet, Bevar HMS, Bevar Vedlikehold) with one unified, intelligent platform.

## Tech Stack
- **Next.js 16+** (App Router, Server Components)
- **React 19** with TypeScript 5
- **Tailwind CSS 4** via @tailwindcss/postcss
- **shadcn/ui** components (zinc theme)
- **Supabase** (Auth, PostgreSQL, Storage, Realtime, Edge Functions)
- **Claude API** (Anthropic) for AI features
- **Inter** font family
- **Lucide React** icons

## Project Structure
```
mitt-sameie/
├── src/
│   ├── app/                # Next.js App Router pages
│   │   ├── layout.tsx      # Root layout with sidebar
│   │   ├── page.tsx        # AI-driven dashboard
│   │   ├── saker/          # Board cases
│   │   ├── moter/          # Meetings
│   │   ├── hms/            # HMS module
│   │   ├── vedlikehold/    # Maintenance module
│   │   ├── okonomi/        # Economy
│   │   ├── kommunikasjon/  # Communication
│   │   └── globals.css     # Global styles + shadcn theme
│   ├── components/
│   │   ├── layout/         # Sidebar, Header
│   │   └── ui/             # shadcn/ui components
│   ├── lib/
│   │   ├── supabase/       # Supabase client/server
│   │   └── utils.ts        # Utility functions
│   └── types/
│       └── database.ts     # Multi-tenant type definitions
```

## Design Principles (non-negotiable)
1. **Workflow before modules** — start from what's happening, what needs deciding, what needs doing
2. **Everything has context** — messages → case, documents → decision, calendar → maintenance/risk
3. **System suggests, not just shows** — proactive AI suggestions with accept/reject/edit/defer
4. **Same data, different perspectives** — styreleder sees risk, styremedlem sees responsibility, beboer sees info
5. **History matters** — "What happened last time we did this?"
6. **Safety first** — especially for new buildings (warranty deadlines, legal protection)
7. **Harmony between residents and board** — trust through predictability

## Styling Guidelines
- **Dark mode first** — zinc-950 background, zinc-900 cards, zinc-800 borders
- Use **Tailwind CSS** utility classes exclusively
- Use **shadcn/ui** components — do NOT install MUI, Chakra, or other libraries
- Status colors: red (urgent/critical), amber (warning), emerald (good/success), violet (AI/suggestions), teal (meetings)
- AI content always marked with violet color scheme + Sparkles icon
- Cards: `bg-zinc-900 border border-zinc-800 rounded-xl`
- Urgency cards: `bg-red-950/50 border border-red-900/50` or `bg-amber-950/50`

## Content Guidelines
- All UI text in **Norwegian (Bokmål)**
- Use realistic, contextual data — no lorem ipsum
- Button labels: clear and direct
- No technical jargon — this is for board members, not developers

## AI Governance Rules
1. AI can never act without user confirmation
2. AI-generated content is clearly marked (AI icon + visual indicator)
3. All AI suggestions stored in `ai_suggestions` table with status and source refs
4. User can always: Accept ✓ | Reject ✗ | Edit ✎ | Defer ⏰
5. All AI interactions logged in `audit_log`

## Development Commands
```bash
npm run dev     # Start dev server (http://localhost:3000)
npm run build   # Build for production
npm run lint    # Run ESLint
```

## Multi-tenant Architecture
- All database tables have `tenant_id` for data isolation
- Row Level Security (RLS) in Supabase enforces tenant boundaries
- White-label support: logo, colors, name per tenant
