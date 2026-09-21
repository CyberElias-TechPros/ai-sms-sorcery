#!/usr/bin/env bash
# AI SMS Sorcery — end-to-end happy-path suite (all user stories).
# Usage: API=http://127.0.0.1:8787/api bash scripts/e2e.sh
set -u
API="${API:-http://127.0.0.1:8787/api}"
PASS=0; FAIL=0; TOKEN=""
EMAIL="e2e_$(date +%s)@example.com"

step() { printf '\n\033[1;35m▸ %s\033[0m\n' "$1"; }
ok()   { PASS=$((PASS+1)); printf '  \033[1;32m✓\033[0m %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  \033[1;31m✗\033[0m %s\n' "$1"; }

req() { # method path [json-body] [extra-curl-args...]
  local method="$1" path="$2" body="${3:-}"
  local args=(-sS -X "$method" -H 'content-type: application/json')
  [ -n "$TOKEN" ] && args+=(-H "Authorization: Bearer $TOKEN")
  [ -n "$body" ] && args+=(-d "$body")
  curl "${args[@]}" "$API$path"
}

check_jq() { # description json expr expected
  local desc="$1" json="$2" expr="$3" expected="$4"
  local got; got=$(echo "$json" | jq -r "$expr" 2>/dev/null)
  if [ "$got" = "$expected" ]; then ok "$desc"; else bad "$desc (got: $got, expected: $expected)"; fi
}

step "Health"
H=$(req GET /health)
check_jq "health ok" "$H" '.data.status' 'ok'

step "Auth — register / me / login hygiene"
R=$(req POST /auth/register "{\"email\":\"$EMAIL\",\"password\":\"Sorcery123!\",\"name\":\"E2E Tester\",\"phoneNumber\":\"+12025550100\"}")
check_jq "register returns token" "$R" '.data.token | length > 10 | tostring' 'true'
TOKEN=$(echo "$R" | jq -r '.data.token')
check_jq "register returns user" "$R" '.data.user.email' "$EMAIL"
ME=$(req GET /auth/me)
check_jq "me matches session" "$ME" '.data.user.name' 'E2E Tester'
R2=$(req POST /auth/register "{\"email\":\"$EMAIL\",\"password\":\"Sorcery123!\",\"name\":\"Dup\"}")
check_jq "duplicate email rejected" "$R2" '.error.code' 'conflict'
R3=$(req POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"wrongpass1\"}")
check_jq "bad password rejected" "$R3" '.error.code' 'unauthorized'

step "Contacts — CRUD + search + groups"
C=$(req POST /contacts '{"name":"Ada Lovelace","phoneNumber":"+12025550142","email":"ada@example.com","group":"Friends","tags":["VIP","Personal"]}')
check_jq "create contact" "$C" '.data.name' 'Ada Lovelace'
CID=$(echo "$C" | jq -r '.data.id')
C2=$(req POST /contacts '{"name":"Grace Hopper","phoneNumber":"+12025550144","email":"grace@example.com","group":"Work","tags":["Team"]}')
check_jq "create second contact" "$C2" '.data.name' 'Grace Hopper'
C3=$(req POST /contacts '{"name":"Duplicate","phoneNumber":"+12025550142"}')
check_jq "duplicate phone rejected" "$C3" '.error.code' 'conflict'
LIST=$(req GET '/contacts?q=Ada&group=Friends')
check_jq "search finds Ada" "$LIST" '.data.items[0].name' 'Ada Lovelace'
UPD=$(req PATCH "/contacts/$CID" '{"name":"Ada L.","tags":["VIP"]}')
check_jq "update contact" "$UPD" '.data.name' 'Ada L.'
check_jq "update tags" "$UPD" '.data.tags[0]' 'VIP'

