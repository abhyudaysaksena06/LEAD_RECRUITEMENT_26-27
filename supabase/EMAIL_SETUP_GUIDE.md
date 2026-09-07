# Bulletproof Confirmation Email Setup Guide

This system ensures that **100% of candidates receive an automated confirmation email** with your **WhatsApp Community** and **Instagram** links, without relying on fragile client-side scripts.

---

## Architecture Overview

```
Candidate submits form
        │
        ▼
Saved into Supabase (public.registrations)
        │
        ├──► (1) Instant on-screen "Join WhatsApp Community" button displays immediately
        │
        ├──► (2) Supabase Database Webhook fires automatically in the cloud
        │              │
        └──► (3) Client also invokes the function as a fallback
                       │
                       ▼
            Edge Function (send-confirmation-email)
                       │
                       ▼
            Atomically claims the row (email_sent_at IS NULL -> now()).
            Loses the race? Stop -- the email was already sent.
                       │
                       ▼
            Re-reads the applicant from the database (service role),
            escapes every value, renders the template
                       │
                       ▼
            Resend API dispatches email to candidate's Thapar email address
```

Paths (2) and (3) both run on every submission, and the claim on `email_sent_at`
guarantees **exactly one** email per registration. If delivery fails, the claim
is released and `email_error` records why, so the next attempt can retry.

The function accepts only a registration **id** — never a name or an email
address — and loads the applicant's details from the database itself. A caller
cannot choose the recipient or inject content into the message.

> **Prerequisite:** run `supabase/registrations.sql` first. It creates the
> `email_sent_at` and `email_error` columns this design depends on.

---

## Quick start (scripted)

Steps 2-4 below are automated. Do Step 1 by hand (it needs a browser), then:

```bash
./scripts/setup-email.sh
```

It prompts for your project ref, anon key, Resend key and WhatsApp invite,
then links the project, sets the secrets, deploys the function, and writes a
filled-in `supabase/webhook.generated.sql` for you to run in the SQL Editor.
Re-running it is safe.

Afterwards, check delivery any time:

```bash
./scripts/check-email.sh          # who has been mailed, and any errors
./scripts/check-email.sh retry    # re-send everything still unsent
```

The rest of this guide explains what those steps do, and how to do them by
hand if you would rather.

---

## Step 1: Get Free Resend API Key (Takes 1 Minute)
1. Go to [resend.com](https://resend.com) and create a free account (includes **3,000 free emails/month**, 100/day).
2. Go to **API Keys** in the sidebar and click **Create API Key**.
3. Copy the key (starts with `re_...`).

---

## Step 2: Deploy Edge Function to Supabase

### Option A: Using Supabase CLI (Recommended)
From your project terminal:
```bash
# Login to Supabase CLI
npx supabase login

# Link your project (find project-ref in your Supabase project URL: app.supabase.com/project/<project-ref>)
npx supabase link --project-ref <your-project-ref>

# Set your secrets
npx supabase secrets set RESEND_API_KEY=re_your_api_key_here
npx supabase secrets set WHATSAPP_COMMUNITY_URL="https://chat.whatsapp.com/YOUR_COMMUNITY_LINK"
npx supabase secrets set INSTAGRAM_URL="https://instagram.com/lead_tiet"

# Deploy the function (JWT verification stays ON -- see the note below)
npx supabase functions deploy send-confirmation-email
```

> **Do not deploy with `--no-verify-jwt`.** That makes the function callable by
> anyone who finds its URL, letting them burn your Resend quota. With JWT
> verification on, the browser client authenticates with the anon key
> automatically, and the database webhook is configured with an
> `Authorization` header in Step 3.

### Option B: Using Supabase Dashboard Web Interface
1. In your Supabase project dashboard, navigate to **Edge Functions**.
2. Click **Create Function**, name it `send-confirmation-email`.
3. Paste the contents of `supabase/functions/send-confirmation-email/index.ts`.
4. Under **Edge Function Settings / Secrets**, add:
   - `RESEND_API_KEY` = your Resend API key
   - `WHATSAPP_COMMUNITY_URL` = your WhatsApp invite link
   - `INSTAGRAM_URL` = your Instagram link

---

## Step 3: Trigger Email Automatically on Form Submission (Database Webhook)

1. In the Supabase Dashboard, go to **Database** -> **Webhooks** (or **Integrations** -> **Webhooks**).
2. Click **Create a new Webhook**:
   - **Name**: `send_recruitment_email`
   - **Table**: `public.registrations`
   - **Events**: Check `Insert` only.
   - **Webhook Type**: Select `Supabase Edge Functions`.
   - **Edge Function**: Select `send-confirmation-email`.
   - **HTTP Method**: `POST`.
   - **HTTP Headers**: add `Authorization` = `Bearer <your project's anon key>`
     so the call passes JWT verification.
3. Click **Save**.

That's it! Every time a candidate submits the form, Supabase will automatically send the email in the background.

---

## Step 4: Updating WhatsApp & Instagram Links

You can change your WhatsApp and Instagram links in two places:
1. **For the website UI**: In `src/config/community.js`
2. **For the automated email**: Set the `WHATSAPP_COMMUNITY_URL` secret.

Both have a guard against shipping the placeholder link:

- The Edge Function **refuses to send** (HTTP 500, logged) while
  `WHATSAPP_COMMUNITY_URL` is unset or still contains
  `YOUR_COMMUNITY_INVITE_CODE`. Nothing is claimed, so once you set the secret
  the pending registrations can be retried.
- The success screen **hides** the join button until
  `whatsappCommunityUrl` in `src/config/community.js` is a real invite.

---

## Troubleshooting

| Symptom | Where to look |
|---|---|
| No emails at all | Function logs. A config error names the missing secret. |
| `email_error` is set on a row | The Resend response is recorded there verbatim. |
| Want to re-send to one applicant | Set that row's `email_sent_at` back to `NULL`, then re-invoke the function with `{ "id": "<row id>" }`. |
| Which applicants were mailed | `select email, email_sent_at, email_error from registrations;` |
