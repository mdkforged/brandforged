/**
 * Idle sign-out settings and helpers. One constant controls the timeout.
 * Only the activity timestamp lives here; kit, onboarding flags, notes,
 * Look photos and the Vault are never cleared on sign-out.
 */

export const IDLE_TIMEOUT_MINUTES = 30;
export const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

/** Last user activity (ms since epoch), shared by every tab on this device. */
export const LAST_ACTIVITY_KEY = "bf-last-activity-v1";

/** Fired right before an idle sign-out so open screens can save right now. */
export const IDLE_FLUSH_EVENT = "bf-idle-flush";

export const IDLE_SIGNED_OUT_MESSAGE = `You were signed out after ${IDLE_TIMEOUT_MINUTES} minutes without activity. Everything you made is still saved on this device.`;

/** True once the newer of last activity / sign-in time is older than the timeout. */
export function isIdleExpired(input: {
  lastActivity: number;
  signedInAt: number;
  now: number;
  timeoutMs?: number;
}): boolean {
  const timeout = input.timeoutMs ?? IDLE_TIMEOUT_MS;
  const last = Math.max(input.lastActivity || 0, input.signedInAt || 0);
  if (!last) return false;
  return input.now - last >= timeout;
}

export function readLastActivity(): number {
  if (typeof window === "undefined") return 0;
  try {
    const n = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function writeLastActivity(at: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Math.round(at)));
  } catch {
    /* storage full or blocked: the in-memory timer still works */
  }
}

export function clearLastActivity(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {
    /* ignore */
  }
}
