# API Reference

Base path: `/api` · Content type: `application/json` · Auth: `Authorization: Bearer <token>`

**Envelope** — success: `{ "data": … }` · failure: `{ "error": { "code", "message", "details?" }, "requestId" }`

Common error codes: `bad_request`, `unauthorized`, `forbidden`, `not_found`, `conflict`,
`rate_limited`, `validation_failed`, `upstream_error`, `server_error`.

---

## Health

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | — | `{ status, service, environment, time }` |

## Auth

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | — | `{ email, password (8+, letter+number), name, phoneNumber? }` → `{ token, expiresAt, user }` |
| POST | `/auth/login` | — | `{ email, password }` → `{ token, expiresAt, user }` (enumeration-safe) |
| POST | `/auth/logout` | bearer | invalidates current session |
| POST | `/auth/logout-all` | bearer | invalidates every session |
| GET | `/auth/me` | bearer | current user |
| POST | `/auth/change-password` | bearer | `{ currentPassword, newPassword }` — other sessions revoked |

## Contacts

| Method | Path | Description |
| --- | --- | --- |
| GET | `/contacts` | `?q=&group=&tag=&page=&pageSize=&sort=name\|phone\|created\|updated` → `{ items, total, groups[] }` |
| POST | `/contacts` | `{ name, phoneNumber (E.164), email?, group?, tags?[], notes? }` |
| GET | `/contacts/export` | portable JSON dump |
| POST | `/contacts/import` | `{ contacts: [...] }` (≤2000) → `{ created, updated, skipped, errors[] }` |
| GET | `/contacts/:id` | |
| PATCH | `/contacts/:id` | partial update (incl. `optedOut`) |
| DELETE | `/contacts/:id` | |

## Templates

| Method | Path | Description |
| --- | --- | --- |
| GET | `/templates` | `?q=&category=` |
| POST | `/templates` | `{ title, content, category: marketing\|notification\|reminder\|alert\|other, model? }` |
| GET/PATCH/DELETE | `/templates/:id` | |
| POST | `/templates/:id/use` | increments `usageCount` |

## AI

| Method | Path | Description |
| --- | --- | --- |
| POST | `/ai/generate` | `{ prompt, kind, maxLength?, variants? (1-5), audience?, tone? }` → `{ texts[], provider, model, segments[] }` |
| POST | `/ai/generate-bulk` | `{ prompt, kind, recipients[] }` → `{ master, items[{recipient, text, segments}] }` (`{{name}}` personalization) |
| GET | `/ai/history` | `?limit=` recent generations |

Providers: `sorcery` (built-in, key-free) · `openai` · `anthropic` · `google` · `cohere`
(selected in `/credentials`; falls back to `sorcery` when unconfigured or on decrypt failure).

## Messages

| Method | Path | Description |
| --- | --- | --- |
| POST | `/messages/send` | `{ body, recipients[], channel: sms\|whatsapp\|both, mediaUrl?, templateId?, aiGenerated? }` · `X-Idempotency-Key` dedupes retries · skips opted-out contacts · auto compliance footer |
| GET | `/messages` | `?q=&status=&channel=&source=&campaignId=&page=&pageSize=` |
| GET | `/messages/:id` | |
| POST | `/messages/:id/resend` | new message, `source: resend` |
| POST | `/messages/:id/cancel` | only while `queued` |
| GET | `/messages/export` | JSON dump (≤10k) |

Message status: `queued → sending → sent → delivered | failed | cancelled`.

## Scheduled campaigns

| Method | Path | Description |
| --- | --- | --- |
| GET | `/scheduled` | `?tab=all\|drafts\|scheduled\|paused\|completed&q=` |
| POST | `/scheduled` | `{ title, body, channel?, recipients[], scheduledAt?, draft? }` |
| GET/PATCH/DELETE | `/scheduled/:id` | |
| POST | `/scheduled/:id/pause` · `/resume` · `/cancel` | lifecycle |
| POST | `/scheduled/:id/duplicate` | copies to a new draft |
| POST | `/scheduled/:id/schedule` | `{ scheduledAt }` draft/paused → scheduled |
| POST | `/scheduled/:id/send-now` | dispatch immediately (sync for ≤10 recipients) |

Campaign status: `draft | scheduled → sending → completed | failed` (+ `paused`, `cancelled`).

## Stats

| Method | Path | Description |
| --- | --- | --- |
| GET | `/stats/dashboard` | totals, quota, 7-day series, recent AI messages, upcoming campaigns |
| GET | `/stats/analytics` | `?range=7days\|30days\|90days\|12months` → deliveryRate, byStatus, byChannel, byCategory, daily |

## Settings · profile · account

| Method | Path | Description |
| --- | --- | --- |
| GET/PUT | `/settings` | notification, appearance, compliance toggles, timezone |
| GET | `/settings/security` | active sessions |
| PATCH | `/profile` | `{ name?, email?, phoneNumber?, avatarUrl? }` |
| GET | `/account/export` | GDPR-style full export |
| DELETE | `/account` | `{ password }` — cascades all data, revokes sessions |

## Credentials (write-only vault)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/credentials` | masked views only (`maskedKey`, provider, non-secret meta) |
| PUT | `/credentials` | `{ kind: sms\|ai, provider, …secrets, …meta }` — partial updates never wipe stored secrets |
| POST | `/credentials/test` | `{ kind, draft? }` verifies saved creds or an unsaved form draft |
| DELETE | `/credentials/:id` | |

## Webhooks

| Method | Path | Description |
| --- | --- | --- |
| POST | `/webhooks/sms/twilio/:messageId` | Twilio status callback (form-encoded) · optional HMAC verification |
| POST | `/webhooks/sms/status` | generic `{ messageId, status, error? }` |
