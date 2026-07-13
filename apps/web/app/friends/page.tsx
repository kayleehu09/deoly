"use client";

import { AppShell } from "../../components/app-shell";
import { FriendManager } from "../../components/friend-manager";
import { RequireAuth } from "../../components/require-auth";

export default function FriendsPage() {
  return (
    <RequireAuth>
      <AppShell title="Friends" subtitle="Build a small circle that feels safe, familiar, and easy to keep up with.">
        <div className="stack">
          <FriendManager />
        </div>
      </AppShell>
    </RequireAuth>
  );
}
