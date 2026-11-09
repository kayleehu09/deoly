import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="auth-layout">
      <article className="hero-panel auth-card policy-page">
        <p className="brand-kicker">Draft · draft-2026-11-08</p>
        <h1 className="brand-title">Terms of Service</h1>
        <p className="policy-review-note">Draft for legal review before public launch.</p>
        <h2>Who can use Deoly</h2>
        <p>Deoly is for people age 13 and older. By creating an account, you agree to provide accurate account information and keep your password private.</p>
        <h2>Using the service</h2>
        <p>Use Deoly lawfully and respectfully. Do not harass or threaten people, impersonate others, or share content you do not have permission to post. You can block people and report posts in the app.</p>
        <h2>Your account and content</h2>
        <p>You are responsible for activity on your account and for the content you choose to share. Posts and profile information are shown according to the app’s visibility settings.</p>
        <h2>Before public launch</h2>
        <p>These are draft terms. Legal review and final service, contact, dispute, and launch-region details are still needed.</p>
        <Link className="button policy-back" href="/signup">Back to signup</Link>
      </article>
    </main>
  );
}
