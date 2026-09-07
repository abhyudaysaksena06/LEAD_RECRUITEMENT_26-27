#!/usr/bin/env bash
# Shows confirmation-email delivery status, and can retry failures.
#
#   ./scripts/check-email.sh            # recent registrations and their status
#   ./scripts/check-email.sh retry      # re-send every failed / unsent one
#
# Needs, in the environment or entered when prompted:
#   PROJECT_REF               your Supabase project ref
#   SUPABASE_SERVICE_ROLE_KEY Settings -> API -> service_role  (keep secret)

set -euo pipefail
cd "$(dirname "$0")/.."

MODE=${1:-status}
say() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
die() { printf '\033[1;31mx  %s\033[0m\n' "$1" >&2; exit 1; }

command -v curl >/dev/null || die "curl not found."
command -v python3 >/dev/null || die "python3 not found (used to format JSON)."

if [ -z "${PROJECT_REF:-}" ]; then
  read -r -p "   Supabase project ref: " PROJECT_REF
fi
if [ -z "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  read -r -s -p "   Supabase service_role key: " SUPABASE_SERVICE_ROLE_KEY; echo
fi
[ -n "$PROJECT_REF" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ] || die "Both values are required."

BASE="https://${PROJECT_REF}.supabase.co"
api() {
  curl -sS -X "$1" "${BASE}/rest/v1/$2" \
    -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    "${@:3}"
}

case "$MODE" in
  status)
    say "Recent registrations"
    api GET "registrations?select=email,created_at,email_sent_at,email_error&order=created_at.desc&limit=20" \
      | python3 -c '
import json, sys
rows = json.load(sys.stdin)
if not isinstance(rows, list):
    print(rows); sys.exit(1)
if not rows:
    print("   No registrations yet.")
    sys.exit()
sent = sum(1 for r in rows if r.get("email_sent_at"))
failed = [r for r in rows if r.get("email_error")]
for r in rows:
    mark = "OK  " if r.get("email_sent_at") else ("FAIL" if r.get("email_error") else "wait")
    print(f'\''   [{mark}] {r["email"]:<38} {r.get("email_sent_at") or ""}'\'')
print(f"\n   {sent}/{len(rows)} mailed, {len(failed)} with a recorded error.")
if failed:
    print("   Last error:", str(failed[0]["email_error"])[:200])
    print("   Re-send them with: ./scripts/check-email.sh retry")
'
    ;;

  retry)
    say "Clearing claims on unsent registrations"
    # Only rows that never went out: email_sent_at is null. A recorded error
    # already released its claim, so this is the full retry set.
    ids=$(api GET "registrations?select=id,email&email_sent_at=is.null" \
          | python3 -c 'import json,sys; [print(r["id"], r["email"]) for r in json.load(sys.stdin)]')
    if [ -z "$ids" ]; then
      echo "   Nothing to retry - every registration has been mailed."
      exit 0
    fi
    count=$(printf '%s\n' "$ids" | wc -l | tr -d ' ')
    echo "   $count to re-send."
    printf '%s\n' "$ids" | while read -r id email; do
      resp=$(curl -sS -X POST "${BASE}/functions/v1/send-confirmation-email" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"id\":\"${id}\"}")
      case "$resp" in
        *'"success":true'*) printf '   sent    %s\n' "$email" ;;
        *)                  printf '   FAILED  %s  %s\n' "$email" "$resp" ;;
      esac
      # Resend's free tier allows 100/day, 2 requests/second.
      sleep 1
    done
    ;;

  *) die "Unknown mode '$MODE'. Use 'status' or 'retry'." ;;
esac
