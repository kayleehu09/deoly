import { AppShell } from "@/components/app-shell";
import { FriendManager } from "@/components/friend-manager";
import { requireUser } from "@/lib/auth";
import { getFriendsState } from "@/lib/db";

export default async function FriendsPage() {
  const user = await requireUser();
  const friendships = getFriendsState(user.id);

  return (
    <AppShell
      viewer={user}
      title="Trusted connections"
      subtitle="Manage requests, search people, and keep the feed personal."
      activePath="/friends"
    >
      <FriendManager friendships={friendships} />
    </AppShell>
  );
}
