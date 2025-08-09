
# Unbilled Invoice Follow‑Up (IG Theme, Multi‑User)

Instagram-style gradient UI, multi-user auth via Supabase, CSV import/export, and message drafts for Email/WhatsApp.

## 1) What you get
- Next.js + Tailwind (IG gradient theme)
- Supabase Email OTP login (passwordless)
- Table: `invoices` with fields you need (including Collect D/O & Extra Seal)
- Filters: Unbilled / Overdue / All / Billed
- CSV Import & Export
- Follow-up email/WhatsApp draft generator
- Deployed on Vercel (recommended)

## 2) Quick Start

### A) Create Supabase project
1. Go to Supabase, create a new project (free tier is fine).
2. Get:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run this SQL in Supabase **SQL Editor** to create the table and Row Level Security (RLS):

```sql
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp with time zone default now(),
  user_id uuid,
  group_id text,
  customer text,
  invoice_no text,
  amount numeric,
  currency text,
  eta_date date,
  pod_date date,
  contact text,
  contact_email text,
  contact_phone text,
  collect_do numeric,
  extra_seal_qty int,
  notes text,
  status text,
  last_fu date,
  next_fu date
);

alter table invoices enable row level security;

-- Each user can only see their own rows (or rows in same group_id if you set equal group_id manually)
create policy "user-can-read-own" on invoices for select
  using (auth.uid() = user_id or (group_id is not null and group_id = auth.jwt()->>'user_metadata'->>'group_id'));

create policy "user-can-insert-own" on invoices for insert
  with check (auth.uid() = user_id or (group_id is not null and group_id = auth.jwt()->>'user_metadata'->>'group_id'));

create policy "user-can-update-own" on invoices for update
  using (auth.uid() = user_id or (group_id is not null and group_id = auth.jwt()->>'user_metadata'->>'group_id'));

create policy "user-can-delete-own" on invoices for delete
  using (auth.uid() = user_id or (group_id is not null and group_id = auth.jwt()->>'user_metadata'->>'group_id'));
```

> **Simple mode**: If you don't want groups yet, you can set `user_id` from the client (Supabase will auto-fill via Row Level Security conditions when you upsert).

### B) Clone & run locally
```bash
npm install
npm run dev
```
Create `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=YOUR_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### C) Deploy on Vercel
- Import this project to Vercel
- Set the same env vars in Vercel
- Build & deploy (about 1–2 minutes)
- No time limit; website is always available

## 3) Notes
- Overdue = `status = 'Unbilled'` and `next_fu < today`
- You can add more fields in Supabase, then expose them in the form/table.
- For company-wide sharing, add `group_id` to users (via Supabase Auth admin) and to rows.
- You can customize the follow-up templates in `components/FollowUpModal.tsx`.

## 4) Styling
- Tailwind with custom colors `ig1..ig5`
- Glassy white cards with soft shadows

Enjoy!

## 2) Quick Start (Super Simple, Single Group = `kfs001`)

### A) Create Supabase project
1. Create a new Supabase project (free tier).
2. Copy your **Project URL** and **Anon Key**.

### B) Run ONE SQL (copy-paste all)
Open **SQL Editor** in Supabase and run this:
```sql

-- SIMPLE MODE (no metadata): everyone who signs in sees the same team data (group_id = 'kfs001')
create extension if not exists pgcrypto;

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid,
  group_id text default 'kfs001',
  customer text,
  invoice_no text,
  amount numeric,
  currency text,
  eta_date date,
  pod_date date,
  contact text,
  contact_email text,
  contact_phone text,
  collect_do numeric,
  extra_seal_qty int,
  notes text,
  status text,
  last_fu date,
  next_fu date
);

alter table invoices enable row level security;

-- Anyone logged in can read/write rows for group_id='kfs001' only
drop policy if exists "select-kfs001" on invoices;
drop policy if exists "insert-kfs001" on invoices;
drop policy if exists "update-kfs001" on invoices;
drop policy if exists "delete-kfs001" on invoices;

create policy "select-kfs001" on invoices for select
  using ( group_id = 'kfs001' );

create policy "insert-kfs001" on invoices for insert
  with check ( group_id = 'kfs001' );

create policy "update-kfs001" on invoices for update
  using ( group_id = 'kfs001' );

create policy "delete-kfs001" on invoices for delete
  using ( group_id = 'kfs001' );

-- Auto-fill user_id (for reference) and ensure group_id defaults to 'kfs001'
create or replace function set_owner_group_simple()
returns trigger language plpgsql as $$
begin
  if new.user_id is null then new.user_id := auth.uid(); end if;
  if new.group_id is null then new.group_id := 'kfs001'; end if;
  return new;
end;
$$;

drop trigger if exists trg_set_owner_group_simple on invoices;
create trigger trg_set_owner_group_simple
before insert on invoices
for each row execute function set_owner_group_simple();

```

### C) Configure environment & run
Create `.env.local` in the project root with:
```
NEXT_PUBLIC_SUPABASE_URL=YOUR_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```
Then run:
```
npm install
npm run dev
```

### D) Deploy on Vercel (always online)
- Import the project to Vercel
- Set the same env vars
- Click **Deploy**

**Done!** Anyone who signs in by email will see the same team's invoices (group `kfs001`).

---

## 3) Later: Upgrade to Multi-Group (kfs001 → kfs020)
When you're ready, I will give you a 2-step upgrade to make separate groups, so each group only sees its own data.
