# LEAD Recruitment 2026–27 — Setup Guide

Everything needed to take a brand-new Supabase project to a working recruitment
form with automatic confirmation emails. Written for the dashboard; no terminal
required except for the last part.

Work through the parts in order. Each ends with a check that tells you whether
it worked, so a mistake surfaces immediately instead of three steps later.

| Part | What you do | Time |
|---|---|---|
| 1 | Create the Supabase project | 3 min |
| 2 | Create the database | 1 min |
| 3 | Create your admin login | 2 min |
| 4 | Set up the confirmation email | 10 min |
| 5 | Point the website at the project | 3 min |
| 6 | Test end to end | 3 min |

---

## Part 1 — Create the Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) → **New project**.
2. Name it anything (`lead-recruitment-2026`), pick a region near you
   (Mumbai / Singapore for Patiala), and set a database password.
   **Save that password in your password manager** — it cannot be shown again,
   only reset.
3. Wait for provisioning to finish (~2 minutes).
4. Go to **Settings → API** and copy these two values into a scratch note.
   You need them repeatedly:

   | Label in dashboard | Looks like | Called here |
   |---|---|---|
   | Project URL | `https://abcdefgh.supabase.co` | **PROJECT_URL** |
   | `anon` `public` key | `eyJhbGci...` (very long) | **ANON_KEY** |

> The `service_role` key on that page is a full-access admin key. It must never
> go into the website, a commit, or a chat message. You will not need it here —
> Supabase injects it into the Edge Function automatically.

---

## Part 2 — Create the database

1. **SQL Editor** → **New query**.
2. Open [`supabase/schema.sql`](supabase/schema.sql) from this repo, copy the
   whole file, paste, and **Run**.

There is nothing to edit in that file — no keys, no project ref.

**Check.** The last statement prints what it created. You should see nine rows:
two `column`, two `policy`, two `constraint`, three `index`. If you do, the
database is done.

What it created, in plain terms: the `registrations` table, Row Level Security
so applications are not publicly readable, an insert-only policy for applicants,
a read policy for signed-in admins, validation on the year and department
values, and a one-application-per-roll-number rule.

---

## Part 3 — Create your admin login

The `/admin` page signs in against Supabase Auth. There is no signup screen —
you create the account by hand, which is what keeps it private.

1. **Authentication → Users → Add user → Create new user**.
2. Enter your email and a strong password. **Tick "Auto Confirm User"** —
   without it the account cannot sign in until it confirms an email.
3. **Authentication → Providers → Email** → turn **off**
   *"Allow new users to sign up"* → Save.

Step 3 is not optional. The read policy grants access to any authenticated
user, so with open signups a stranger could register an account and read every
application. Turning signups off makes the account you just created the only
way in.

**Check.** **Authentication → Users** lists exactly one user, yours.

---

## Part 4 — Set up the confirmation email

Applicants get an email with your WhatsApp community and Instagram links. The
send happens in an Edge Function so it cannot be tampered with from the browser:
the caller passes only a registration id, and the function looks the applicant
up itself.

### 4a. Get a Resend API key

