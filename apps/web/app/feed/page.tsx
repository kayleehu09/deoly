"use client";

import { useEffect, useState } from "react";
import type { FeedPost } from "@deoly/shared";
import Link from "next/link";
import { AppShell } from "../../components/app-shell";
import { FeedPostCard } from "../../components/feed-post-card";
import { FriendManager } from "../../components/friend-manager";
import { PostComposer } from "../../components/post-composer";
import { RequireAuth } from "../../components/require-auth";
import { getFeed, getFriends } from "../../lib/api";

export default function FeedPage() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [incomingCount, setIncomingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshFeed() {
    try {
      const [feedResponse, friendsResponse] = await Promise.all([getFeed(), getFriends()]);
      setPosts(feedResponse.items);
      setIncomingCount(friendsResponse.friends.filter((entry) => entry.direction === "incoming").length);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load feed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshFeed();
  }, []);

  return (
    <RequireAuth>
      <AppShell title="Home" subtitle="Posts from your close circle, newest first.">
        <div className="stack">
          <PostComposer onCreated={refreshFeed} />

          {incomingCount > 0 ? (
            <section className="surface-card">
              <div className="toolbar">
                <div>
                  <strong>{incomingCount} friend request{incomingCount === 1 ? "" : "s"}</strong>
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

          {loading ? <div className="surface-card subtle">Loading your feed...</div> : null}
          {error ? <div className="feedback error">{error}</div> : null}
          {!loading && !posts.length ? (
            <div className="surface-card empty-state">No posts yet. Add friends and share the first devotional or prayer request.</div>
          ) : null}

          {posts.map((post) => (
            <FeedPostCard key={post.id} post={post} onRefresh={refreshFeed} />
          ))}

          {!loading && posts.length === 0 ? <FriendManager compact /> : null}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
