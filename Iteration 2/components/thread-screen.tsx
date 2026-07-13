import Link from "next/link";

import { PostCard } from "@/components/post-card";
import type { PostDto } from "@/lib/contracts";

export function ThreadScreen({ post }: { post: PostDto }) {
  return (
    <div className="stack">
      <Link className="ghost-button" href="/feed">
        Back to feed
      </Link>
      <PostCard post={post} fullThread />
    </div>
  );
}
