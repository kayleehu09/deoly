"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { FeedPost } from "@deoly/shared";
import { AppShell } from "../../../components/app-shell";
import { FeedPostCard } from "../../../components/feed-post-card";
import { RequireAuth } from "../../../components/require-auth";
import { getPost } from "../../../lib/api";

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const [post, setPost] = useState<FeedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refreshPost() {
    try {
      const response = await getPost(params.id);
      setPost(response.post);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this post.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshPost();
  }, [params.id]);

  return (
    <RequireAuth>
      <AppShell title="Post detail" subtitle="A focused view for reactions and supportive replies.">
        <div className="stack">
          <div className="surface-card">
            <Link href="/feed" className="meta-line">
              Back to feed
            </Link>
          </div>

          {loading ? <div className="surface-card subtle">Loading post...</div> : null}
          {error ? <div className="feedback error">{error}</div> : null}
          {post ? <FeedPostCard post={post} onRefresh={refreshPost} fullThread /> : null}
        </div>
      </AppShell>
    </RequireAuth>
  );
}
