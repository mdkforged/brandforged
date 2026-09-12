"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceSummary>(
    DEFAULT_DEMO_WORKSPACE,
  );

  function cycleWorkspace() {
    const idx = DEMO_WORKSPACES.findIndex((w) => w.slug === activeWorkspace.slug);
    const next = DEMO_WORKSPACES[(idx + 1) % DEMO_WORKSPACES.length];
    setActiveWorkspace(next);
  }

  const isHome = pathname === "/";
  const currentDoor = HOME_DOORS.find((door) => door.href === pathname);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand-mark" aria-label="Brand Forged home">
          <span>BF</span>
          <div>
            <strong>Brand</strong>
            <em>Forged</em>
          </div>
        </Link>

        <button
          type="button"
          className="workspace-switcher"
          onClick={cycleWorkspace}
          aria-label={`Switch workspace. Current: ${activeWorkspace.name}`}
          title="Demo workspaces — click to switch"
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
          <div className="user-chip">
            <span className="avatar">MD</span>
            <div>
              <strong>Mary Diane</strong>
              <small>Owner</small>
            </div>
          </div>
        </div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div className="breadcrumbs">
            {activeWorkspace.name}
            <span>/</span>
            {isHome ? "Home" : currentDoor?.label ?? "Home"}
          </div>
        </header>
        <div className="content-inner">{children}</div>
      </section>
    </div>
  );
}