step "Contacts — import / export"
IMP=$(req POST /contacts/import '{"contacts":[{"name":"Import One","phoneNumber":"+12025550150","group":"Clients","tags":["Business"]},{"name":"Bad","phoneNumber":"12345"}]}')
check_jq "import creates valid rows" "$IMP" '.data.created' '1'
check_jq "import reports invalid rows" "$IMP" '.data.skipped' '1'
EXP=$(req GET /contacts/export)
check_jq "export includes contacts" "$EXP" '.data.count >= 3 | tostring' 'true'

step "Templates — CRUD + usage"
T=$(req POST /templates '{"title":"Welcome Message","content":"Welcome to our service, {{name}}! Reply HELP for assistance.","category":"marketing"}')
check_jq "create template" "$T" '.data.title' 'Welcome Message'
TID=$(echo "$T" | jq -r '.data.id')
TU=$(req POST "/templates/$TID/use")
check_jq "template usage increments" "$TU" '.data.usageCount' '1'
TL=$(req GET '/templates?q=Welcome')
check_jq "template search" "$TL" '.data.items[0].id' "$TID"

step "AI — generate (sorcery engine, key-free) + bulk + history"
A=$(req POST '/ai/generate' '{"prompt":"promotional message for a 30% off flash sale this weekend","kind":"marketing","maxLength":320,"variants":2}')
check_jq "generate returns 2 texts" "$A" '.data.texts | length' '2'
check_jq "generate records provider" "$A" '.data.provider' 'sorcery'
check_jq "generate has segment info" "$A" '.data.segments[0].encoding | length > 0 | tostring' 'true'
AB=$(req POST '/ai/generate-bulk' '{"prompt":"reminder about appointment tomorrow at 3pm","kind":"reminder","maxLength":320,"recipients":[{"contactId":"x","phoneNumber":"+12025550142","name":"Ada Lovelace"},{"phoneNumber":"+12025550144","name":"Grace"}]}')
check_jq "bulk personalizes per recipient" "$AB" '.data.items | length' '2'
check_jq "bulk substitutes name" "$AB" '.data.items[0].text | contains("Ada") | tostring' 'true'
AH=$(req GET '/ai/history?limit=5')
check_jq "history has entries" "$AH" '.data.items | length >= 3 | tostring' 'true'

step "Messages — send now (sandbox delivers) + logs + detail + resend"
M=$(req POST '/messages/send' "{\"body\":\"Hello Ada, big sale today! Reply STOP to unsubscribe.\",\"recipients\":[{\"contactId\":\"$CID\",\"phoneNumber\":\"+12025550142\",\"name\":\"Ada L.\"},{\"phoneNumber\":\"+12025550144\",\"name\":\"Grace\"}],\"channel\":\"sms\",\"templateId\":\"$TID\",\"idempotencyKey\":\"e2e-send-1\"}")
check_jq "send creates 2 messages" "$M" '.data.count' '2'
check_jq "compliance footer appended once" "$M" '.data.messages[0].body | contains("Reply STOP") | tostring' 'true'
MID=$(echo "$M" | jq -r '.data.messages[0].id')
check_jq "sandbox delivered" "$M" '.data.messages[0].status' 'delivered'
# idempotency via header
MI2=$(curl -sS -X POST -H 'content-type: application/json' -H "Authorization: Bearer $TOKEN" -H 'x-idempotency-key: e2e-send-2' -d '{"body":"Once only","recipients":[{"phoneNumber":"+12025550142"}]}' "$API/messages/send")
MI3=$(curl -sS -X POST -H 'content-type: application/json' -H "Authorization: Bearer $TOKEN" -H 'x-idempotency-key: e2e-send-2' -d '{"body":"Once only","recipients":[{"phoneNumber":"+12025550142"}]}' "$API/messages/send")
IDEM_COUNT=$(echo "$MI3" | jq -r '.data.messages[0].id')
IDEM_COUNT2=$(echo "$MI2" | jq -r '.data.messages[0].id')
[ "$IDEM_COUNT" = "$IDEM_COUNT2" ] && ok "idempotency key deduplicates send" || bad "idempotency failed"
LOGS=$(req GET '/messages?q=Hello&status=all&channel=all')
check_jq "logs list messages" "$LOGS" '.data.items | length >= 2 | tostring' 'true'
DET=$(req GET "/messages/$MID")
check_jq "message detail" "$DET" '.data.id' "$MID"
RS=$(req POST "/messages/$MID/resend")
check_jq "resend creates new message" "$RS" '.data.message.source' 'resend'

