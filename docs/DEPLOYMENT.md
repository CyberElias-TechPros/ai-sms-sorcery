# Deployment

Two planes: the **Cloudflare Worker API** and the **Vercel frontend**. Follow the steps in order.

---

## 1 · Cloudflare backend

### Prerequisites

* A Cloudflare account
* An API token with `Workers Scripts:Edit`, `D1:Edit`, `Workers KV:Edit`, `Queues:Edit` permissions
  (or the Global API Key + account email for `wrangler login`)
* Node 20+

### One-shot (recommended)

```bash
export CLOUDFLARE_API_TOKEN=<your token>        # or run `npx wrangler login`
bash scripts/deploy-cloudflare.sh
```

The script:

1. creates the D1 database `ai_sms_sorcery` and applies `worker/migrations/`
2. creates the KV namespace `KV`
3. creates the queue `sms-dispatch` (+ its consumer & DLQ via wrangler.toml)
4. writes the generated IDs into `worker/wrangler.toml`
5. sets the `CREDENTIALS_ENCRYPTION_KEY` secret (generates one if you don't supply it)
6. runs `wrangler deploy`

### Manual (step by step)

```bash
cd worker

# 1) D1
npx wrangler d1 create ai_sms_sorcery
# → copy the `database_id` into wrangler.toml [[d1_databases]]
npx wrangler d1 migrations apply ai_sms_sorcery --remote

# 2) KV
npx wrangler kv namespace create KV
# → copy the `id` into wrangler.toml [[kv_namespaces]]

# 3) Queue (producer + consumer + DLQ are declared in wrangler.toml)
npx wrangler queues create sms-dispatch
npx wrangler queues create sms-dispatch-dlq

# 4) Secrets
npx wrangler secret put CREDENTIALS_ENCRYPTION_KEY    # openssl rand -base64 32
npx wrangler secret put WEBHOOK_SIGNING_SECRET        # optional (Twilio auth token)

# 5) Deploy
npx wrangler deploy
# → note the workers.dev URL, e.g. https://ai-sms-sorcery-api.<subdomain>.workers.dev
```

### Tighten CORS for production

In `wrangler.toml` set:

```toml
[vars]
CORS_ORIGINS = "https://your-app.vercel.app"
```

### Verify

```bash
curl https://ai-sms-sorcery-api.<subdomain>.workers.dev/api/health
API=https://ai-sms-sorcery-api.<subdomain>.workers.dev/api bash ../scripts/e2e.sh
```

---

## 2 · Vercel frontend

1. Push this repository to GitHub.
2. **Vercel → Add New Project → Import** the repo (framework auto-detected: Vite).
3. Edit `vercel.json` and point the `/api` rewrite at your worker URL:

   ```json
   "rewrites": [
     { "source": "/api/:path*", "destination": "https://ai-sms-sorcery-api.<subdomain>.workers.dev/api/:path*" }
   ]
   ```

4. Deploy. Every browser call to `/api/*` is same-origin and proxied to Cloudflare.

Environment variables (optional): none required — the app uses relative `/api` paths.

---

## 3 · Post-deploy checklist

* [ ] `/api/health` returns `{"status":"ok"}`
* [ ] Register a real account, send a sandbox message, watch it land in **Message Logs**
* [ ] Schedule a campaign 2 minutes out — it dispatches at the next cron tick
* [ ] (Optional) add a Twilio/… key in **API Settings → Test Connection**
* [ ] (Optional) add an OpenAI/… key in **API Settings → Test Connection**
* [ ] Point Twilio status callbacks at `/api/webhooks/sms/twilio/:messageId` (optional)

---

## Environments

| Environment | Frontend | Backend |
| --- | --- | --- |
| Development | `npm run dev` (Vite :8080, `/api` proxy) | `cd worker && npm run dev` (miniflare :8787) |
| Preview | Vercel Preview Deployment | `wrangler versions upload` / staging worker |
| Production | Vercel Production | `wrangler deploy` |

Local secrets live in `worker/.dev.vars` (git-ignored) — see `.dev.vars.example`.

## Rollback & recovery

* **Worker**: `npx wrangler rollback` (or redeploy a previous git tag).
* **D1**: migrations are append-only; create a compensating migration rather than editing history.
  Export periodically: `npx wrangler d1 export ai_sms_sorcery --remote --output backup.sql`.
* **Queue backlog**: messages survive deploy; the DLQ `sms-dispatch-dlq` captures poison jobs.
