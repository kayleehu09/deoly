"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ALLOWED_REACTION_EMOJIS, COMMENT_MAX_LENGTH, type FeedPost } from "@sanctuary/shared";
import { addComment, addReaction, removeReaction } from "../lib/api";
import { formatTimestamp, timeAgo } from "../lib/format";

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("[data-no-nav='true']"));
}

export function FeedPostCard({
  post,
  onRefresh,
  fullThread = false
}: {
  post: FeedPost;
  onRefresh: () => Promise<void>;
  fullThread?: boolean;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openThread() {
    if (!fullThread) {
      router.push(`/posts/${post.id}`);
    }
  }

  const visibilityLabel = post.visibility === "close_circle" ? "Close circle" : "Friends only";

  async function toggleReaction(emoji: (typeof ALLOWED_REACTION_EMOJIS)[number]) {
    setBusy(true);
    setError(null);
    try {
      if (post.viewerReactions.includes(emoji)) {
        await removeReaction(post.id, emoji);
      } else {
        await addReaction(post.id, { emoji });
      }
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update reaction.");
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!comment.trim()) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await addComment(post.id, { body: comment.trim() });
      setComment("");
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send comment.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="post-card">
      <button
        type="button"
        className="card-link"
        aria-label={fullThread ? "Post thread" : `Open post from ${post.author.displayName}`}
        onClick={(event) => {
          if (!isInteractiveTarget(event.target)) {
            openThread();
          }
        }}
        onKeyDown={(event) => {
          if (isInteractiveTarget(event.target)) {
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openThread();
          }
        }}
      >
        <div className="post-meta">
          <div className="post-author">
            <strong>{post.author.displayName}</strong>
            <span className="meta-line">
              @{post.author.username} · {timeAgo(post.createdAt)}
            </span>
          </div>
          <span className="privacy-badge">{visibilityLabel}</span>
        </div>

        {post.imageUrl ? <img className="post-image" src={post.imageUrl} alt="" /> : null}

        {post.body ? <p className="post-body">{post.body}</p> : null}
      </button>

      <div className="stack" style={{ gap: 10 }} data-no-nav="true">
        <div className="reaction-row">
        {ALLOWED_REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
              className="reaction-pill"
              data-active={post.viewerReactions.includes(emoji)}
            disabled={busy}
              onClick={() => toggleReaction(emoji)}
          >
              <span>{emoji}</span>
              {(post.reactionCounts[emoji] ?? 0) > 0 ? <span>{post.reactionCounts[emoji]}</span> : null}
          </button>
        ))}
        </div>

        <div className="comment-list">
        {post.recentComments.map((entry) => (
          <div className="comment" key={entry.id}>
              <div className="meta-line">
                <strong>{entry.author.displayName}</strong> · {timeAgo(entry.createdAt)}
            </div>
              <p>{entry.body}</p>
          </div>
        ))}
        </div>

        {!fullThread && post.commentCount > post.recentComments.length ? (
          <Link className="meta-line" href={`/posts/${post.id}`}>
            View full thread · {post.commentCount} replies
          </Link>
        ) : null}

        <form className="inline-form" onSubmit={submitComment}>
        <input
            className="inline-input"
          value={comment}
          maxLength={COMMENT_MAX_LENGTH}
          onChange={(event) => setComment(event.target.value)}
            placeholder="Leave a short supportive reply..."
        />
          <div className="toolbar">
            <span className="meta-line">{formatTimestamp(post.createdAt)}</span>
            <button className="ghost-button" type="submit" disabled={busy || !comment.trim()}>
              Reply
            </button>
          </div>
      </form>

        {error ? <div className="feedback error">{error}</div> : null}
      </div>
    </article>
  );
}
