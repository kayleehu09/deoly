"use client";

import { useState } from "react";
import { POST_MAX_LENGTH, POST_VISIBILITIES, type PostVisibility } from "@deoly/shared";
import { createPost } from "../lib/api";

const privacyOptions: Array<{ value: PostVisibility; label: string }> = [
  { value: "friends", label: "Friends only" },
  { value: "close_circle", label: "Close circle" }
];

export function PostComposer({ onCreated }: { onCreated: () => Promise<void> }) {
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>(POST_VISIBILITIES[0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!body.trim()) {
      return;
    }

    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      await createPost({ body: body.trim(), visibility });
      setBody("");
      setMessage(`Posted to ${visibility === "close_circle" ? "your close circle" : "your friends feed"}.`);
      await onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface-card stack">
      <div className="toolbar">
        <div>
          <h2 className="section-title">Post something meaningful</h2>
          <p className="meta-line" style={{ margin: "4px 0 0" }}>
            Devotional, prayer request, or just an honest thought.
          </p>
        </div>
        <span className="privacy-badge">{body.length}/{POST_MAX_LENGTH}</span>
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <textarea
          className="textarea"
          maxLength={POST_MAX_LENGTH}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="What feels worth sharing with your circle today?"
        />

        <div className="stack" style={{ gap: 10 }}>
          <div className="meta-line">Choose who this is for</div>
          <div className="nav-row" role="radiogroup" aria-label="Post privacy">
          {privacyOptions.map((option) => (
            <button
              key={option.value}
              type="button"
                className="chip-button"
                data-active={visibility === option.value}
              aria-checked={visibility === option.value}
              role="radio"
              onClick={() => setVisibility(option.value)}
            >
              {option.label}
            </button>
          ))}
          </div>
          <p className="subtle" style={{ margin: 0, fontSize: "0.92rem" }}>
            {visibility === "close_circle"
              ? "Marked for your close circle. The backend is ready for stricter filtering once close-circle membership is added."
              : "Visible across your accepted friends."}
          </p>
        </div>

        {message ? <div className="feedback success">{message}</div> : null}
        {error ? <div className="feedback error">{error}</div> : null}

        <button className="button" type="submit" disabled={busy || !body.trim()}>
          {busy ? "Publishing..." : "Share to your circle"}
        </button>
      </form>
    </section>
  );
}
