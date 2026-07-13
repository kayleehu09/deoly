"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { VISIBILITY_OPTIONS, type Visibility } from "@/lib/contracts";

export function Composer() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("friends");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ body, visibility })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "Unable to publish.");
        return;
      }

      setBody("");
      setVisibility("friends");
      router.refresh();
    });
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
      </div>

      <form className="stack" onSubmit={handleSubmit}>
        <textarea
          className="textarea"
          placeholder="What feels worth sharing with your circle today?"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={500}
        />

        <div className="stack" style={{ gap: 10 }}>
          <div className="meta-line">Choose who this is for</div>
          <div className="nav-row">
            {VISIBILITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className="chip-button"
                data-active={visibility === option.value}
                onClick={() => setVisibility(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="subtle" style={{ fontSize: "0.92rem" }}>
            {VISIBILITY_OPTIONS.find((option) => option.value === visibility)?.description}
          </div>
        </div>

        {error ? <div className="feedback error">{error}</div> : null}

        <button className="button" type="submit" disabled={pending || !body.trim()}>
          {pending ? "Publishing..." : "Share to your circle"}
        </button>
      </form>
    </section>
  );
}
