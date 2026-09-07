-- ============================================================================
-- ONE-PASTE SETUP  (no terminal required)
--
-- Run this whole file in the Supabase SQL Editor:
--   app.supabase.com/project/<your-ref>/sql  ->  New query  ->  paste  ->  Run
--
-- BEFORE RUNNING, use Ctrl-H / Cmd-H to replace the two placeholders:
--   __PROJECT_REF__   your project ref (the id in your dashboard URL)
--   __ANON_KEY__      Settings -> API -> Project API keys -> anon / public
--
-- Deploy the Edge Function FIRST (see EMAIL_SETUP_GUIDE.md, Dashboard route),
-- otherwise the trigger created here will call a function that does not exist.
--
-- Safe to run more than once.
-- ============================================================================


-- 1. Table ------------------------------------------------------------------

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  roll_no text not null,
  email text not null,
  phone text not null,
  branch text not null,
  year text not null,
  departments text[] not null default '{}',
  why_lead text,
  heard_from text,
  linkedin text,
  github text,
  skills text,
  experience text,
  other_societies text,
  anything_else text,
  email_sent_at timestamptz,
  email_error text
);

-- For a database created before the email columns existed.
alter table public.registrations add column if not exists email_sent_at timestamptz;
alter table public.registrations add column if not exists email_error text;


-- 2. Access rules -----------------------------------------------------------

alter table public.registrations enable row level security;

drop policy if exists "anon can insert registrations" on public.registrations;
create policy "anon can insert registrations"
  on public.registrations for insert
  to anon
  with check (true);

-- Applicants must not be able to pre-set the email bookkeeping columns.
revoke insert (email_sent_at, email_error) on public.registrations from anon;

drop policy if exists "authenticated can read registrations" on public.registrations;
create policy "authenticated can read registrations"
  on public.registrations for select
  to authenticated
  using (true);

alter table public.registrations
  drop constraint if exists registrations_departments_valid;
alter table public.registrations
  add constraint registrations_departments_valid check (
    array_length(departments, 1) >= 1
    and departments <@ array['Tech', 'Media & PR', 'Content', 'Design', 'Marketing', 'Event & Management']::text[]
  );


-- 3. The automation ---------------------------------------------------------
-- Fires the confirmation email on every new registration, from inside the
-- database, so it does not depend on the applicant's browser staying open.

create extension if not exists pg_net with schema extensions;

drop trigger if exists send_recruitment_email on public.registrations;

create trigger send_recruitment_email
  after insert on public.registrations
  for each row
  execute function supabase_functions.http_request(
    'https://__PROJECT_REF__.supabase.co/functions/v1/send-confirmation-email',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer __ANON_KEY__"}',
    '{}',
    '5000'
  );


-- 4. Check it worked --------------------------------------------------------
-- Expect one row named send_recruitment_email.

select tgname as trigger_name
from pg_trigger
where tgrelid = 'public.registrations'::regclass
  and not tgisinternal;

-- After you submit the form once, this shows delivery status per applicant:
--   select email, email_sent_at, email_error
--   from public.registrations order by created_at desc limit 10;
