-- ============================================================
-- Mitt Sameie V5 — Varsler
-- ============================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('post', 'comment', 'reaction', 'event_reminder', 'rsvp', 'group_invite', 'hms_deviation', 'task_assigned', 'meeting_reminder')),
  title text not null,
  body text,
  href text,
  is_read boolean default false,
  actor_id uuid references public.profiles(id),
  entity_id uuid,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

create policy "Users see own notifications" on public.notifications
  for all using (recipient_id in (select id from public.profiles where user_id = auth.uid()));

create index idx_notifications_recipient on public.notifications(recipient_id, is_read, created_at desc);
