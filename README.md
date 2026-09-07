<div align="center">
  <img src="./src/assets/LEAD.png" alt="LEAD Logo" width="150"/>
  <h1>LEAD Recruitment 2026–27</h1>
  <p><strong>Learn · Emerge · Aspire · Discover</strong></p>
  <p>Recruitment portal for LEAD Society, Thapar Institute of Engineering and Technology, Patiala.</p>
</div>

---

## What this is

A standalone recruitment site — the application form and an admin console for
reviewing what comes in. Nothing else.

| Route | Page |
|---|---|
| `/` | The recruitment form |
| `/admin` | Admin console — sign in to read, search and export applications |
| anything else | Redirects to `/` |

**Applicants** fill in one form: personal details, year of study, department
preferences, and written answers. On submit the application is saved to
Supabase and a confirmation email goes out with the WhatsApp community and
Instagram links.

**Admins** sign in at `/admin` with a Supabase Auth account and get every
application newest-first, with search across all fields, per-row expansion, and
CSV export.

## Setting it up

**[→ SETUP.md](SETUP.md)** — the full walkthrough, from a blank Supabase project
to working confirmation emails. Follow it in order; every part ends with a check.

## Running it locally

```bash
npm install
npm run dev
```

Needs a `.env` in the repo root (gitignored):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Both values come from Supabase → Settings → API. Without them the form loads
but cannot submit.

## Tech

- **React 19** + **Vite** + **React Router 7**
- **Supabase** — Postgres with Row Level Security, Auth, Edge Functions
- **Resend** — transactional email, called from the Edge Function
- Deployed on **Vercel** (`vercel.json` handles the SPA rewrite)

## Layout

```
src/
  sections/Registration/   the form
  sections/Admin/          the admin console
  config/community.js      WhatsApp / Instagram links  ← edit before launch
  lib/supabase.js          shared Supabase client
supabase/
  schema.sql               the whole database, one paste, nothing to fill in
  functions/send-confirmation-email/
                           Edge Function that sends the confirmation email
scripts/check-email.sh     inspect delivery, retry unsent
```

## Before launch

- [ ] Replace the placeholder invite in `src/config/community.js`
- [ ] Run `supabase/schema.sql` on the project
- [ ] Create the admin user and **turn off open signups** (SETUP.md, Part 3)
- [ ] Verify a sending domain in Resend — the sandbox sender only delivers to
      your own address, not to `@thapar.edu` applicants
- [ ] Set the two `VITE_` variables in Vercel and redeploy

## Contact

- **Email**: [lead_sc@thapar.edu](mailto:lead_sc@thapar.edu)
- **Instagram**: [@lead_tiet](https://instagram.com/lead_tiet)
