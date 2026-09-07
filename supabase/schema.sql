-- ===========================================================================
-- LEAD Recruitment 2026-27 — complete database schema
--
-- Run this ONCE in the Supabase SQL Editor of a fresh project:
--   Dashboard -> SQL Editor -> New query -> paste all of this -> Run
--
-- There is nothing to fill in. No project ref, no API key, no placeholders.
-- Safe to run more than once.
--
-- What it does NOT do: create the email automation. That is configured in the
-- dashboard (see SETUP.md, Part 4) because the dashboard builds the webhook's
-- auth header itself, which is more reliable than pasting a key into SQL.
-- ===========================================================================


-- 1. Applications table -----------------------------------------------------

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Section 01 — personal details
  name text not null,
  roll_no text not null,
  email text not null,
  phone text not null,
  branch text not null,

  -- Sections 02 & 03 — year and department preferences
  year text not null,
  departments text[] not null default '{}',

  -- Sections 04-08 — written answers
  why_lead text,
  heard_from text,
  linkedin text,
  github text,
  skills text,
  experience text,
  other_societies text,
  anything_else text,

  -- Confirmation email bookkeeping, written only by the Edge Function.
  -- email_sent_at is the atomic claim that guarantees one email per applicant.
  email_sent_at timestamptz,
  email_error text
);

-- Present so the file also upgrades a table created by an older version.
alter table public.registrations add column if not exists email_sent_at timestamptz;
alter table public.registrations add column if not exists email_error text;


-- 2. Access control ---------------------------------------------------------

-- With RLS on, the table is invisible to everyone except through the policies
-- below. Without this the anon key would expose every application publicly.
alter table public.registrations enable row level security;

-- Applicants may submit, and may never read anything back. This covers
-- 'authenticated' as well as 'anon' so that an admin who is signed in at
-- /admin in the same browser can still submit the form -- their session is
-- 'authenticated', and an anon-only policy would reject their application.
drop policy if exists "anon can insert registrations" on public.registrations;
create policy "anon can insert registrations"
  on public.registrations for insert
  to anon, authenticated
  with check (true);

-- Signed-in admins may read every application. This is what /admin needs.
drop policy if exists "authenticated can read registrations" on public.registrations;
create policy "authenticated can read registrations"
  on public.registrations for select
  to authenticated
  using (true);

-- Applicants must not be able to forge the email bookkeeping columns.
revoke insert (email_sent_at, email_error) on public.registrations from anon, authenticated;


-- 3. Data integrity ---------------------------------------------------------

-- Departments must match the six choices offered by the form.
alter table public.registrations
  drop constraint if exists registrations_departments_valid;
alter table public.registrations
  add constraint registrations_departments_valid check (
    array_length(departments, 1) >= 1
    and departments <@ array[
      'Tech', 'Media & PR', 'Content', 'Design', 'Marketing', 'Event & Management'
    ]::text[]
  );

-- Year must be one of the two the form offers.
alter table public.registrations
  drop constraint if exists registrations_year_valid;
alter table public.registrations
  add constraint registrations_year_valid check (year in ('1st Year', '2nd Year'));

-- One application per candidate. Case-insensitive, so Roll123 and roll123 clash.
create unique index if not exists registrations_roll_no_key
  on public.registrations (lower(roll_no));
create unique index if not exists registrations_email_key
  on public.registrations (lower(email));

-- Newest-first is how the admin console lists applications.
create index if not exists registrations_created_at_idx
  on public.registrations (created_at desc);


-- 4. Verify -----------------------------------------------------------------
-- Expect: 2 email columns, 2 policies, 2 check constraints, 3 indexes.

select 'column' as kind, column_name as name from information_schema.columns
  where table_schema = 'public' and table_name = 'registrations'
    and column_name in ('email_sent_at', 'email_error')
union all
select 'policy', polname from pg_policy
  where polrelid = 'public.registrations'::regclass
union all
select 'constraint', conname from pg_constraint
  where conrelid = 'public.registrations'::regclass and contype = 'c'
union all
select 'index', indexname from pg_indexes
  where schemaname = 'public' and tablename = 'registrations'
order by 1, 2;
