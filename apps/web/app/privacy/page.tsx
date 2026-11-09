import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="auth-layout">
      <article className="hero-panel auth-card policy-page">
        <p className="brand-kicker">Draft · draft-2026-11-08</p>
        <h1 className="brand-title">Privacy Notice</h1>
        <p className="policy-review-note">Draft for legal review before public launch.</p>
        <h2>Information used by Deoly</h2>
        <p>Deoly processes the display name, username, and email you provide to create your account. Passwords are stored as protected hashes. The date of birth entered at signup is checked for eligibility and is not saved to your account.</p>
        <p>If you add profile details, photos, posts, comments, reactions, friend connections, blocks, or reports, Deoly processes those details to provide the app’s social and safety features.</p>
        <h2>How information is used and shared</h2>
        <p>Deoly uses account and activity information to operate the service, show content according to the app’s visibility settings, and provide safety features. People who can see a post or profile depend on the app’s visibility settings.</p>
        <h2>Account deletion</h2>
        <p>You can request account deletion from the app’s settings. The app removes account-related records; some stored photos may be scheduled for cleanup separately.</p>
        <h2>Before public launch</h2>
        <p>This is a draft. Legal review and confirmed details about service providers, retention periods, launch regions, and a support contact are still needed.</p>
        <Link className="button policy-back" href="/signup">Back to signup</Link>
      </article>
    </main>
  );
}
