"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/auth/supabase/client";
import { isAuthConfigured } from "@/lib/validation/env";
import {
  clearLastActivity,
  IDLE_FLUSH_EVENT,
  IDLE_TIMEOUT_MS,
  isIdleExpired,
  readLastActivity,
  writeLastActivity,
} from "@/lib/auth/idle";

const ACTIVITY_EVENTS = [
  "pointerdown",
  "pointermove",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
] as const;
/** Write the shared activity stamp at most this often. */
const WRITE_THROTTLE_MS = 15_000;
/** Background check while the tab is open (phones also re-check on return). */
const CHECK_EVERY_MS = 30_000;

/**
 * Signs out after IDLE_TIMEOUT_MS without activity, then returns to /login.
 * Order: let open screens save (IDLE_FLUSH_EVENT), sign out this device only,
 * then navigate. It never clears the kit, onboarding flags, notes, Look or
 * Vault, so signing back in does not trigger setup again. No React state.
 */
export function IdleSignOut() {
  useEffect(() => {
    if (!isAuthConfigured()) return;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }

    let disposed = false;
    let active = false;
    let leaving = false;
    let signedInAt = 0;
    let lastWrite = 0;

    async function expire() {
      if (leaving) return;
      leaving = true;
      // 1) Save: tell open screens to write anything in progress, then let it land.
      try {
        window.dispatchEvent(new Event(IDLE_FLUSH_EVENT));
      } catch {
        /* ignore */
      }
      await new Promise<void>((resolve) => window.setTimeout(resolve, 60));
      // 2) Sign out this device only. Local kit / setup data is left alone.
      try {
        await supabase.auth.signOut({ scope: "local" });
      } catch {
        /* still leave the signed-in UI */
      }
      clearLastActivity();
      // 3) Back to login, remembering where she was.
      const here = `${window.location.pathname}${window.location.search}`;
      const next = here.startsWith("/login") ? "/" : here;
      window.location.replace(`/login?idle=1&next=${encodeURIComponent(next)}`);
    }

    /** True (and signing out) when the idle window has passed. */
    function expiredNow(): boolean {
      if (!active || leaving) return false;
      const lastActivity = Math.max(readLastActivity(), lastWrite);
      if (
        isIdleExpired({
          lastActivity,
          signedInAt,
          now: Date.now(),
          timeoutMs: IDLE_TIMEOUT_MS,
        })
      ) {
        void expire();
        return true;
      }
      return false;
    }

    function touch(force: boolean) {
      if (!active || leaving) return;
      const now = Date.now();
      if (!force && now - lastWrite < WRITE_THROTTLE_MS) return;
      // Check first: a tap after the timeout (e.g. a phone tab coming back
      // from the background) signs out instead of reviving the session.
      if (expiredNow()) return;
      lastWrite = now;
      writeLastActivity(now);
    }

    const onActivity = () => touch(false);
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        touch(true);
      } else if (active && !leaving && !expiredNow()) {
        // Leaving the tab counts as the last activity.
        lastWrite = Date.now();
        writeLastActivity(lastWrite);
      }
    };
    const onReturn = () => touch(true);

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (disposed) return;
      if (!session) {
        active = false;
        return;
      }
      const at = Date.parse(session.user?.last_sign_in_at ?? "");
      signedInAt = Number.isFinite(at) ? at : 0;
      if (!active) {
        active = true;
        // Outside the auth callback: check a stale session, else start the clock.
        window.setTimeout(() => {
          if (!disposed) touch(true);
        }, 0);
      }
    });

    ACTIVITY_EVENTS.forEach((name) =>
      window.addEventListener(name, onActivity, { passive: true, capture: true }),
    );
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onReturn);
    window.addEventListener("focus", onReturn);
    const timer = window.setInterval(() => {
      expiredNow();
    }, CHECK_EVERY_MS);

    return () => {
      disposed = true;
      data.subscription.unsubscribe();
      ACTIVITY_EVENTS.forEach((name) =>
        window.removeEventListener(name, onActivity, { capture: true }),
      );
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onReturn);
      window.removeEventListener("focus", onReturn);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
