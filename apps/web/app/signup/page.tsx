"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signup } from "../../lib/api";
import { setSession } from "../../lib/auth-store";

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await signup({ displayName, username, email, password });
      setSession(response.session.token, response.user);
      router.replace("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-layout">
      <div className="hero-panel auth-card">
        <p className="brand-kicker">Start your circle</p>
        <h1 className="brand-title">Create account</h1>
        <p className="brand-copy">Simple local sign-in for now, with room to add Google login later.</p>

        <form className="stack" onSubmit={handleSubmit}>
          <div className="field">
            <label>Display name</label>
            <input className="input" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </div>

          <div className="field">
            <label>Username</label>
            <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>

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
            Create account
          </button>

          {error ? <p className="error">{error}</p> : null}
        </form>

        <p className="brand-copy" style={{ marginTop: 20 }}>
          Already in? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
