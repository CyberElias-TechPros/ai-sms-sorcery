# Sorcery — Divine AI Messaging for SMS & WhatsApp

**Sorcery** is a production-grade AI messaging studio: generate on-brand SMS & WhatsApp copy
in seconds, manage contacts and templates, schedule campaigns, and track every delivery —
one calm, cinematic workspace.

> **Stack**: React + Vite + Tailwind + shadcn (frontend, deploys to **Vercel**)
> · Cloudflare **Workers + D1 + KV + Queues + Cron** (backend API, deploys to **Cloudflare**)

---

## ✨ What it does

| Area | Capability |
| --- | --- |
| **AI generation** | Single + bulk personalized copy. Bring your own OpenAI / Anthropic / Gemini / Cohere key — or use the built-in **Sorcery engine** (zero keys required). |
| **SMS sending** | Twilio, Vonage, Infobip, Termii or a custom webhook — plus a **Sandbox provider** that simulates the full carrier lifecycle with zero keys. |
| **WhatsApp** | Deep-link send flow per recipient (manual confirmation, anti-spam). |
| **Contacts** | CRUD, groups, tags, notes, search, JSON import/export, **STOP opt-outs honored at send time**. |
| **Templates** | Reusable copy with categories, `{{name}}` variables and usage tracking. |
| **Campaigns** | Draft → schedule → pause → resume → cancel → duplicate → send-now. Dispatched by **cron + queue**. |
| **Message logs** | Live status per message, filters, pagination, detail view, resend, cancel, export. |
| **Analytics** | Delivery rate, volume by channel, category breakdown — computed from real data. |
| **Security** | PBKDF2 passwords (210k), opaque hashed sessions, AES-256-GCM credential vault, rate limiting, idempotent sends, server-side validation everywhere. |

Everything works **end-to-end out of the box** (Sandbox + Sorcery). Real provider keys are
optional upgrades, stored encrypted and never exposed to the client.

---

## 🚀 Quick start (local)

```bash
# 1. Frontend deps
npm install

# 2. Backend (Cloudflare Worker) deps + local database
cd worker && npm install
npx wrangler d1 migrations apply ai_sms_sorcery --local
cp .dev.vars.example .dev.vars   # then put a generated key inside (see file header)
npm run dev                       # → API on http://127.0.0.1:8787

# 3. Frontend (new terminal)
cd .. && npm run dev              # → app on http://localhost:8080 (proxies /api → :8787)
```

Verify everything:

```bash
API=http://127.0.0.1:8787/api bash scripts/e2e.sh   # 67-check happy-path suite
```

---

## 📦 Deployment

Full guide: **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** — or run the one-shot script:

```bash
export CLOUDFLARE_API_TOKEN=…          # your Cloudflare API token
bash scripts/deploy-cloudflare.sh      # creates D1/KV/Queue, applies migrations, deploys the worker
```

Frontend: push to GitHub → import in Vercel → update `vercel.json`'s `/api` rewrite with your
worker URL. Done.

---

## 🧱 Architecture

```
Vercel (React SPA)  ──/api rewrite──▶  Cloudflare Worker (/api)
                                          ├─ D1    users · contacts · templates · campaigns · messages · credentials
                                          ├─ KV    rate limits · short-lived cache
                                          ├─ Queue sms-dispatch (bulk + retries)
                                          └─ Cron  * * * * *  dispatch due campaigns · reconcile · expire sessions
```

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · API reference: [docs/API.md](docs/API.md)

---

## 🗂️ Project structure

```
├── src/                    # React frontend (pages, components, lib, hooks, providers)
│   ├── lib/api.ts          # typed API client (single data channel)
│   ├── lib/motion.tsx      # reveal / magnetic / parallax motion system
│   └── styles/sorcery.css  # motion + atmosphere (reduced-motion aware)
├── worker/                 # Cloudflare Worker API (zero runtime dependencies)
│   ├── src/                # router · routes · providers (SMS/AI) · dispatch pipeline
│   ├── migrations/         # D1 schema (SQL)
│   └── wrangler.toml       # D1 + KV + Queue + Cron bindings
├── scripts/e2e.sh          # end-to-end happy-path suite (67 checks)
└── docs/                   # architecture · deployment · API reference
```

## 🔐 Environment

See [`.env.example`](.env.example). Secrets (Worker):

| Secret | Purpose |
| --- | --- |
| `CREDENTIALS_ENCRYPTION_KEY` | AES-256-GCM key for the provider credential vault (`openssl rand -base64 32`) |
| `WEBHOOK_SIGNING_SECRET` | optional — Twilio status-callback signature verification |

## 📄 License

MIT — see `LICENSE`.
