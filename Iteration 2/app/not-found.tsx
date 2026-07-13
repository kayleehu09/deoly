import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell">
      <section className="hero-card stack">
        <span className="eyebrow">Not found</span>
        <h1 className="headline">That thread is missing or private.</h1>
        <p className="subtle">
          The post may have been removed, or it may not be visible from your current friendships.
        </p>
        <Link className="button" href="/feed">
          Return to feed
        </Link>
      </section>
    </main>
  );
}
