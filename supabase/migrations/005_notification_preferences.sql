-- ============================================================
-- Mitt Sameie V5 — Varslingsinnstillinger
-- ============================================================

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  post_enabled boolean default true,
  comment_enabled boolean default true,
  reaction_enabled boolean default true,
  event_reminder_enabled boolean default true,
  rsvp_enabled boolean default true,
  group_invite_enabled boolean default true,
  hms_deviation_enabled boolean default true,
  task_assigned_enabled boolean default true,
  meeting_reminder_enabled boolean default true,
  updated_at timestamptz default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users manage own preferences" on public.notification_preferences
  for all using (profile_id in (select id from public.profiles where user_id = auth.uid()));

create trigger set_updated_at before update on public.notification_preferences
  for each row execute function public.handle_updated_at();
