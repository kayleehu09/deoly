import Link from "next/link";

import { Composer } from "@/components/composer";
import { FriendManager } from "@/components/friend-manager";
import { PostCard } from "@/components/post-card";
import type { FeedResponse } from "@/lib/contracts";

export function FeedScreen({ feed }: { feed: FeedResponse }) {
  return (
    <div className="stack">
      <Composer />

      {feed.friendships.incomingRequests.length > 0 ? (
        <section className="surface-card">
          <div className="toolbar">
            <div>
              <strong>{feed.friendships.incomingRequests.length} friend request(s)</strong>
              <p className="meta-line" style={{ margin: "4px 0 0" }}>
                People are waiting to join your trusted circle.
              </p>
            </div>
            <Link className="ghost-button" href="/friends">
              Review
            </Link>
          </div>
        </section>
      ) : null}

      <section className="stack">
        {feed.posts.length > 0 ? (
          feed.posts.map((post) => <PostCard key={post.id} post={post} />)
        ) : (
          <div className="surface-card empty-state">
            Your feed is quiet right now. Add a friend or share the first post for your circle.
          </div>
        )}
      </section>

      <FriendManager friendships={feed.friendships} compact />
    </div>
  );
}
