#!/usr/bin/env bash
# One-shot Cloudflare provisioning + deploy for the Sorcery API.
# Requires: CLOUDFLARE_API_TOKEN (or `npx wrangler login`), Node 20+.
set -euo pipefail

cd "$(dirname "$0")/../worker"

echo "▸ Checking wrangler auth…"
npx wrangler whoami >/dev/null

need_value() { # file, pattern-replacement
  local file="$1" search="$2" replace="$3"
  sed -i.bak "s|${search}|${replace}|" "$file" && rm -f "$file.bak"
}

echo "▸ Creating D1 database 'ai_sms_sorcery' (skips if it exists)…"
D1_OUT=$(npx wrangler d1 create ai_sms_sorcery 2>&1 || true)
D1_ID=$(echo "$D1_OUT" | grep -oE 'database_id = "[^"]+"' | head -1 | cut -d'"' -f2 || true)
if [ -n "${D1_ID:-}" ]; then
  need_value wrangler.toml "REPLACE_WITH_D1_DATABASE_ID" "$D1_ID"
  echo "  D1 id: $D1_ID"
else
  echo "  (database already exists — make sure wrangler.toml has the right database_id)"
fi

echo "▸ Creating KV namespace 'KV'…"
KV_OUT=$(npx wrangler kv namespace create KV 2>&1 || true)
KV_ID=$(echo "$KV_OUT" | grep -oE 'id = "[^"]+"' | head -1 | cut -d'"' -f2 || true)
if [ -n "${KV_ID:-}" ]; then
  need_value wrangler.toml "REPLACE_WITH_KV_NAMESPACE_ID" "$KV_ID"
  echo "  KV id: $KV_ID"
else
  echo "  (namespace already exists — make sure wrangler.toml has the right id)"
fi

echo "▸ Creating queues…"
npx wrangler queues create sms-dispatch      2>/dev/null || echo "  sms-dispatch exists"
npx wrangler queues create sms-dispatch-dlq  2>/dev/null || echo "  sms-dispatch-dlq exists"

echo "▸ Applying D1 migrations (remote)…"
npx wrangler d1 migrations apply ai_sms_sorcery --remote

echo "▸ Setting CREDENTIALS_ENCRYPTION_KEY secret…"
if [ -z "${CREDENTIALS_ENCRYPTION_KEY:-}" ]; then
  CREDENTIALS_ENCRYPTION_KEY=$(openssl rand -base64 32)
  echo "  (generated a new key — store it safely: $CREDENTIALS_ENCRYPTION_KEY)"
fi
printf '%s' "$CREDENTIALS_ENCRYPTION_KEY" | npx wrangler secret put CREDENTIALS_ENCRYPTION_KEY

if [ -n "${WEBHOOK_SIGNING_SECRET:-}" ]; then
  echo "▸ Setting WEBHOOK_SIGNING_SECRET…"
  printf '%s' "$WEBHOOK_SIGNING_SECRET" | npx wrangler secret put WEBHOOK_SIGNING_SECRET
fi

echo "▸ Deploying worker…"
npx wrangler deploy

echo ""
echo "✔ Done. Next:"
echo "  1. copy the workers.dev URL from the output above"
echo "  2. put it into vercel.json's /api rewrite"
echo "  3. curl <worker-url>/api/health to verify"
