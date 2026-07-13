"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type Mode = "login" | "signup";

export function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);

    const payload =
      mode === "login"
        ? {
            email: formData.get("email"),
            password: formData.get("password")
          }
        : {
            displayName: formData.get("displayName"),
            username: formData.get("username"),
            email: formData.get("email"),
            password: formData.get("password")
          };

    startTransition(async () => {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        setError(body.error ?? "Unable to continue.");
        return;
      }

      router.push("/feed");
      router.refresh();
    });
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <span className="eyebrow">Calm, private, friends-based</span>
        <h1 className="headline">Share devotionals, prayer requests, and honest thoughts.</h1>
        <p className="subtle">
          Sanctuary Social is designed for small trusted circles: text posts, warm replies, simple
          privacy, and a clean mobile-first experience.
        </p>

        <div className="row" style={{ marginTop: 18, flexWrap: "wrap" }}>
          <button
            type="button"
            className="chip-button"
            data-active={mode === "login"}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            className="chip-button"
            data-active={mode === "signup"}
            onClick={() => setMode("signup")}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === "signup" ? (
            <>
              <input className="field" name="displayName" placeholder="Display name" required />
              <input className="field" name="username" placeholder="Username" required />
            </>
          ) : null}

          <input className="field" name="email" type="email" placeholder="Email" required />
          <input
            className="field"
            name="password"
            type="password"
            placeholder="Password"
            required
          />

          {error ? <div className="feedback error">{error}</div> : null}

          <button className="button" disabled={pending} type="submit">
            {pending
              ? mode === "login"
                ? "Logging in..."
                : "Creating account..."
              : mode === "login"
                ? "Enter Sanctuary"
                : "Create your account"}
          </button>
        </form>
      </section>

      <section className="surface-card stack">
        <div>
          <h2 className="section-title">Try the seeded demo</h2>
          <p className="subtle" style={{ marginBottom: 0 }}>
            Email: <strong>grace@example.com</strong> • Password: <strong>sanctuary123</strong>
          </p>
        </div>
        <div className="feedback success">
          Demo data includes accepted friends, a sample feed, emoji reactions, and supportive
          replies so the MVP feels alive on first launch.
        </div>
      </section>
    </main>
  );
}