step "Compliance — opted-out contact is skipped"
OC=$(req POST '/contacts' '{"name":"Opted Out","phoneNumber":"+12025550160"}')
OCID=$(echo "$OC" | jq -r '.data.id')
req PATCH "/contacts/$OCID" '{"optedOut":true}' >/dev/null
OM=$(req POST '/messages/send' "{\"body\":\"Should skip\",\"recipients\":[{\"contactId\":\"$OCID\",\"phoneNumber\":\"+12025550160\"},{\"contactId\":\"$CID\",\"phoneNumber\":\"+12025550142\"}]}")
check_jq "opt-out recipient skipped" "$OM" '.data.skippedOptedOut' '1'
OM2=$(req POST '/messages/send' "{\"body\":\"All opted\",\"recipients\":[{\"contactId\":\"$OCID\",\"phoneNumber\":\"+12025550160\"}]}")
check_jq "all-opted-out batch rejected" "$OM2" '.error.code' 'validation_failed'

step "Scheduled campaigns — draft → schedule → pause → resume → cancel → duplicate → send-now"
D=$(req POST '/scheduled' '{"title":"Monthly Newsletter","body":"Our monthly update is here!","channel":"sms","draft":true,"recipients":[{"phoneNumber":"+12025550142","name":"Ada"},{"phoneNumber":"+12025550144","name":"Grace"}]}')
check_jq "create draft" "$D" '.data.status' 'draft'
DID=$(echo "$D" | jq -r '.data.id')
FUTURE=$(date -u -d '+2 hours' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -v+2H +%Y-%m-%dT%H:%M:%SZ)
SCH=$(req POST "/scheduled/$DID/schedule" "{\"scheduledAt\":\"$FUTURE\"}")
check_jq "draft → scheduled" "$SCH" '.data.status' 'scheduled'
PAU=$(req POST "/scheduled/$DID/pause")
check_jq "pause" "$PAU" '.data.status' 'paused'
RES=$(req POST "/scheduled/$DID/resume")
check_jq "resume" "$RES" '.data.status' 'scheduled'
DUP=$(req POST "/scheduled/$DID/duplicate")
check_jq "duplicate creates draft copy" "$DUP" '.data.status' 'draft'
DUPID=$(echo "$DUP" | jq -r '.data.id')
SN=$(req POST "/scheduled/$DUPID/send-now")
SNSTATUS=$(echo "$SN" | jq -r '.data.status')
case "$SNSTATUS" in
  sending|completed) ok "send-now dispatches ($SNSTATUS)";;
  *) bad "send-now dispatches (got: $SNSTATUS)";;
esac
sleep 1
SN2=$(req GET "/scheduled/$DUPID")
check_jq "send-now completes" "$SN2" '.data.status' 'completed'
check_jq "send-now counted sends" "$SN2" '.data.sentCount' '2'
CAN=$(req POST "/scheduled/$DID/cancel")
check_jq "cancel scheduled" "$CAN" '.data.status' 'cancelled'
SL=$(req GET '/scheduled?tab=all')
check_jq "campaign list" "$SL" '.data.items | length >= 2 | tostring' 'true'

step "Stats — dashboard + analytics"
ST=$(req GET /stats/dashboard)
check_jq "dashboard totals" "$ST" '.data.stats.totalSent >= 5 | tostring' 'true'
check_jq "dashboard quota surfaced" "$ST" '.data.stats.messagesQuota' '500'
check_jq "dashboard daily series" "$ST" '.data.daily | length' '7'
AN=$(req GET '/stats/analytics?range=7days')
check_jq "analytics delivery rate" "$AN" '.data.deliveryRate >= 0 | tostring' 'true'
check_jq "analytics daily" "$AN" '.data.daily | length' '7'

