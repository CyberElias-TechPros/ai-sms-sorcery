/**
 * Cloudflare Worker bindings for the AI SMS Sorcery API.
 */

export interface Env {
  /** D1 relational database */
  DB: D1Database;
  /** KV namespace: rate limiting, short-lived caches */
  KV: KVNamespace;
  /** Async SMS dispatch queue */
  SMS_QUEUE: Queue<DispatchJob>;
  /** AES-256-GCM key (base64, 32 bytes) used to encrypt stored provider credentials */
  CREDENTIALS_ENCRYPTION_KEY?: string;
  /** Comma-separated list of allowed browser origins. `*` in dev. */
  CORS_ORIGINS?: string;
  /** HMAC key used to verify provider webhook signatures (e.g. Twilio) */
  WEBHOOK_SIGNING_SECRET?: string;
  /** Deployment environment label */
  ENVIRONMENT?: string;
}

/** Job payload consumed by the SMS dispatch queue consumer. */
export interface DispatchJob {
  kind: 'send-batch';
  userId: string;
  campaignId?: string;
  messageIds: string[];
  attempt?: number;
}

/** Job payload used by cron to trigger due campaign dispatch. */
export interface CronJob {
  kind: 'dispatch-campaign';
  campaignId: string;
}
