"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useProfileAccess } from "@/lib/access/use-profile-access";
import { createClient } from "@/lib/auth/supabase/client";
import {
  hasFinishedStart,
  useOnboardingAnswers,
} from "@/lib/onboarding/use-onboarding-answers";
import { HOME_DOORS } from "@/lib/home/doors";
import {
  DEFAULT_DEMO_WORKSPACE,
  DEMO_WORKSPACES,
  type WorkspaceSummary,
} from "@/lib/workspaces/demo";

type WorkspaceShellProps = {
  children: React.ReactNode;
};

export function WorkspaceShell({ children }: WorkspaceShellProps) {
  const pathname = usePathname();
  const {
    signedIn,
    ready: authReady,
    onboardingDone,
    displayName,
    email,
  } = useProfileAccess();
  const answers = useOnboardingAnswers();
  const setupDone = hasFinishedStart(answers) || onboardingDone;
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceSummary>(
    DEFAULT_DEMO_WORKSPACE,
  );
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "global" });
    } catch {
      // still force leave session UI
    }
    // Hard navigate so cookies + client state cannot stick on Signed in
    window.location.assign("/login");
  }

  function cycleWorkspace() {
    const idx = DEMO_WORKSPACES.findIndex((w) => w.slug === activeWorkspace.slug);
    const next = DEMO_WORKSPACES[(idx + 1) % DEMO_WORKSPACES.length];
    setActiveWorkspace(next);
  }

  const isHome = pathname === "/";
  const currentDoor = HOME_DOORS.find((door) => door.href === pathname);

  return (
    <div className="app-shell forged-shell">
      <aside className="sidebar">
        <Link href="/" className="brand-mark" aria-label="Brand Forged home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="brand-mark-logo"
            src="/brand/logo-forge-green.webp"
            alt=""
            width={44}
            height={44}
          />
          <div>
            <strong>Brand Forged</strong>
          </div>
        </Link>

        <button
          type="button"
          className="workspace-switcher"
          onClick={cycleWorkspace}
          aria-label={`Switch workspace. Current: ${activeWorkspace.name}`}
          title="Demo workspaces Ã¢â‚¬â€ click to switch"
        >
          <span className="workspace-dot" />
          <div>
            <small>Workspace</small>
            <strong>{activeWorkspace.name}</strong>
          </div>
          <span className="chevron" aria-hidden="true">
            v
          </span>
        </button>

        {!isHome ? (
          <>
            <p className="nav-label">Places</p>
            <nav className="nav-list" aria-label="Home doors">
              <Link href="/" className="nav-item">
                Home
              </Link>
              {HOME_DOORS.map((door) => (
                <Link
                  key={door.id}
                  href={door.href}
                  className={pathname === door.href ? "nav-item active" : "nav-item"}
                >
                  {door.label}
                </Link>
              ))}
            </nav>
          </>
        ) : null}

        <div className="sidebar-bottom">
          {!authReady ? (
            <div className="user-chip">
              <span className="avatar">?</span>
              <div>
                <strong>Account</strong>
                <small>...</small>
              </div>
            </div>
          ) : signedIn ? (
            <div className="user-chip-row">
              <Link href="/you" className="user-chip user-chip-link">
                <span className="avatar">
                  {(displayName || email || "Signed in")
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("") || "IN"}
                </span>
                <div>
                  <strong>{displayName || email || "Signed in"}</strong>
                  <small>Signed in</small>
                </div>
              </Link>
              <button
                type="button"
                className="user-sign-out"
                onClick={() => void handleSignOut()}
                disabled={signingOut}
              >
                {signingOut ? "..." : "Sign out"}
              </button>
            </div>
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(pathname || "/")}`}
              className="user-chip user-chip-link"
            >
              <span className="avatar">?</span>
              <div>
                <strong>Account</strong>
                <small>Sign in</small>
              </div>
            </Link>
          )}
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="breadcrumbs">
            {activeWorkspace.name}
            <span>/</span>
            {isHome ? "Home" : currentDoor?.label ?? "Home"}
          </div>
          <div className="top-actions">
            {authReady && !setupDone ? (
              <>
                <Link href="/start" className="door-upgrade-btn get-started-btn">
                  Get started
                </Link>
                {!signedIn ? (
                  <span className="topbar-soft-hint">
                    <Link href="/login?next=/">Sign in first</Link> if you already
                    set up on another device
                  </span>
                ) : null}
              </>
            ) : null}
          </div>
        </header>
        <div className="content-inner">{children}</div>
      </section>
    </div>
  );
}
