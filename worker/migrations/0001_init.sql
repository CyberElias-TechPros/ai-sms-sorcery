-- AI SMS Sorcery — initial schema (Cloudflare D1 / SQLite)
-- All timestamps are ISO-8601 UTC strings (TEXT). All ids are UUIDs (TEXT).

PRAGMA foreign_keys = ON;

-- ───────────────────────── users & auth ─────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL,
  email_lower     TEXT NOT NULL UNIQUE,          -- normalized for uniqueness/lookup
  password_hash   TEXT NOT NULL,                 -- PBKDF2-SHA256 hex
  password_salt   TEXT NOT NULL,                 -- 16-byte hex
  name            TEXT NOT NULL,
  avatar_url      TEXT,
  phone_number    TEXT,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  plan            TEXT NOT NULL DEFAULT 'free_trial',
  messages_quota  INTEGER NOT NULL DEFAULT 500,
  messages_used   INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE,             -- SHA-256 of bearer token; raw token never stored
  user_agent   TEXT,
  ip           TEXT,
  created_at   TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  expires_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at    TEXT,
  created_at TEXT NOT NULL
);

-- ───────────────────────── contacts ─────────────────────────

CREATE TABLE IF NOT EXISTS contacts (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  phone_number TEXT NOT NULL,                    -- E.164
  email        TEXT,
  group_name   TEXT,
  tags         TEXT NOT NULL DEFAULT '[]',       -- JSON array of strings
  notes        TEXT,
  opted_out    INTEGER NOT NULL DEFAULT 0,       -- STOP compliance
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contacts_user  ON contacts(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_user_phone ON contacts(user_id, phone_number);

-- ───────────────────────── templates ─────────────────────────

CREATE TABLE IF NOT EXISTS templates (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'other',
  model       TEXT,                              -- AI model that produced it (provenance)
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_templates_user ON templates(user_id);

-- ───────────────────────── campaigns / scheduling ─────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  media_url         TEXT,
  channel           TEXT NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms','whatsapp','both')),
  status            TEXT NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('draft','scheduled','sending','completed','paused','cancelled','failed')),
  scheduled_at      TEXT,                        -- null for drafts
  recipients        TEXT NOT NULL DEFAULT '[]',  -- JSON [{contactId?,phoneNumber,name?}]
  total_recipients  INTEGER NOT NULL DEFAULT 0,
  sent_count        INTEGER NOT NULL DEFAULT 0,
  failed_count      INTEGER NOT NULL DEFAULT 0,
  ai_generated      INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  completed_at      TEXT
);
CREATE INDEX IF NOT EXISTS idx_campaigns_user   ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status, scheduled_at);

-- ───────────────────────── message log ─────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id                  TEXT PRIMARY KEY,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id         TEXT REFERENCES campaigns(id) ON DELETE SET NULL,
  channel             TEXT NOT NULL DEFAULT 'sms' CHECK (channel IN ('sms','whatsapp')),
  to_phone            TEXT NOT NULL,
  to_name             TEXT,
  body                TEXT NOT NULL,
  media_url           TEXT,
  status              TEXT NOT NULL DEFAULT 'queued'
                        CHECK (status IN ('queued','sending','sent','delivered','failed','cancelled')),
  provider            TEXT NOT NULL DEFAULT 'sandbox',
  provider_message_id TEXT,
  error               TEXT,
  ai_generated        INTEGER NOT NULL DEFAULT 0,
  template_id         TEXT REFERENCES templates(id) ON DELETE SET NULL,
  source              TEXT NOT NULL DEFAULT 'composer'
                        CHECK (source IN ('composer','scheduled','resend','api','bulk')),
  segments            INTEGER NOT NULL DEFAULT 1,
  idempotency_key     TEXT,
  created_at          TEXT NOT NULL,
  sent_at             TEXT,
  delivered_at        TEXT,
  updated_at          TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_user      ON messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_campaign  ON messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_messages_status    ON messages(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_messages_idem
  ON messages(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ───────────────────────── AI generation history ─────────────────────────

CREATE TABLE IF NOT EXISTS ai_generations (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt     TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'marketing',  -- marketing|reminder|notification|alert|other
  provider   TEXT NOT NULL,
  model      TEXT,
  result     TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_generations_user ON ai_generations(user_id, created_at DESC);

-- ───────────────────────── provider credentials (AES-GCM at rest) ─────────────────────────

CREATE TABLE IF NOT EXISTS credentials (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('sms','ai')),
  provider    TEXT NOT NULL,
  ciphertext  TEXT NOT NULL,                     -- AES-256-GCM(iv|ct|tag) base64 of config JSON
  meta        TEXT NOT NULL DEFAULT '{}',        -- NON-SECRETS only (sender id, model name…)
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_credentials_user_kind ON credentials(user_id, kind);

-- ───────────────────────── user settings ─────────────────────────

CREATE TABLE IF NOT EXISTS user_settings (
  user_id            TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  email_notifications INTEGER NOT NULL DEFAULT 1,
  sms_notifications   INTEGER NOT NULL DEFAULT 0,
  browser_notifications INTEGER NOT NULL DEFAULT 1,
  dark_mode           INTEGER NOT NULL DEFAULT 1,
  compact_view        INTEGER NOT NULL DEFAULT 0,
  auto_save           INTEGER NOT NULL DEFAULT 1,
  opt_out_footer      INTEGER NOT NULL DEFAULT 1,
  compliance_check    INTEGER NOT NULL DEFAULT 1,
  timezone            TEXT NOT NULL DEFAULT 'UTC',
  updated_at          TEXT NOT NULL
);

-- ───────────────────────── audit log ─────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY,
  user_id    TEXT,
  action     TEXT NOT NULL,
  meta       TEXT NOT NULL DEFAULT '{}',
  ip         TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);
