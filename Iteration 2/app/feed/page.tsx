import { AppShell } from "@/components/app-shell";
import { FeedScreen } from "@/components/feed-screen";
import { requireUser } from "@/lib/auth";
import { getFeedForUser } from "@/lib/db";

export default async function FeedPage() {
  const user = await requireUser();
  const feed = getFeedForUser(user.id);

  return (
    <AppShell
      viewer={feed.viewer}
      title="Your sanctuary feed"
      subtitle="A reverse-chronological stream of your own posts and accepted friends."
      activePath="/feed"
    >
      <FeedScreen feed={feed} />
    </AppShell>
  );
}
