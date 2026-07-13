"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, KeyboardEvent, MouseEvent, useState, useTransition } from "react";

import { REACTION_EMOJIS, type PostDto } from "@/lib/contracts";
import { formatTimestamp, timeAgo } from "@/lib/utils";

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest("[data-no-nav='true']"));
}

function visibilityLabel(value: PostDto["visibility"]) {
  return value === "close_circle" ? "Close circle" : "Friends only";
}

export function PostCard({
  post,
  fullThread = false
}: {
  post: PostDto;
  fullThread?: boolean;
}) {
  const router = useRouter();
  const [commentBody, setCommentBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function navigateToThread() {
    if (!fullThread) {
      router.push(`/posts/${post.id}`);
    }
  }

  function handleCardClick(event: MouseEvent<HTMLButtonElement>) {
    if (fullThread || isInteractiveTarget(event.target)) {
      return;
    }
    navigateToThread();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (fullThread || isInteractiveTarget(event.target)) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      navigateToThread();
    }
  }

  async function toggleReaction(emoji: string, reacted: boolean) {
    setError(null);
    const url = reacted
      ? `/api/posts/${post.id}/reactions/${encodeURIComponent(emoji)}`
      : `/api/posts/${post.id}/reactions`;

    const response = await fetch(url, {
      method: reacted ? "DELETE" : "POST",
      headers: reacted
        ? undefined
        : {
            "Content-Type": "application/json"
          },
      body: reacted ? undefined : JSON.stringify({ emoji })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to update reaction.");
      return;
    }

    router.refresh();
  }

  async function handleReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const response = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ body: commentBody })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to add reply.");
      return;
    }

    setCommentBody("");
    router.refresh();
  }

  return (
    <article className="post-card">
      <button
        type="button"
        className="card-link"
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        aria-label={fullThread ? "Post thread" : `Open post from ${post.author.displayName}`}
      >
        <div className="post-meta">
          <div className="post-author">
            <strong>{post.author.displayName}</strong>
            <span className="meta-line">
              @{post.author.username} • {timeAgo(post.createdAt)}
            </span>
          </div>
          <span className="privacy-badge">{visibilityLabel(post.visibility)}</span>
        </div>

        <p className="post-body">{post.body}</p>
      </button>

      <div className="stack" style={{ gap: 10 }} data-no-nav="true">
        <div className="reaction-row">
          {REACTION_EMOJIS.map((emoji) => {
            const summary = post.reactions.find((entry) => entry.emoji === emoji);
            return (
              <button
                key={emoji}
                type="button"
                className="reaction-pill"
                data-active={summary?.reacted ?? false}
                onClick={() => startTransition(() => void toggleReaction(emoji, summary?.reacted ?? false))}
                disabled={pending}
              >
                <span>{emoji}</span>
                {summary?.count ? <span>{summary.count}</span> : null}
              </button>
            );
          })}
        </div>

        <div className="comment-list">
          {post.comments.map((comment) => (
            <div key={comment.id} className="comment">
              <div className="meta-line">
                <strong>{comment.author.displayName}</strong> • {timeAgo(comment.createdAt)}
              </div>
              <p>{comment.body}</p>
            </div>
          ))}
        </div>

        {!fullThread && post.commentCount > post.comments.length ? (
          <Link className="meta-line" href={`/posts/${post.id}`}>
            View full thread • {post.commentCount} replies
          </Link>
        ) : null}

        <form className="inline-form" onSubmit={handleReply}>
          <input
            className="inline-input"
            placeholder="Leave a short supportive reply..."
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            maxLength={240}
          />
          <div className="toolbar">
            <span className="meta-line">{formatTimestamp(post.createdAt)}</span>
            <button className="ghost-button" type="submit" disabled={pending || !commentBody.trim()}>
              Reply
            </button>
          </div>
        </form>

        {error ? <div className="feedback error">{error}</div> : null}
      </div>
    </article>
  );
}
