-- ============================================================
-- Mitt Sameie V5 — Økonomi
-- ============================================================

-- Bankkontoer
create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  bank_name text,
  account_number text,
  balance numeric default 0,
  account_type text check (account_type in ('drift', 'sparing', 'skatt', 'annet')),
  updated_at timestamptz default now()
);

-- Fakturaer
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  vendor text not null,
  description text,
  amount numeric not null,
  due_date date not null,
  category text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'paid')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  comment text,
  file_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Budsjettposter
create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  year int not null,
  category text not null,
  description text,
  budgeted_amount numeric not null default 0,
  actual_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Utlegg
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  submitted_by uuid references public.profiles(id) not null,
  description text not null,
  amount numeric not null,
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table public.bank_accounts enable row level security;
alter table public.invoices enable row level security;
alter table public.budget_items enable row level security;
alter table public.expenses enable row level security;

create policy "Tenant isolation" on public.bank_accounts
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));
create policy "Tenant isolation" on public.invoices
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));
create policy "Tenant isolation" on public.budget_items
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));
create policy "Tenant isolation" on public.expenses
  for all using (tenant_id in (select tenant_id from public.profiles where user_id = auth.uid()));

-- Triggers
create trigger set_updated_at before update on public.bank_accounts for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.invoices for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.budget_items for each row execute function public.handle_updated_at();

-- ── Seed testdata ──────────────────────────────────────────────

do $$
declare
  v_tenant_id uuid;
  v_profile_id uuid;
begin
  select id into v_tenant_id from public.tenants limit 1;
  select id into v_profile_id from public.profiles where role = 'styreleder' and tenant_id = v_tenant_id limit 1;

  -- Bankkontoer (som Bonabo-dashboardet)
  insert into public.bank_accounts (tenant_id, name, bank_name, account_number, balance, account_type) values
    (v_tenant_id, 'Driftskonto', 'DNB', '1520.22.81491', 669275, 'drift'),
    (v_tenant_id, 'Høyrenteplassering', 'DNB', '1520.33.24089', 1175453, 'sparing'),
    (v_tenant_id, 'Bankinnskudd øvrige', 'DNB', '1520.33.24119', 534272, 'sparing');

  -- Fakturaer
  insert into public.invoices (tenant_id, vendor, description, amount, due_date, category, status) values
    (v_tenant_id, 'ISS Facility Services', 'Renhold fellesareal juni', 12500, current_date + 5, 'Renhold', 'pending'),
    (v_tenant_id, 'Hafslund Strøm', 'Strøm fellesareal mai', 8750, current_date + 3, 'Strøm', 'pending'),
    (v_tenant_id, 'Vaktmester Hansen', 'Snømåking april', 4500, current_date - 2, 'Vedlikehold', 'pending'),
    (v_tenant_id, 'If Forsikring', 'Bygningsforsikring Q2', 45000, current_date + 15, 'Forsikring', 'approved'),
    (v_tenant_id, 'Securitas', 'Brannalarm service', 6800, current_date - 10, 'HMS', 'paid');

  -- Budsjettposter 2026
  insert into public.budget_items (tenant_id, year, category, description, budgeted_amount, actual_amount) values
    (v_tenant_id, 2026, 'Renhold', 'Renhold fellesareal', 150000, 62500),
    (v_tenant_id, 2026, 'Strøm', 'Strøm fellesareal', 120000, 48750),
    (v_tenant_id, 2026, 'Vedlikehold', 'Løpende vedlikehold', 200000, 45000),
    (v_tenant_id, 2026, 'Forsikring', 'Bygningsforsikring', 180000, 90000),
    (v_tenant_id, 2026, 'HMS', 'HMS og sikkerhet', 50000, 6800),
    (v_tenant_id, 2026, 'Kommunale avgifter', 'Vann, avløp, renovasjon', 95000, 47500),
    (v_tenant_id, 2026, 'Forretningsfører', 'Honorar forretningsfører', 85000, 42500),
    (v_tenant_id, 2026, 'Annet', 'Diverse driftskostnader', 30000, 8500);

  -- Utlegg
  insert into public.expenses (tenant_id, submitted_by, description, amount, status) values
    (v_tenant_id, v_profile_id, 'Blomster til beplantning i inngangsparti', 890, 'pending'),
    (v_tenant_id, v_profile_id, 'Printer-blekk til styrekontoret', 450, 'approved');
end $$;
