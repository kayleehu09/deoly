"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "../../lib/api";
import { setSession } from "../../lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("ava@example.com");
  const [password, setPassword] = useState("password123");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await login({ email, password });
      setSession(response.session.token, response.user);
      router.replace("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <div className="hero-panel auth-card">
        <p className="brand-kicker">Invite-only circle</p>
        <h1 className="brand-title">Sanctuary</h1>
        <p className="brand-copy">
          A calm place for devotionals, prayer requests, and honest thoughts with close friends.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          <div className="field">
            <label>Email</label>
            <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <button className="button" type="submit" disabled={busy}>
            Sign in
          </button>

          {error ? <p className="error">{error}</p> : null}
        </form>

        <p className="brand-copy" style={{ marginTop: 20 }}>
          Need an account? <Link href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  );
}
