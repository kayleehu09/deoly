"use client";

import { AppShell } from "../../components/app-shell";
import { RequireAuth } from "../../components/require-auth";
import { getStoredUser } from "../../lib/auth-store";
import type { UserProfile } from "@sanctuary/shared";

export default function ProfilePage() {
  const user = getStoredUser<UserProfile>();

  return (
    <RequireAuth>
      <AppShell title="Profile" subtitle="A simple account view for the MVP, ready to grow later.">
        <div className="feed">
          <div className="card">
            <div className="row" style={{ marginBottom: 16 }}>
              <div className="avatar" style={{ width: 64, height: 64, fontSize: 22 }}>
                {user?.displayName.slice(0, 1) ?? "S"}
              </div>
              <div>
                <h2 className="section-title" style={{ marginBottom: 6 }}>
                  {user?.displayName ?? "Your name"}
                </h2>
                <div className="meta">@{user?.username ?? "username"}</div>
              </div>
            </div>

            <p className="brand-copy">
              {user?.bio ??
                "This MVP keeps profile settings light so the main experience stays centered on posting and close-friend connection."}
            </p>

            <div className="comment-list">
              <div className="comment">
                <div className="meta">Email</div>
                <div>{user?.email ?? "Not available"}</div>
              </div>
              <div className="comment">
                <div className="meta">Joined</div>
                <div>{user ? new Date(user.createdAt).toLocaleDateString() : "Not available"}</div>
              </div>
              <div className="comment">
                <div className="meta">Auth mode</div>
                <div>Local password account, with room for future Google sign-in.</div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
