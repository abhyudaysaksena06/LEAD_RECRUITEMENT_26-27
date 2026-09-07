#!/usr/bin/env bash
# One-shot setup for the automated confirmation email.
#
#   ./scripts/setup-email.sh
#
# Prompts for what it needs, sets the Edge Function secrets, deploys the
# function, and writes a ready-to-run supabase/webhook.generated.sql.
# Safe to re-run: every step is idempotent.

set -euo pipefail
cd "$(dirname "$0")/.."

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33m!  %s\033[0m\n' "$1"; }
die()  { printf '\033[1;31mx  %s\033[0m\n' "$1" >&2; exit 1; }

# Prompt unless the value is already in the environment. $3=secret input.
ask() {
  local var=$1 prompt=$2 secret=${3:-} current=${!1:-}
  if [ -n "$current" ]; then
    printf '   %s: using value from environment\n' "$var"
    return
  fi
  if [ -n "$secret" ]; then
    read -r -s -p "   $prompt: " REPLY_VALUE; echo
  else
    read -r -p "   $prompt: " REPLY_VALUE
  fi
  [ -n "$REPLY_VALUE" ] || die "$var is required."
  printf -v "$var" '%s' "$REPLY_VALUE"
}

command -v npx >/dev/null || die "npx not found. Install Node.js first."

say "Details needed"
echo "   (Press Ctrl-C to abort. Nothing is written until the next step.)"
ask PROJECT_REF           "Supabase project ref (app.supabase.com/project/<THIS>)"
ask ANON_KEY              "Supabase anon key (Settings -> API)" secret
ask RESEND_API_KEY        "Resend API key (starts re_)" secret
ask WHATSAPP_COMMUNITY_URL "WhatsApp community invite URL"
INSTAGRAM_URL=${INSTAGRAM_URL:-https://instagram.com/lead_tiet}
FROM_EMAIL=${FROM_EMAIL:-"LEAD Society <onboarding@resend.dev>"}

case "$RESEND_API_KEY" in
  re_*) ;;
  *) warn "That Resend key does not start with 're_'. Continuing anyway." ;;
esac
case "$WHATSAPP_COMMUNITY_URL" in
  *YOUR_COMMUNITY_INVITE_CODE*|"") die "Use a real WhatsApp invite link, not the placeholder." ;;
esac

say "Linking project"
npx --yes supabase link --project-ref "$PROJECT_REF"

say "Setting Edge Function secrets"
npx --yes supabase secrets set \
  RESEND_API_KEY="$RESEND_API_KEY" \
  WHATSAPP_COMMUNITY_URL="$WHATSAPP_COMMUNITY_URL" \
  INSTAGRAM_URL="$INSTAGRAM_URL" \
  FROM_EMAIL="$FROM_EMAIL"

say "Deploying send-confirmation-email"
# JWT verification stays ON: the function must not be callable by anyone who
# finds its URL. The trigger below authenticates with the anon key.
npx --yes supabase functions deploy send-confirmation-email

say "Generating the database trigger"
sed -e "s|<PROJECT_REF>|$PROJECT_REF|g" \
    -e "s|<ANON_KEY>|$ANON_KEY|g" \
    supabase/webhook.sql > supabase/webhook.generated.sql
echo "   Wrote supabase/webhook.generated.sql (gitignored - contains your anon key)."

cat <<DONE

Two steps left, both in the Supabase SQL Editor
(app.supabase.com/project/$PROJECT_REF/sql):

  1. Run supabase/registrations.sql
     Creates the table plus the email_sent_at / email_error columns.
     Skipping this makes every send fail.

  2. Run supabase/webhook.generated.sql
     Creates the trigger that fires the email automatically.

Then check it end to end:

  ./scripts/check-email.sh          # after submitting the form once yourself

DONE
