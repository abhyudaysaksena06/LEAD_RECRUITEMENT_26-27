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
        └──► (2) Supabase Database Webhook fires automatically in the cloud
                    │
                    ▼
            Edge Function (send-confirmation-email)
                    │
                    ▼
            Resend API dispatches email to candidate's Thapar email address
```

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

# Deploy the function
npx supabase functions deploy send-confirmation-email --no-verify-jwt
```

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
3. Click **Save**.

That's it! Every time a candidate submits the form, Supabase will automatically send the email in the background.

---

## Step 4: Updating WhatsApp & Instagram Links

You can change your WhatsApp and Instagram links in two places:
1. **For the website UI**: In `src/config/community.js`
2. **For the automated email**: Set the `WHATSAPP_COMMUNITY_URL` secret or edit `supabase/functions/send-confirmation-email/index.ts`.
