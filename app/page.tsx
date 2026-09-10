"use client";

import { useMemo, useState } from "react";
import {
  DEMO_WORKSPACES,
  DEFAULT_DEMO_WORKSPACE,
  type WorkspaceSummary,
} from "@/lib/workspaces/demo";

const modules = [
  { name: "Overview", icon: "◈" },
  { name: "Identity Engine", icon: "✦" },
  { name: "Asset Library", icon: "▧" },
  { name: "Template Engine", icon: "⌘" },
  { name: "Workflows", icon: "↗" },
];

function sampleProjects(workspaceName: string) {
  return [
    { name: "September launch system", type: "Campaign", status: "In review", color: "coral" },
    { name: `${workspaceName} core kit`, type: "Identity", status: "In progress", color: "mint" },
    { name: "Founder story templates", type: "Template set", status: "Ready", color: "yellow" },
  ];
}

export default function Home() {
  const [activeModule, setActiveModule] = useState("Overview");
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceSummary>(
    DEFAULT_DEMO_WORKSPACE,
  );

  const projects = useMemo(
    () => sampleProjects(activeWorkspace.name),
    [activeWorkspace.name],
  );

  function cycleWorkspace() {
    const idx = DEMO_WORKSPACES.findIndex((w) => w.slug === activeWorkspace.slug);
    const next = DEMO_WORKSPACES[(idx + 1) % DEMO_WORKSPACES.length];
    setActiveWorkspace(next);
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>BF</span><div><strong>Brand</strong><em>Forged</em></div></div>
        <button
          type="button"
          className="workspace-switcher"
          onClick={cycleWorkspace}
          aria-label={`Switch workspace (DEMO). Current: ${activeWorkspace.name}`}
          title="DEMO / FALLBACK workspaces — click to switch"
        >
          <span className="workspace-dot" />
          <div>
            <small>WORKSPACE</small>
            <strong>{activeWorkspace.name}</strong>
          </div>
          <span className="chevron">⌄</span>
        </button>
        <p className="nav-label">Workspace</p>
        <nav className="nav-list" aria-label="Workspace navigation">
          {modules.map((module) => (
            <button className={activeModule === module.name ? "nav-item active" : "nav-item"} key={module.name} onClick={() => setActiveModule(module.name)}>
              <span className="nav-icon">{module.icon}</span>{module.name}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom"><button className="nav-item"><span className="nav-icon">⚙</span>Settings</button><div className="user-chip"><span className="avatar">MD</span><div><strong>Mary Diane</strong><small>Owner</small></div><span className="more">•••</span></div></div>
      </aside>

      <section className="content">
        <header className="topbar"><div className="breadcrumbs">Workspace <span>/</span> {activeModule}</div><div className="top-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button" aria-label="Notifications">♢<i /></button><button className="new-button">+ New work</button></div></header>
        <div className="content-inner">
          <div className="page-intro"><div><p className="eyebrow">Tuesday, September 3, 2026</p><h1>Good morning, Mary.</h1><p className="intro-copy">Your brand system is moving. Here is the work that needs your attention.</p></div><div className="health-badge"><span /> System healthy</div></div>

          <div className="stats-grid"><div className="stat-card accent-coral"><span>Active projects</span><strong>12</strong><small>↑ 3 this month</small></div><div className="stat-card accent-mint"><span>Published assets</span><strong>248</strong><small>↑ 18 this month</small></div><div className="stat-card accent-yellow"><span>Needs your review</span><strong>07</strong><small>Across 3 workflows</small></div><div className="stat-card accent-ink"><span>Brand consistency</span><strong>94<span>%</span></strong><small>↑ 6% since August</small></div></div>

          <div className="dashboard-grid"><section className="panel projects-panel"><div className="panel-heading"><div><p className="eyebrow">Your workspace</p><h2>Active work</h2></div><button className="text-button">View all <span>→</span></button></div><div className="project-list">{projects.map((project) => <article className="project-row" key={project.name}><span className={`project-swatch ${project.color}`} /><div className="project-info"><strong>{project.name}</strong><span>{project.type}</span></div><span className={`status status-${project.color}`}>{project.status}</span><button className="row-arrow" aria-label={`Open ${project.name}`}>→</button></article>)}</div><button className="add-work">+ Add a project</button></section>
            <section className="panel activity-panel"><div className="panel-heading"><div><p className="eyebrow">Live feed</p><h2>Recent activity</h2></div><button className="more-button" aria-label="More activity">•••</button></div><div className="activity-list"><div><span className="activity-avatar coral-bg">AL</span><p><strong>Alex Lee</strong> published <b>Brand voice v2</b><small>12 minutes ago</small></p></div><div><span className="activity-avatar mint-bg">MD</span><p><strong>You</strong> approved <b>Founder story / 03</b><small>48 minutes ago</small></p></div><div><span className="activity-avatar yellow-bg">JR</span><p><strong>Jordan Ruiz</strong> added 8 assets to <b>Core kit</b><small>Yesterday at 4:32 PM</small></p></div></div><button className="text-button activity-link">Open activity log <span>→</span></button></section></div>
          <section className="focus-strip"><div className="focus-icon">✦</div><div><p className="eyebrow">Focus area</p><h2>Keep the story consistent.</h2><p>Review the seven pieces waiting for your voice before this week&apos;s launch.</p></div><button className="dark-button">Review queue <span>→</span></button></section>
        </div>
      </section>
    </main>
  );
}
