"use client";

import { useEffect, useState } from "react";
import type { FriendsListItem, SearchUserResult } from "@sanctuary/shared";
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriends,
  removeFriend,
  searchUsers,
  sendFriendRequest
} from "../lib/api";

export function FriendManager({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUserResult[]>([]);
  const [friends, setFriends] = useState<FriendsListItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshFriends() {
    const response = await getFriends();
    setFriends(response.friends);
  }

  async function refreshSearch(nextQuery = query) {
    const response = await searchUsers(nextQuery);
    setResults(response.users);
  }

  async function refreshAll(nextQuery = query) {
    setError(null);
    try {
      await Promise.all([refreshFriends(), refreshSearch(nextQuery)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh friend data.");
    }
  }

  useEffect(() => {
    refreshAll("");
  }, []);

  async function runMutation(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update friendships.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await refreshSearch(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not search users.");
    } finally {
      setBusy(false);
    }
  }

  const incoming = friends.filter((entry) => entry.direction === "incoming");
  const outgoing = friends.filter((entry) => entry.direction === "outgoing");
  const accepted = friends.filter((entry) => entry.direction === "accepted");

  return (
    <section className="surface-card stack">
      <div>
        <h2 className="section-title">{compact ? "Grow your circle" : "Friends & requests"}</h2>
        <p className="subtle" style={{ marginBottom: 0 }}>
          Search people by name or username. Accepted friendships shape the home feed.
        </p>
      </div>

      <form className="stack" onSubmit={handleSearch}>
        <input
          className="input"
          placeholder="Search for a friend"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="ghost-button" type="submit" disabled={busy}>
          Search users
        </button>
      </form>

      {results.length > 0 ? (
        <div className="friend-grid">
          {results.map((user) => (
            <div className="friend-item" key={user.id}>
              <div>
                <strong>{user.displayName}</strong>
                <div className="meta-line">@{user.username}</div>
              </div>
              {user.friendshipStatus === "none" ? (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => runMutation(() => sendFriendRequest(user.id))}
                  disabled={busy}
                >
                  Add
                </button>
              ) : (
                <span className="privacy-badge">{user.friendshipStatus.replace("_", " ")}</span>
              )}
            </div>
          ))}
        </div>
      ) : query.trim() ? (
        <div className="empty-state">No matching users yet. Try a different name or username.</div>
      ) : null}

      {incoming.length > 0 ? (
        <div className="stack">
          <h3 className="section-title">Incoming requests</h3>
          <div className="friend-grid">
            {incoming.map((entry) => (
              <div className="friend-item" key={entry.friendshipId}>
                <div>
                  <strong>{entry.user.displayName}</strong>
                  <div className="meta-line">@{entry.user.username}</div>
                </div>
                <div className="row">
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => runMutation(() => acceptFriendRequest(entry.friendshipId))}
                    disabled={busy}
                  >
                    Accept
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => runMutation(() => declineFriendRequest(entry.friendshipId))}
                    disabled={busy}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {outgoing.length > 0 ? (
        <div className="stack">
          <h3 className="section-title">Sent requests</h3>
          <div className="friend-grid">
            {outgoing.map((entry) => (
              <div className="friend-item" key={entry.friendshipId}>
                <div>
                  <strong>{entry.user.displayName}</strong>
                  <div className="meta-line">@{entry.user.username}</div>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => runMutation(() => removeFriend(entry.friendshipId))}
                  disabled={busy}
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
        {accepted.length > 0 ? (
          <div className="friend-grid">
            {accepted.map((entry) => (
              <div className="friend-item" key={entry.friendshipId}>
                <div>
                  <strong>{entry.user.displayName}</strong>
                  <div className="meta-line">@{entry.user.username}</div>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => runMutation(() => removeFriend(entry.friendshipId))}
                  disabled={busy}
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
