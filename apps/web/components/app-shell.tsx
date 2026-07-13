"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getStoredUser } from "../lib/auth-store";
import { logout } from "../lib/api";
import type { UserProfile } from "@sanctuary/shared";

const navItems = [
  { href: "/feed", label: "Home" },
  { href: "/friends", label: "Friends" },
  { href: "/profile", label: "Profile" }
] as const;

export function AppShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getStoredUser<UserProfile>();

  async function handleLogout() {
    try {
      await logout();
    } catch {}
    clearSession();
    router.replace("/login");
  }

  return (
    <main className="page-shell">
      <header className="app-shell-header">
        <div className="app-title">
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow">Sanctuary Social</span>
            <div>
              <h1 className="section-title">{title}</h1>
              <p className="subtle" style={{ margin: "4px 0 0" }}>
                {subtitle}
              </p>
            </div>
          </div>
          <button className="ghost-button" onClick={handleLogout}>
            Sign out
          </button>
        </div>

        <section className="surface-card">
          <div className="toolbar">
            <div>
              <strong>{user?.displayName ?? "Guest"}</strong>
              <p className="meta-line" style={{ margin: "4px 0 0" }}>
                @{user?.username ?? "friend"}
              </p>
            </div>
            <span className="privacy-badge">Invite-friendly</span>
          </div>
        </section>
      </header>

      {children}

      <nav className="bottom-nav" aria-label="Primary">
        <div className="bottom-nav-inner">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="nav-link" data-active={pathname === item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </main>
  );
}