1. Sign up at [resend.com](https://resend.com) — free tier is 3,000 emails/month.
2. **API Keys → Create API Key** → copy the `re_...` value.

> **While testing, sign up with the address you want the test mail sent to.**
> Until you verify a domain, Resend sends from the shared `onboarding@resend.dev`
> sandbox, which only delivers to the address that owns the Resend account.
> Mail to anyone else is accepted by the API and silently dropped.

### 4b. Deploy the Edge Function

1. **Edge Functions → Deploy a new function → Via Editor**.
2. Name it **exactly** `send-confirmation-email`. The name is the URL; a typo
   here fails silently later.
3. Delete the boilerplate, paste the entire contents of
   [`supabase/functions/send-confirmation-email/index.ts`](supabase/functions/send-confirmation-email/index.ts).
4. Leave **Verify JWT enabled**. Disabling it lets anyone who finds the URL
   drain your Resend quota.
5. **Deploy**.

### 4c. Add the secrets

**Edge Functions → Secrets → Add new secret**, three times:

| Name | Value | If missing |
|---|---|---|
| `RESEND_API_KEY` | your `re_...` key | Function refuses to send |
| `WHATSAPP_COMMUNITY_URL` | your real invite link | Function refuses to send |
| `INSTAGRAM_URL` | `https://instagram.com/lead_tiet` | Defaults to this anyway |

Do **not** add `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` — those are
injected automatically.

The WhatsApp link must be a real invite. The function deliberately refuses to
send rather than mail applicants a dead link.

**Check.** The Secrets page lists all three names (values stay hidden).

### 4d. Turn on the automatic trigger

This is the piece that makes it automatic rather than dependent on the
applicant's browser staying open.

1. **Database → Webhooks** → **Enable webhooks** if prompted.
2. **Create a new hook**:
   - Name: `send_recruitment_email`
   - Table: `registrations`, Schema: `public`
   - Events: **Insert** only
   - Type: **Supabase Edge Functions**
   - Function: `send-confirmation-email`
   - Method: `POST`
3. Create.

> **Use this dashboard screen, not hand-written SQL.** A `pg_net` trigger with
> the key pasted into a SQL literal is how the previous setup failed — the
> gateway kept rejecting it with `INVALID_JWT_FORMAT`. The dashboard builds the
> authorization header itself and avoids that entire class of problem.

**Check.** **Database → Webhooks** lists the hook as enabled.

### How delivery actually works

Two independent paths call the function, so a failure in one does not lose the
email:

1. **The webhook** fires inside Supabase the moment the row is inserted.
2. **The browser** also calls the function right after a successful submit,
   as a fallback.

Both are safe because the function atomically claims each row by stamping
`email_sent_at`. Whichever call arrives second sees the claim and stops, so
**nobody ever receives two emails**. If sending fails, the claim is released and
`email_error` records why, so it can be retried.

---

## Part 5 — Point the website at the project

### Locally

Create a file named `.env` in the repo root (it is gitignored — never commit it):

```
VITE_SUPABASE_URL=<PROJECT_URL>
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
```

Then:

```bash
npm install
npm run dev
```

### On Vercel

**Settings → Environment Variables**, add the same two names and values, for
Production, Preview and Development. Then **redeploy**.

> Redeploying is required, not optional. Vite bakes `VITE_*` variables into the
> bundle at build time, so an existing deployment will not pick them up.

### The WhatsApp link in the app

`src/config/community.js` ships with a placeholder invite code. The success
screen hides the join button until you replace it, so applicants never see a
dead link — but they also never get the invite. Replace it, commit, push.

---

## Part 6 — Test end to end

1. Open the deployed site and fill in the form. In **Thapar Email**, use the
   address that owns your Resend account — the form does not enforce the
   `@thapar.edu` domain, so a Gmail address is fine for testing.
2. Submit. The success screen should appear.
3. In the **SQL Editor**:

```sql
select email, created_at, email_sent_at, email_error
from public.registrations
order by created_at desc limit 3;
```

| What you see | Meaning |
|---|---|
| `email_sent_at` set, `email_error` null | Sent. Check inbox **and spam** |
| `email_error` has text | Read it — it names the exact cause |
| both null | The function was never reached; see below |

4. Sign in at `/admin` with the account from Part 3. Your test application
   should be listed.

---

## Troubleshooting

**Both `email_sent_at` and `email_error` are null.** The function was never
reached. Check **Edge Functions → send-confirmation-email → Logs**. No log
entries at all means the webhook is not firing — re-check Part 4d, and confirm
the function name is exactly `send-confirmation-email`.

**`email_error` mentions `RESEND_API_KEY` or `WHATSAPP_COMMUNITY_URL`.** The
secret is missing or still a placeholder. Fix it in Part 4c; secrets are read
per call, so no redeploy is needed.

**No email despite `email_sent_at` being set.** Resend accepted it but did not
deliver. Almost always the sandbox rule: with `onboarding@resend.dev`, only the
Resend account owner's address receives mail. Check Resend's own dashboard
under **Emails** for the delivery status. To reach real `@thapar.edu`
applicants, verify a domain in Resend and add a `FROM_EMAIL` secret such as
`LEAD Society <noreply@yourdomain.com>`.

**Form submission fails with a duplicate key error.** The schema enforces one
application per roll number and per email. That is intended. To let someone
resubmit, delete their row first.

**`/admin` signs in but shows no applications.** The read policy is missing —
re-run `supabase/schema.sql`.

**A `check constraint ... is violated by some row` error when running the
schema.** Only happens on a database that already holds applications with old
department names. On a fresh project it cannot occur. If you hit it on an
existing project, add `not valid` to the end of the constraint so it applies to
new rows only and leaves existing applications untouched.

---

## Quick reference

| Thing | Where |
|---|---|
| Applications table | Dashboard → Table Editor → `registrations` |
| Admin console | `/admin` on your site |
| Email delivery log | Resend dashboard → Emails |
| Function logs | Edge Functions → send-confirmation-email → Logs |
| Schema | [`supabase/schema.sql`](supabase/schema.sql) |
| Email template & logic | [`supabase/functions/send-confirmation-email/index.ts`](supabase/functions/send-confirmation-email/index.ts) |
| WhatsApp / Instagram links | [`src/config/community.js`](src/config/community.js) |

### Never commit or paste into chat

- The `service_role` key
- Your `RESEND_API_KEY`
- The database password
- The `.env` file

The `anon` key is safe to expose — it is meant for the browser, and Row Level
Security is what actually protects the data.
