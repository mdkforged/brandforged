"use client";

import Link from "next/link";
import { HOME_DOORS, WORLD_UPGRADE_COPY } from "@/lib/home/doors";
import { useProfileAccess } from "@/lib/access/use-profile-access";

export function HomeDoorNav() {
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

  return (
    <div className="home-doors" role="navigation" aria-label="Home">
      {HOME_DOORS.map((door) => {
        const locked = door.id === "world" && ready && !worldOpen;
        if (locked) {
          return (
            <div
              key={door.id}
              className={`home-door home-door-${door.id} is-locked`}
            >
              <p className="door-upgrade-badge">{WORLD_UPGRADE_COPY.badge}</p>
              <h2>{door.label}</h2>
              <p>{WORLD_UPGRADE_COPY.summary}</p>
              {wantsAllInOne ? (
                <p className="door-upgrade-hint">{WORLD_UPGRADE_COPY.allInOneHint}</p>
              ) : null}
              {!signedIn ? (
                <Link href="/login" className="door-upgrade-btn">
                  Sign in to upgrade
                </Link>
              ) : requested ? (
                <p className="door-upgrade-status">{WORLD_UPGRADE_COPY.requested}</p>
              ) : (
                <button
                  type="button"
                  className="door-upgrade-btn"
                  disabled={busy || !ready}
                  onClick={() => void requestWorldUpgrade()}
                >
                  {busy
                    ? WORLD_UPGRADE_COPY.requesting
                    : WORLD_UPGRADE_COPY.cta}
                </button>
              )}
              {error ? (
                <p className="login-alert" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          );
        }
        if (door.id === "world" && !ready) {
          return (
            <div
              key={door.id}
              className={`home-door home-door-${door.id} is-locked`}
            >
              <p className="door-upgrade-badge">{WORLD_UPGRADE_COPY.badge}</p>
              <h2>{door.label}</h2>
              <p>{WORLD_UPGRADE_COPY.summary}</p>
            </div>
          );
        }
        return (
          <Link
            key={door.id}
            href={door.href}
            className={`home-door home-door-${door.id}`}
          >
            <h2>{door.label}</h2>
            <p>{door.summary}</p>
          </Link>
        );
      })}
    </div>
  );
}