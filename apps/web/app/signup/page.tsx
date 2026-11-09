"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signup } from "../../lib/api";
import { setSession } from "../../lib/auth-store";

const TERMS_VERSION = "draft-2026-11-08";
const PRIVACY_NOTICE_VERSION = "draft-2026-11-08";

function isAtLeast13(dateOfBirth: string) {
  const [year, month, day] = dateOfBirth.split("-").map(Number);
  const today = new Date();
  let age = today.getUTCFullYear() - year;
  if (today.getUTCMonth() + 1 < month || (today.getUTCMonth() + 1 === month && today.getUTCDate() < day)) age -= 1;
  return age >= 13;
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"age" | "details">("age");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [ageDenied, setAgeDenied] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (step === "age") {
      if (!isAtLeast13(dateOfBirth)) {
        setDateOfBirth("");
        setAgeDenied(true);
        setError("Deoly is for people age 13 and older. You can’t create an account.");
        return;
      }
      setStep("details");
      return;
    }

    if (!acceptedPolicies) {
      setError("Please agree to the Terms and acknowledge the Privacy Notice to continue.");
      return;
    }

    setBusy(true);
    try {
      const response = await signup({
        displayName,
        username,
        email,
        password,
        dateOfBirth,
        termsVersion: TERMS_VERSION,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
        acceptedPolicies: true
      });
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
        <p className="brand-copy">{step === "age" ? "First, enter your date of birth to check eligibility." : "Choose your name, username, and password."}</p>

        <form className="stack" onSubmit={handleSubmit}>
          {step === "age" ? (
            <div className="field">
              <label htmlFor="date-of-birth">Date of birth</label>
              <input
                className="input"
                id="date-of-birth"
                type="date"
                required
                disabled={ageDenied}
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="field">
                <label htmlFor="display-name">Display name</label>
                <input className="input" id="display-name" autoComplete="name" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="username">Username</label>
                <input className="input" id="username" autoComplete="username" required value={username} onChange={(event) => setUsername(event.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="email">Email</label>
                <input className="input" id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
              </div>

              <div className="field">
                <label htmlFor="password">Password</label>
                <input className="input" id="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={password} onChange={(event) => setPassword(event.target.value)} />
              </div>

              <label className="policy-acceptance">
                <input type="checkbox" checked={acceptedPolicies} onChange={(event) => setAcceptedPolicies(event.target.checked)} />
                <span>I agree to the <Link href="/terms">Terms of Service</Link> and acknowledge the <Link href="/privacy">Privacy Notice</Link>.</span>
              </label>
            </>
          )}

          {error ? <p className="error" role="alert">{error}</p> : null}

          <button className="button" type="submit" disabled={busy || ageDenied || (step === "details" && !acceptedPolicies)}>
            {step === "age" ? (ageDenied ? "Not eligible" : "Continue") : busy ? "Creating account..." : "Create account"}
          </button>
          {step === "details" ? <button className="button secondary" type="button" onClick={() => { setStep("age"); setAcceptedPolicies(false); setError(null); }}>Back</button> : null}
        </form>

        <p className="brand-copy" style={{ marginTop: 20 }}>
          Already in? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
