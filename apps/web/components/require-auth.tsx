"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "../lib/api";
import { clearSession, getSessionToken, setSession } from "../lib/auth-store";
import type { UserProfile } from "@sanctuary/shared";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      if (!getSessionToken()) {
        router.replace("/login");
        return;
      }

      try {
        const { user } = await getMe();
        setSession(getSessionToken()!, user);
        setReady(true);
      } catch {
        clearSession();
        router.replace("/login");
      }
    }

    bootstrap();
  }, [router]);

  if (!ready) {
    return (
      <main className="auth-layout">
        <div className="hero-panel auth-card">
          <p className="brand-kicker">Sanctuary Social</p>
          <h1 className="brand-title" style={{ fontSize: "2.4rem" }}>
            Loading
          </h1>
          <p className="brand-copy">Reconnecting your quiet little corner of the internet.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
