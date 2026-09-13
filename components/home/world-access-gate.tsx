"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { WORLD_UPGRADE_COPY } from "@/lib/home/doors";
import { useProfileAccess } from "@/lib/access/use-profile-access";

export function WorldAccessGate({ children }: { children: ReactNode }) {
  const {
    ready,
    signedIn,
    busy,
    error,
    worldOpen,
    requested,
    wantsAllInOne,
    requestWorldUpgrade,
  } = useProfileAccess();

  if (!ready) {
    return (
      <article className="module-card">
        <p>Checking access...</p>
      </article>
    );
  }

  if (!worldOpen) {
    return (
      <article className="module-card look-card">
        <p className="door-upgrade-badge">{WORLD_UPGRADE_COPY.badge}</p>
        <h2>Your World</h2>
        <p>{WORLD_UPGRADE_COPY.summary}</p>
        {wantsAllInOne ? (
          <p className="door-upgrade-hint">{WORLD_UPGRADE_COPY.allInOneHint}</p>
        ) : null}
        {!signedIn ? (
          <p>
            <Link href="/login">Sign in</Link> to request Your World.
          </p>
        ) : requested ? (
          <p className="door-upgrade-status">{WORLD_UPGRADE_COPY.requested}</p>
        ) : (
          <button
            type="button"
            className="door-upgrade-btn"
            disabled={busy}
            onClick={() => void requestWorldUpgrade()}
          >
            {busy ? WORLD_UPGRADE_COPY.requesting : WORLD_UPGRADE_COPY.cta}
          </button>
        )}
        {error ? (
          <p className="login-alert" role="alert">
            {error}
          </p>
        ) : null}
        <p>
          <Link href="/you">Go to This is You</Link>
        </p>
      </article>
    );
  }

  return <>{children}</>;
}