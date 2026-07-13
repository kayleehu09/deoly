import Link from "next/link";
import type { ReactNode } from "react";

import type { ViewerDto } from "@/lib/contracts";
import { LogoutButton } from "@/components/logout-button";

export function AppShell({
  viewer,
  title,
  subtitle,
  activePath,
  children
}: {
  viewer: ViewerDto;
  title: string;
  subtitle: string;
  activePath: "/feed" | "/friends";
  children: ReactNode;
}) {
  return (
    <main className="page-shell">
      <header className="app-shell-header">
        <div className="app-title">
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow">Sanctuary Social</span>
            <div>
              <h1 className="section-title">{title}</h1>
              <p className="subtle">{subtitle}</p>
            </div>
          </div>
          <LogoutButton />
        </div>

        <section className="surface-card">
          <div className="toolbar">
            <div>
              <strong>{viewer.displayName}</strong>
              <p className="meta-line" style={{ margin: "4px 0 0" }}>
                @{viewer.username} • {viewer.closeCircleCount} close-circle spots saved
              </p>
            </div>
            <span className="privacy-badge">Invite-friendly</span>
          </div>
        </section>
      </header>

      {children}

      <nav className="bottom-nav" aria-label="Primary">
        <div className="bottom-nav-inner">
          <Link className="nav-link" data-active={activePath === "/feed"} href="/feed">
            Feed
          </Link>
          <Link className="nav-link" data-active={activePath === "/friends"} href="/friends">
            Friends
          </Link>
        </div>
      </nav>
    </main>
  );
}
