/**
 * Device URI sending — the heart of Sorcery.
 *
 * Messages are handed to the phone's OWN apps via URI schemes, so they travel
 * over the user's own SIM / phone number / local network:
 *
 *   sms:+PHONE?&body=…        native SMS composer (iOS & Android compatible)
 *   whatsapp://send?phone=…   WhatsApp app (iOS)
 *   intent://send?phone=…     WhatsApp app (Android)
 *   https://wa.me/…           WhatsApp (desktop / fallback)
 *
 * The user always confirms each send manually on the device — which is both
 * the anti-spam design and the product promise: your phone, your number,
 * your network. Plus the original anti-spam toolkit: paced opening and
 * hourly send budgets.
 */

export type DeviceChannel = 'sms' | 'whatsapp';

const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
const isAndroid = () => /Android/i.test(navigator.userAgent);
export const isMobileDevice = () => isIOS() || isAndroid();

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

/**
 * Cross-platform `sms:` URI. The `?&body=` form is the one delimiter layout
 * that both iOS Messages and Android handle correctly.
 */
export function buildSmsUri(phone: string, body: string): string {
  const number = sanitizePhone(phone);
  const text = encodeURIComponent(body);
  return `sms:${number}?&body=${text}`;
}

/** WhatsApp deep link — app scheme on mobile, web on desktop. */
export function buildWhatsAppUri(phone: string, body: string): string {
  const digits = sanitizePhone(phone).replace(/^\+/, '');
  const text = encodeURIComponent(body);
  if (isIOS()) return `whatsapp://send?phone=${digits}&text=${text}`;
  if (isAndroid()) return `intent://send?phone=${digits}&text=${text}#Intent;package=com.whatsapp;end;`;
  return `https://web.whatsapp.com/send?phone=${digits}&text=${text}`;
}

export function buildDeviceUri(channel: DeviceChannel, phone: string, body: string): string {
  return channel === 'whatsapp' ? buildWhatsAppUri(phone, body) : buildSmsUri(phone, body);
}

/** Open the device composer. On mobile this hands off to the native app. */
export function openDeviceUri(uri: string): void {
  if (isMobileDevice()) {
    // Full navigation (not window.open) so iOS reliably switches to Messages/WhatsApp.
    window.location.href = uri;
  } else {
    // Desktop: best effort (Phone Link / macOS Messages / WhatsApp Desktop may pick it up).
    window.location.href = uri;
  }
}

/* ── Anti-spam pacing (revived from the original toolkit) ────────── */

/** Human-ish delay between opening consecutive composers: base + jitter. */
export function smartDelay(baseMs = 1200): Promise<void> {
  const jitter = Math.floor(Math.random() * 500);
  return new Promise((resolve) => setTimeout(resolve, baseMs + jitter));
}

const HOUR_BUDGET = 20; // gentle default for local device sends
const COUNTER_KEY = 'sorcery-hourly-sends';

export function getHourlySendState(): { used: number; max: number; remaining: number; resetsAt: number } {
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    const now = Date.now();
    if (raw) {
      const parsed = JSON.parse(raw) as { count: number; resetAt: number };
      if (now < parsed.resetAt) {
        return { used: parsed.count, max: HOUR_BUDGET, remaining: Math.max(0, HOUR_BUDGET - parsed.count), resetsAt: parsed.resetAt };
      }
    }
  } catch { /* fresh state */ }
  const resetAt = Date.now() + 3_600_000;
  return { used: 0, max: HOUR_BUDGET, remaining: HOUR_BUDGET, resetsAt };
}

export function incrementHourlySends(): void {
  const state = getHourlySendState();
  const now = Date.now();
  const resetAt = now < state.resetsAt ? state.resetsAt : now + 3_600_000;
  const count = now < state.resetsAt ? state.used + 1 : 1;
  localStorage.setItem(COUNTER_KEY, JSON.stringify({ count, resetAt }));
}

/** Light message variation to reduce carrier/WhatsApp spam-flagging. */
export function addRandomization(message: string): string {
  if (Math.random() > 0.7 && !/^(hi|hello|hey)/i.test(message)) {
    const greetings = ['Hi', 'Hello', 'Hey', 'Good day'];
    message = `${greetings[Math.floor(Math.random() * greetings.length)]}! ${message}`;
  }
  return message;
}
