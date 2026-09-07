-- Creates the database trigger that fires the confirmation email on every new
-- registration. This is the automation: it runs inside Postgres, so it does not
-- depend on the applicant's browser staying open.
--
-- This is the same object the Dashboard's Database -> Webhooks UI creates; doing
-- it in SQL keeps it in version control.
--
-- Before running, replace the two placeholders below:
--   <PROJECT_REF>  your project ref (from app.supabase.com/project/<ref>)
--   <ANON_KEY>     Settings -> API -> Project API keys -> anon / public
--
-- scripts/setup-email.sh generates a filled-in copy for you.

-- Lets Postgres make outbound HTTP calls.
create extension if not exists pg_net with schema extensions;

drop trigger if exists send_recruitment_email on public.registrations;

create trigger send_recruitment_email
  after insert on public.registrations
  for each row
  execute function supabase_functions.http_request(
    'https://<PROJECT_REF>.supabase.co/functions/v1/send-confirmation-email',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer <ANON_KEY>"}',
    '{}',
    '5000'
  );

-- Verify it exists:
--   select tgname from pg_trigger where tgrelid = 'public.registrations'::regclass;
