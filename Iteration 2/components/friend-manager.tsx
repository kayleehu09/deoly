"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import type { FriendProfile, FriendsState } from "@/lib/contracts";

export function FriendManager({
  friendships,
  compact = false
}: {
  friendships: FriendsState;
  compact?: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FriendProfile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function refreshSearch() {
    setError(null);
    const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to search users.");
      return;
    }
    const payload = (await response.json()) as { users: FriendProfile[] };
    setResults(payload.users);
  }

  async function sendRequest(targetUserId: string) {
    const response = await fetch("/api/friends/requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ targetUserId })
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to send request.");
      return;
    }

    setResults([]);
    setQuery("");
    router.refresh();
  }

  async function mutateRequest(requestId: string, action: "accept" | "decline") {
    const response = await fetch(`/api/friends/requests/${requestId}/${action}`, {
      method: "POST"
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to update request.");
      return;
    }

    router.refresh();
  }

  async function removeFriend(friendId: string) {
    const response = await fetch(`/api/friends/${friendId}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to remove friend.");
      return;
    }

    router.refresh();
  }

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      setResults([]);
      return;
    }
    await refreshSearch();
  }

  return (
    <section className="surface-card stack">
      <div>
        <h2 className="section-title">{compact ? "Grow your circle" : "Friends & requests"}</h2>
        <p className="subtle" style={{ marginBottom: 0 }}>
          Search people by name, username, or email. Accepted friendships shape the home feed.
        </p>
      </div>

      <form className="stack" onSubmit={handleSearch}>
        <input
          className="field"
          placeholder="Search for a friend"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="ghost-button" type="submit" disabled={pending}>
          Search users
        </button>
      </form>

      {results.length > 0 ? (
        <div className="friend-grid">
          {results.map((user) => (
            <div className="friend-item" key={user.id}>
              <div>
                <strong>{user.displayName}</strong>
                <div className="meta-line">
                  @{user.username} • {user.email}
                </div>
              </div>
              <button
                className="ghost-button"
                type="button"
                onClick={() => startTransition(() => void sendRequest(user.id))}
                disabled={pending}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      ) : query.trim() ? (
        <div className="empty-state">No matching users yet. Try a different name or email.</div>
      ) : null}

      {friendships.incomingRequests.length > 0 ? (
        <div className="stack">
          <h3 className="section-title">Incoming requests</h3>
          <div className="friend-grid">
            {friendships.incomingRequests.map((request) => (
              <div className="friend-item" key={request.id}>
                <div>
                  <strong>{request.sender.displayName}</strong>
                  <div className="meta-line">@{request.sender.username}</div>
                </div>
                <div className="row">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => startTransition(() => void mutateRequest(request.id, "accept"))}
                    disabled={pending}
                  >
                    Accept
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => startTransition(() => void mutateRequest(request.id, "decline"))}
                    disabled={pending}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {friendships.outgoingRequests.length > 0 ? (
        <div className="stack">
          <h3 className="section-title">Sent requests</h3>
          <div className="friend-grid">
            {friendships.outgoingRequests.map((request) => (
              <div className="friend-item" key={request.id}>
                <div>
                  <strong>{request.receiver.displayName}</strong>
                  <div className="meta-line">@{request.receiver.username}</div>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => startTransition(() => void mutateRequest(request.id, "decline"))}
                  disabled={pending}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="stack">
        <h3 className="section-title">Current friends</h3>
        {friendships.friends.length > 0 ? (
          <div className="friend-grid">
            {friendships.friends.map((friend) => (
              <div className="friend-item" key={friend.id}>
                <div>
                  <strong>{friend.displayName}</strong>
                  <div className="meta-line">@{friend.username}</div>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => startTransition(() => void removeFriend(friend.id))}
                  disabled={pending}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No accepted friends yet. Search someone above to start.</div>
        )}
      </div>

      {error ? <div className="feedback error">{error}</div> : null}
    </section>
  );
}
