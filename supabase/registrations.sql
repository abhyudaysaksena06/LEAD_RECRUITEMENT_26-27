-- Run this in the Supabase SQL editor before using the recruitment form.
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
  -- Stamped by the send-confirmation-email Edge Function when it claims the
  -- send. Non-null means the confirmation email has gone out, which is what
  -- keeps the database webhook and the client fallback from both mailing.
  email_sent_at timestamptz,
  -- Last delivery error, if an attempt failed and released its claim.
  email_error text
);

-- For databases created before these columns existed.
alter table public.registrations add column if not exists email_sent_at timestamptz;
alter table public.registrations add column if not exists email_error text;

alter table public.registrations enable row level security;

-- Allow anonymous applicants to submit, but not to read others' applications.
create policy "anon can insert registrations"
  on public.registrations for insert
  to anon
  with check (true);

-- Applicants must not be able to pre-set the email bookkeeping columns; only
-- the Edge Function (service role) writes them.
revoke insert (email_sent_at, email_error) on public.registrations from anon;

-- Signed-in admins (any Supabase Auth user you create in the dashboard)
-- can read every application from the /admin console.
create policy "authenticated can read registrations"
  on public.registrations for select
  to authenticated
  using (true);

-- Departments must come from the recruitment form's list.
alter table public.registrations
  drop constraint if exists registrations_departments_valid;

alter table public.registrations
  add constraint registrations_departments_valid check (
    array_length(departments, 1) >= 1
    and departments <@ array['Tech', 'Media & PR', 'Content', 'Design', 'Marketing', 'Event & Management']::text[]
  );
