/**
 * useSendQueue — the bulk local-send queue runner.
 *
 * Organize recipients → hand each message to the phone's own SMS/WhatsApp
 * composer via URI → user confirms on-device → next. Progress persists in
 * localStorage so an interrupted blast resumes exactly where it stopped.
 *
 * State lives at module level (external store) so every hook instance —
 * the composer that starts a run and the stepper dialog that walks it —
 * sees the same queue.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  buildDeviceUri, DeviceChannel, incrementHourlySends, openDeviceUri, smartDelay,
} from '@/lib/smsUri';

export type QueueItemStatus = 'pending' | 'opened' | 'sent' | 'skipped' | 'failed';

export interface SendQueueItem {
  messageId: string;
  name: string;
  phone: string;
  channel: DeviceChannel;
  uri: string;
  status: QueueItemStatus;
}

export interface SendQueueState {
  runId: string;
  body: string;
  items: SendQueueItem[];
  createdAt: string;
}

const STORAGE_KEY = 'sorcery-send-queue';

export function loadActiveQueue(): SendQueueState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SendQueueState) : null;
  } catch {
    return null;
  }
}

export function clearActiveQueue(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ── module-level shared state ────────────────────────────────────────
let sharedQueue: SendQueueState | null = loadActiveQueue();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

function setSharedQueue(update: SendQueueState | null | ((q: SendQueueState | null) => SendQueueState | null)): void {
  sharedQueue = typeof update === 'function' ? update(sharedQueue) : update;
  try {
    if (sharedQueue) localStorage.setItem(STORAGE_KEY, JSON.stringify(sharedQueue));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage full — in-memory state still works */
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SendQueueState | null {
  return sharedQueue;
}

interface StartInput {
  body: string;
  recipients: Array<{ messageId: string; name: string; phone: string; channel: DeviceChannel }>;
}

export function useSendQueue() {
  const queue = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [pace, setPace] = useState(true);
  const pacingRef = useRef(false);

  const currentIndex = queue ? queue.items.findIndex((i) => i.status === 'pending' || i.status === 'opened') : -1;
  const current = queue && currentIndex >= 0 ? queue.items[currentIndex] : null;
  const done = queue ? queue.items.filter((i) => ['sent', 'skipped', 'failed'].includes(i.status)) : [];
  const remaining = queue ? queue.items.filter((i) => ['pending', 'opened'].includes(i.status)).length : 0;

  const start = useCallback((input: StartInput) => {
    const items: SendQueueItem[] = input.recipients.map((r) => ({
      messageId: r.messageId,
      name: r.name,
      phone: r.phone,
      channel: r.channel,
      uri: buildDeviceUri(r.channel, r.phone, input.body),
      status: 'pending' as const,
    }));
    setSharedQueue({
      runId: crypto.randomUUID(),
      body: input.body,
      items,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const updateItem = useCallback((messageId: string, status: QueueItemStatus) => {
    setSharedQueue((q) => (q ? { ...q, items: q.items.map((i) => (i.messageId === messageId ? { ...i, status } : i)) } : q));
  }, []);

  /** Open the current recipient's composer (SMS app / WhatsApp). */
  const openCurrent = useCallback(async () => {
    if (!current || pacingRef.current) return;
    pacingRef.current = true;
    try {
      openDeviceUri(current.uri);
      updateItem(current.messageId, 'opened');
      incrementHourlySends();
      if (pace) await smartDelay(1000);
    } finally {
      pacingRef.current = false;
    }
  }, [current, pace, updateItem]);

  const confirmSent = useCallback(() => {
    if (!current) return;
    updateItem(current.messageId, 'sent');
  }, [current, updateItem]);

  const skip = useCallback(() => {
    if (!current) return;
    updateItem(current.messageId, 'skipped');
  }, [current, updateItem]);

  const markFailed = useCallback(() => {
    if (!current) return;
    updateItem(current.messageId, 'failed');
  }, [current, updateItem]);

  const reset = useCallback(() => {
    setSharedQueue(null);
  }, []);

  return {
    queue, current, currentIndex, done, remaining,
    start, openCurrent, confirmSent, skip, markFailed, reset, updateItem,
    pace, setPace,
    isActive: !!queue && remaining > 0,
  };
}
