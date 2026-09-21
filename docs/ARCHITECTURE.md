# Architecture

## Overview

Sorcery is a two-plane system: a **Vercel-hosted React SPA** and a **Cloudflare Worker API**
backed by D1, KV, Queues and Cron Triggers. The browser only ever calls same-origin `/api/*`
(Vercel rewrite in production, Vite proxy in dev), so there is no CORS surface in the common path.

```
                 USERS
                   │
                   ▼
           ┌──────────────┐
           │    VERCEL    │   React + Vite SPA (static)
           │   FRONTEND   │   /api/* → rewrite to the worker
           └──────┬───────┘
                  │ HTTPS
                  ▼
           ┌──────────────┐
           │  CLOUDFLARE  │   worker/  (zero runtime deps, WebCrypto only)
           │   WORKER API │
           └──────┬───────┘
      ┌───────────┼────────────┬──────────────┐
      ▼           ▼            ▼              ▼
     D1          KV          Queues          Cron
  relational   rate limits   sms-dispatch   every minute:
  data         short cache   bulk + retry   due campaigns ·
                                            stuck messages ·
                                            session expiry
```

## Why these services (and only these)

| Service | Justification |
| --- | --- |
| **Workers** | All API logic is request/response + lightweight outbound HTTP — the canonical Workers use-case. |
| **D1** | Relational integrity (users → contacts/templates/campaigns/messages) with FKs, unique indexes and SQL analytics. |
| **KV** | Distributed rate limiting (login, register, send, AI) — high-write-tolerant, best-effort counters. |
| **Queues** | Bulk/scheduled sends must not block HTTP; retries with backoff for transient provider failures; DLQ for forensics. |
| **Cron** | Dispatch due campaigns every minute, reconcile stuck messages, expire sessions. |
| **R2 / Durable Objects** | **Deliberately unused** — there are no large blobs and no stateful coordination requirements. |

## The dispatch pipeline

```
POST /messages/send ─┐
                     ├─▶ createMessages()      quota + opt-out + compliance + idempotency
POST /scheduled/:id/ │        │
  send-now ──────────┘        ├─ small batch (≤10) ─▶ deliverMessages() inline (instant feedback)
                              └─ larger / scheduled ─▶ SMS_QUEUE ─▶ deliverMessages()
                                                              │
cron (* * * * *) ─▶ dispatchDueCampaign() ─▶ createMessages ──┘
                                                              │
                                       sendSms(provider) ─────┤
                                       sandbox | twilio | vonage | infobip | termii | custom
                                                              │
                                       status update + finalizeCampaign()
                                       (webhooks may refine status later)
```

`deliverMessages()` is the single delivery path shared by inline sends, the queue consumer and
scheduled campaigns — one implementation, three entry points.

## Data model (D1)

```
users ──< sessions
      ──< contacts            (unique (user_id, phone_number))
      ──< templates           (usage_count)
      ──< campaigns           (recipients JSON · status machine)
      ──< messages            (status machine · idempotency_key · provider ids)
      ──< ai_generations      (history)
      ──< credentials         (AES-GCM ciphertext + non-secret meta)
      ──  user_settings       (compliance toggles, appearance)
      ──< audit_log
```

Status machines:

* `messages`: `queued → sending → sent → delivered | failed` (+ `cancelled` pre-send)
* `campaigns`: `draft | scheduled → sending → completed | failed` (+ `paused`, `cancelled`)

## Security model

* **Passwords**: PBKDF2-HMAC-SHA256, 210k iterations, 16-byte salt, constant-time compare.
* **Sessions**: 32-byte opaque bearer tokens; only SHA-256 hashes stored; 30-day sliding expiry;
  revoked on password change / account deletion; "sign out everywhere" supported.
* **Credential vault**: provider keys encrypted with AES-256-GCM (`CREDENTIALS_ENCRYPTION_KEY`);
  API responses only ever return masked views (`sk-••••1234`).
* **AuthZ**: every query is scoped `WHERE user_id = ?` (no IDOR surface).
* **Validation**: all input validated server-side (E.164 phones, ISO dates, enums, limits).
* **Rate limiting**: KV fixed-window per IP (global) and per user (login, register, send, AI).
* **Idempotency**: `X-Idempotency-Key` deduplicates retried sends.
* **Enumeration safety**: identical login errors + dummy hash work for unknown emails.
* **Webhooks**: optional Twilio HMAC signature verification (`WEBHOOK_SIGNING_SECRET`).

## Frontend architecture

* `src/lib/api.ts` — one typed fetch client (envelope handling, 401 → auto-logout).
* `src/hooks/useApi.ts` — React Query hooks for every resource; mutations invalidate queries.
* `src/lib/motion.tsx` + `src/styles/sorcery.css` — CSS-first motion system (reveal, magnetic,
  parallax, aurora, word cascade); every effect disabled under `prefers-reduced-motion`.
* Auth state in a persisted zustand store; server remains the source of truth (`/auth/me` on boot).

## Failure handling

* Transient provider errors (network/429/5xx) → message requeued with delay, max 2 retries.
* Messages stuck >10 min in `sending/queued` → marked `failed` by cron ("Delivery timed out").
* Queue consumer failures → `message.retry()`; queue configured with 3 retries + DLQ.
* Campaign dispatch failure → campaign marked `failed`; per-message rows remain auditable.