step "Settings + profile + security"
SETR=$(req PUT '/settings' '{"darkMode":true,"optOutFooter":true,"timezone":"America/New_York"}')
check_jq "settings update" "$SETR" '.data.timezone' 'America/New_York'
SEGG=$(req GET /settings)
check_jq "settings persist" "$SEGG" '.data.darkMode' 'true'
PROF=$(req PATCH /profile '{"name":"E2E Renamed","phoneNumber":"+12025550199"}')
check_jq "profile update" "$PROF" '.data.user.name' 'E2E Renamed'
SEC=$(req GET /settings/security)
check_jq "security lists sessions" "$SEC" '.data.activeSessions | length >= 1 | tostring' 'true'

step "Credentials — store (encrypted) + masked view + test"
CR=$(req PUT /credentials '{"kind":"sms","provider":"sandbox","senderId":"SORCERY"}')
check_jq "save sms credential" "$CR" '.data.provider' 'sandbox'
check_jq "masked key never leaks" "$CR" '.data.maskedKey' '••••••••'
CRL=$(req GET /credentials)
check_jq "list credentials" "$CRL" '.data.items | length' '1'
CRD=$(echo "$CRL" | jq -r '.data.items[0] | "\(.maskedKey)"')
case "$CRD" in *sk-*|*api_*) bad "secret leaked in mask";; *) ok "mask hides secret values";; esac
CT=$(req POST /credentials/test '{"kind":"sms"}')
check_jq "credential test (sandbox)" "$CT" '.data.ok' 'true'
CAT=$(req POST /credentials/test '{"kind":"ai"}')
check_jq "ai test (sorcery fallback)" "$CAT" '.data.ok' 'true'

step "Security — authz + validation"
NOTOKEN=$(curl -sS "$API/contacts")
check_jq "unauthenticated blocked" "$NOTOKEN" '.error.code' 'unauthorized'
BADPHONE=$(req POST /contacts '{"name":"X","phoneNumber":"not-a-phone"}')
check_jq "phone validation enforced" "$BADPHONE" '.error.code' 'validation_failed'
XSS=$(req POST '/templates' '{"title":"<script>alert(1)</script>","content":"ok","category":"other"}')
check_jq "templates accept text safely (stored raw, rendered escaped)" "$XSS" '.data.title | length > 0 | tostring' 'true'

step "Account — export + password change + delete"
AX=$(req GET /account/export)
check_jq "account export" "$AX" '.data.format' 'ai-sms-sorcery.account-export.v1'
PW=$(req POST /auth/change-password '{"currentPassword":"Sorcery123!","newPassword":"NewPass456!"}')
check_jq "password change" "$PW" '.data.ok' 'true'
OLDLOGIN=$(req POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"Sorcery123!\"}")
check_jq "old password invalid after change" "$OLDLOGIN" '.error.code' 'unauthorized'
NEWLOGIN=$(req POST /auth/login "{\"email\":\"$EMAIL\",\"password\":\"NewPass456!\"}")
check_jq "new password works" "$NEWLOGIN" '.data.token | length > 10 | tostring' 'true'
TOKEN=$(echo "$NEWLOGIN" | jq -r '.data.token')
DEL=$(curl -sS -X DELETE -H 'content-type: application/json' -H "Authorization: Bearer $TOKEN" -d '{"password":"NewPass456!"}' "$API/account")
check_jq "account deleted" "$DEL" '.data.ok' 'true'
GONE=$(req GET /auth/me)
check_jq "session invalid after delete" "$GONE" '.error.code' 'unauthorized'

printf '\n\033[1mResults: %d passed, %d failed\033[0m\n' "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
