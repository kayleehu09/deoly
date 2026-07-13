import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type {
  CommentDto,
  FeedResponse,
  FriendProfile,
  FriendRequestDto,
  FriendsState,
  PostDto,
  ReactionEmoji,
  ReactionSummary,
  UserSummary,
  ViewerDto,
  Visibility
} from "@/lib/contracts";
import { REACTION_EMOJIS } from "@/lib/contracts";
import { hashPassword, verifyPassword } from "@/lib/password";
import { ApiError } from "@/lib/validation";

type SessionRecord = {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
};

let db: Database.Database | null = null;

function getDatabase() {
  if (db) {
    return db;
  }

  const dataDir = path.join(process.cwd(), "data");
  fs.mkdirSync(dataDir, { recursive: true });

  db = new Database(path.join(dataDir, "sanctuary-social.db"));
  db.pragma("journal_mode = WAL");
  initialize(db);
  return db;
}

function initialize(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      close_circle_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS friendships (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL,
      addressee_id TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(requester_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(addressee_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      body TEXT NOT NULL,
      visibility TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reactions (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(post_id, user_id, emoji),
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  seedDemoData(database);
}

function seedDemoData(database: Database.Database) {
  const existing = database.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  if (existing.count > 0) {
    return;
  }

  const now = new Date().toISOString();
  const graceId = randomUUID();
  const noahId = randomUUID();
  const miaId = randomUUID();

  const insertUser = database.prepare(`
    INSERT INTO users (id, display_name, username, email, password_hash, close_circle_count, created_at)
    VALUES (@id, @displayName, @username, @email, @passwordHash, @closeCircleCount, @createdAt)
  `);

  insertUser.run({
    id: graceId,
    displayName: "Grace Walker",
    username: "grace",
    email: "grace@example.com",
    passwordHash: hashPassword("sanctuary123"),
    closeCircleCount: 4,
    createdAt: now
  });

  insertUser.run({
    id: noahId,
    displayName: "Noah Brooks",
    username: "noah",
    email: "noah@example.com",
    passwordHash: hashPassword("sanctuary123"),
    closeCircleCount: 3,
    createdAt: now
  });

  insertUser.run({
    id: miaId,
    displayName: "Mia Chen",
    username: "mia",
    email: "mia@example.com",
    passwordHash: hashPassword("sanctuary123"),
    closeCircleCount: 5,
    createdAt: now
  });

  const insertFriendship = database.prepare(`
    INSERT INTO friendships (id, requester_id, addressee_id, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertFriendship.run(randomUUID(), graceId, noahId, "accepted", now, now);
  insertFriendship.run(randomUUID(), miaId, graceId, "accepted", now, now);

  const postOne = randomUUID();
  const postTwo = randomUUID();
  const insertPost = database.prepare(`
    INSERT INTO posts (id, author_id, body, visibility, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertPost.run(
    postOne,
    noahId,
    "Today’s devotional kept landing on the idea that peace is not the same as having every answer. Posting this so I remember it later.",
    "friends",
    new Date(Date.now() - 1000 * 60 * 70).toISOString(),
    new Date(Date.now() - 1000 * 60 * 70).toISOString()
  );

  insertPost.run(
    postTwo,
    miaId,
    "Prayer request: I have a big conversation with my parents tonight and I’d love calm words and courage.",
    "close_circle",
    new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    new Date(Date.now() - 1000 * 60 * 18).toISOString()
  );

  const insertReaction = database.prepare(`
    INSERT INTO reactions (id, post_id, user_id, emoji, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertReaction.run(randomUUID(), postOne, graceId, "🙏", now);
  insertReaction.run(randomUUID(), postTwo, graceId, "❤️", now);
  insertReaction.run(randomUUID(), postTwo, noahId, "🙏", now);

  const insertComment = database.prepare(`
    INSERT INTO comments (id, post_id, author_id, body, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertComment.run(
    randomUUID(),
    postOne,
    graceId,
    "Needed this reminder too. Thank you for sharing it here.",
    new Date(Date.now() - 1000 * 60 * 55).toISOString()
  );

  insertComment.run(
    randomUUID(),
    postTwo,
    graceId,
    "Praying for gentleness and steady nerves tonight.",
    new Date(Date.now() - 1000 * 60 * 10).toISOString()
  );
}

function mapUserSummary(row: Record<string, unknown>): UserSummary {
  return {
    id: String(row.author_id ?? row.id),
    displayName: String(row.display_name),
    username: String(row.username)
  };
}

function mapFriendProfile(row: Record<string, unknown>): FriendProfile {
  return {
    id: String(row.id),
    displayName: String(row.display_name),
    username: String(row.username),
    email: String(row.email)
  };
}

function getVisibleAuthorIds(viewerId: string) {
  const database = getDatabase();
  const rows = database
    .prepare(
      `
      SELECT requester_id, addressee_id
      FROM friendships
      WHERE status = 'accepted'
        AND (requester_id = ? OR addressee_id = ?)
    `
    )
    .all(viewerId, viewerId) as Array<{ requester_id: string; addressee_id: string }>;

  const ids = new Set<string>([viewerId]);
  rows.forEach((row) => {
    ids.add(row.requester_id === viewerId ? row.addressee_id : row.requester_id);
  });
  return Array.from(ids);
}

function getReactionSummaries(postIds: string[], viewerId: string) {
  if (postIds.length === 0) {
    return new Map<string, ReactionSummary[]>();
  }

  const database = getDatabase();
  const placeholders = postIds.map(() => "?").join(", ");
  const rows = database
    .prepare(
      `
      SELECT post_id, emoji, COUNT(*) AS count,
        SUM(CASE WHEN user_id = ? THEN 1 ELSE 0 END) AS reacted
      FROM reactions
      WHERE post_id IN (${placeholders})
      GROUP BY post_id, emoji
    `
    )
    .all(viewerId, ...postIds) as Array<{
      post_id: string;
      emoji: ReactionEmoji;
      count: number;
      reacted: number;
    }>;

  const map = new Map<string, ReactionSummary[]>();
  postIds.forEach((id) => map.set(id, []));

  rows.forEach((row) => {
    map.get(row.post_id)?.push({
      emoji: row.emoji,
      count: Number(row.count),
      reacted: Number(row.reacted) > 0
    });
  });

  map.forEach((value) => {
    value.sort(
      (left, right) =>
        REACTION_EMOJIS.indexOf(left.emoji) - REACTION_EMOJIS.indexOf(right.emoji)
    );
  });

  return map;
}

function getComments(postIds: string[], limitPerPost?: number) {
  if (postIds.length === 0) {
    return new Map<string, CommentDto[]>();
  }

  const database = getDatabase();
  const placeholders = postIds.map(() => "?").join(", ");
  const rows = database
    .prepare(
      `
      SELECT
        comments.id,
        comments.post_id,
        comments.body,
        comments.created_at,
        users.id AS author_id,
        users.display_name,
        users.username
      FROM comments
      JOIN users ON users.id = comments.author_id
      WHERE comments.post_id IN (${placeholders})
      ORDER BY comments.created_at ASC
    `
    )
    .all(...postIds) as Array<Record<string, unknown>>;

  const grouped = new Map<string, CommentDto[]>();
  postIds.forEach((id) => grouped.set(id, []));

  rows.forEach((row) => {
    const current = grouped.get(String(row.post_id));
    if (!current) {
      return;
    }

    current.push({
      id: String(row.id),
      body: String(row.body),
      createdAt: String(row.created_at),
      author: mapUserSummary(row)
    });
  });

  if (typeof limitPerPost === "number") {
    grouped.forEach((comments, id) => {
      grouped.set(id, comments.slice(-limitPerPost));
    });
  }

  return grouped;
}

function getCommentCounts(postIds: string[]) {
  if (postIds.length === 0) {
    return new Map<string, number>();
  }

  const database = getDatabase();
  const placeholders = postIds.map(() => "?").join(", ");
  const rows = database
    .prepare(
      `
      SELECT post_id, COUNT(*) AS count
      FROM comments
      WHERE post_id IN (${placeholders})
      GROUP BY post_id
    `
    )
    .all(...postIds) as Array<{ post_id: string; count: number }>;

  const counts = new Map<string, number>();
  postIds.forEach((id) => counts.set(id, 0));
  rows.forEach((row) => counts.set(row.post_id, Number(row.count)));
  return counts;
}

function mapPosts(
  rows: Array<Record<string, unknown>>,
  viewerId: string,
  commentPreviewLimit?: number
): PostDto[] {
  const postIds = rows.map((row) => String(row.id));
  const reactionMap = getReactionSummaries(postIds, viewerId);
  const commentsMap = getComments(postIds, commentPreviewLimit);
  const commentCounts = getCommentCounts(postIds);

  return rows.map((row) => ({
    id: String(row.id),
    body: String(row.body),
    visibility: row.visibility as Visibility,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    author: mapUserSummary(row),
    reactions: reactionMap.get(String(row.id)) ?? [],
    comments: commentsMap.get(String(row.id)) ?? [],
    commentCount: commentCounts.get(String(row.id)) ?? 0
  }));
}

export function createUser(input: {
  displayName: string;
  username: string;
  email: string;
  password: string;
}) {
  const database = getDatabase();
  const normalizedEmail = input.email.toLowerCase();
  const normalizedUsername = input.username.toLowerCase();

  const existing = database
    .prepare("SELECT id FROM users WHERE email = ? OR username = ?")
    .get(normalizedEmail, normalizedUsername) as { id: string } | undefined;

  if (existing) {
    throw new ApiError(409, "That email or username is already in use.");
  }

  const id = randomUUID();
  database
    .prepare(
      `
      INSERT INTO users (id, display_name, username, email, password_hash, close_circle_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      id,
      input.displayName,
      normalizedUsername,
      normalizedEmail,
      hashPassword(input.password),
      0,
      new Date().toISOString()
    );

  return findUserById(id);
}

export function authenticateUser(email: string, password: string) {
  const database = getDatabase();
  const row = database
    .prepare(
      `
      SELECT id, display_name, username, email, password_hash, close_circle_count, created_at
      FROM users
      WHERE email = ?
    `
    )
    .get(email.toLowerCase()) as
    | {
        id: string;
        display_name: string;
        username: string;
        email: string;
        password_hash: string;
        close_circle_count: number;
        created_at: string;
      }
    | undefined;

  if (!row || !verifyPassword(password, row.password_hash)) {
    throw new ApiError(401, "Incorrect email or password.");
  }

  return {
    id: row.id,
    displayName: row.display_name,
    username: row.username,
    email: row.email,
    closeCircleCount: Number(row.close_circle_count)
  };
}

export function findUserById(userId: string): ViewerDto | null {
  const database = getDatabase();
  const row = database
    .prepare(
      `
      SELECT id, display_name, username, email, close_circle_count
      FROM users
      WHERE id = ?
    `
    )
    .get(userId) as
    | {
        id: string;
        display_name: string;
        username: string;
        email: string;
        close_circle_count: number;
      }
    | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    displayName: row.display_name,
    username: row.username,
    email: row.email,
    closeCircleCount: Number(row.close_circle_count)
  };
}

export function createSession(userId: string, token: string) {
  const database = getDatabase();
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14);

  database
    .prepare(
      `
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(randomUUID(), userId, token, expires.toISOString(), now.toISOString());
}

export function findSession(token: string): SessionRecord | null {
  const database = getDatabase();
  const row = database
    .prepare(
      `
      SELECT id, user_id, token, expires_at
      FROM sessions
      WHERE token = ?
    `
    )
    .get(token) as
    | {
        id: string;
        user_id: string;
        token: string;
        expires_at: string;
      }
    | undefined;

  if (!row) {
    return null;
  }

  if (new Date(row.expires_at) < new Date()) {
    revokeSession(token);
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at
  };
}

export function revokeSession(token: string) {
  getDatabase().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export function getFeedForUser(userId: string): FeedResponse {
  const database = getDatabase();
  const visibleIds = getVisibleAuthorIds(userId);
  const placeholders = visibleIds.map(() => "?").join(", ");
  const rows = database
    .prepare(
      `
      SELECT
        posts.id,
        posts.body,
        posts.visibility,
        posts.created_at,
        posts.updated_at,
        users.id AS author_id,
        users.display_name,
        users.username
      FROM posts
      JOIN users ON users.id = posts.author_id
      WHERE posts.author_id IN (${placeholders})
      ORDER BY posts.created_at DESC
    `
    )
    .all(...visibleIds) as Array<Record<string, unknown>>;

  return {
    viewer: findUserById(userId)!,
    posts: mapPosts(rows, userId, 2),
    friendships: getFriendsState(userId)
  };
}

export function getPostForUser(postId: string, viewerId: string) {
  const database = getDatabase();
  const visibleIds = getVisibleAuthorIds(viewerId);
  const placeholders = visibleIds.map(() => "?").join(", ");
  const row = database
    .prepare(
      `
      SELECT
        posts.id,
        posts.body,
        posts.visibility,
        posts.created_at,
        posts.updated_at,
        users.id AS author_id,
        users.display_name,
        users.username
      FROM posts
      JOIN users ON users.id = posts.author_id
      WHERE posts.id = ?
        AND posts.author_id IN (${placeholders})
      LIMIT 1
    `
    )
    .get(postId, ...visibleIds) as Record<string, unknown> | undefined;

  if (!row) {
    throw new ApiError(404, "Post not found.");
  }

  return mapPosts([row], viewerId)[0];
}

export function createPost(input: { authorId: string; body: string; visibility: Visibility }) {
  const database = getDatabase();
  const id = randomUUID();
  const now = new Date().toISOString();
  database
    .prepare(
      `
      INSERT INTO posts (id, author_id, body, visibility, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .run(id, input.authorId, input.body, input.visibility, now, now);

  return getPostForUser(id, input.authorId);
}

export function addReaction(input: { postId: string; userId: string; emoji: ReactionEmoji }) {
  getPostForUser(input.postId, input.userId);
  const database = getDatabase();
  database
    .prepare(
      `
      INSERT OR IGNORE INTO reactions (id, post_id, user_id, emoji, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(randomUUID(), input.postId, input.userId, input.emoji, new Date().toISOString());
  return getPostForUser(input.postId, input.userId);
}

export function removeReaction(input: { postId: string; userId: string; emoji: ReactionEmoji }) {
  const database = getDatabase();
  database
    .prepare("DELETE FROM reactions WHERE post_id = ? AND user_id = ? AND emoji = ?")
    .run(input.postId, input.userId, input.emoji);
  return getPostForUser(input.postId, input.userId);
}

export function addComment(input: { postId: string; userId: string; body: string }) {
  getPostForUser(input.postId, input.userId);
  const database = getDatabase();
  database
    .prepare(
      `
      INSERT INTO comments (id, post_id, author_id, body, created_at)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(randomUUID(), input.postId, input.userId, input.body, new Date().toISOString());

  return getPostForUser(input.postId, input.userId);
}

export function searchUsers(query: string, viewerId: string) {
  const database = getDatabase();
  const like = `%${query.toLowerCase()}%`;
  return (
    database
      .prepare(
        `
        SELECT id, display_name, username, email
        FROM users
        WHERE id != ?
          AND (
            LOWER(display_name) LIKE ?
            OR LOWER(username) LIKE ?
            OR LOWER(email) LIKE ?
          )
        ORDER BY display_name ASC
        LIMIT 10
      `
      )
      .all(viewerId, like, like, like) as Array<Record<string, unknown>>
  ).map(mapFriendProfile);
}

export function getFriendsState(userId: string): FriendsState {
  const database = getDatabase();

  const friends = (
    database
      .prepare(
        `
        SELECT users.id, users.display_name, users.username, users.email
        FROM friendships
        JOIN users ON users.id = CASE
          WHEN friendships.requester_id = ? THEN friendships.addressee_id
          ELSE friendships.requester_id
        END
        WHERE friendships.status = 'accepted'
          AND (? IN (friendships.requester_id, friendships.addressee_id))
        ORDER BY users.display_name ASC
      `
      )
      .all(userId, userId) as Array<Record<string, unknown>>
  ).map(mapFriendProfile);

  const requests = database
    .prepare(
      `
      SELECT
        friendships.id,
        friendships.created_at,
        sender.id AS sender_id,
        sender.display_name AS sender_display_name,
        sender.username AS sender_username,
        sender.email AS sender_email,
        receiver.id AS receiver_id,
        receiver.display_name AS receiver_display_name,
        receiver.username AS receiver_username,
        receiver.email AS receiver_email
      FROM friendships
      JOIN users sender ON sender.id = friendships.requester_id
      JOIN users receiver ON receiver.id = friendships.addressee_id
      WHERE friendships.status = 'pending'
        AND (? IN (friendships.requester_id, friendships.addressee_id))
      ORDER BY friendships.created_at DESC
    `
    )
    .all(userId) as Array<Record<string, unknown>>;

  const incomingRequests: FriendRequestDto[] = [];
  const outgoingRequests: FriendRequestDto[] = [];

  requests.forEach((row) => {
    const payload = {
      id: String(row.id),
      createdAt: String(row.created_at),
      sender: {
        id: String(row.sender_id),
        displayName: String(row.sender_display_name),
        username: String(row.sender_username),
        email: String(row.sender_email)
      },
      receiver: {
        id: String(row.receiver_id),
        displayName: String(row.receiver_display_name),
        username: String(row.receiver_username),
        email: String(row.receiver_email)
      }
    };

    if (payload.receiver.id === userId) {
      incomingRequests.push(payload);
    } else {
      outgoingRequests.push(payload);
    }
  });

  return {
    friends,
    incomingRequests,
    outgoingRequests
  };
}

function findRelationship(userId: string, targetUserId: string) {
  const database = getDatabase();
  return database
    .prepare(
      `
      SELECT id, requester_id, addressee_id, status
      FROM friendships
      WHERE (requester_id = ? AND addressee_id = ?)
         OR (requester_id = ? AND addressee_id = ?)
      LIMIT 1
    `
    )
    .get(userId, targetUserId, targetUserId, userId) as
    | { id: string; requester_id: string; addressee_id: string; status: string }
    | undefined;
}

export function sendFriendRequest(userId: string, targetUserId: string) {
  if (userId === targetUserId) {
    throw new ApiError(400, "You cannot add yourself.");
  }

  const database = getDatabase();
  const target = findUserById(targetUserId);
  if (!target) {
    throw new ApiError(404, "User not found.");
  }

  const relationship = findRelationship(userId, targetUserId);
  if (relationship) {
    throw new ApiError(409, "That connection already exists or is pending.");
  }

  const now = new Date().toISOString();
  database
    .prepare(
      `
      INSERT INTO friendships (id, requester_id, addressee_id, status, created_at, updated_at)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `
    )
    .run(randomUUID(), userId, targetUserId, now, now);

  return getFriendsState(userId);
}

export function acceptFriendRequest(requestId: string, userId: string) {
  const database = getDatabase();
  const request = database
    .prepare(
      `
      SELECT id, addressee_id, status
      FROM friendships
      WHERE id = ?
    `
    )
    .get(requestId) as { id: string; addressee_id: string; status: string } | undefined;

  if (!request || request.addressee_id !== userId || request.status !== "pending") {
    throw new ApiError(404, "Friend request not found.");
  }

  database
    .prepare("UPDATE friendships SET status = 'accepted', updated_at = ? WHERE id = ?")
    .run(new Date().toISOString(), requestId);

  return getFriendsState(userId);
}

export function declineFriendRequest(requestId: string, userId: string) {
  const database = getDatabase();
  const request = database
    .prepare(
      `
      SELECT id, addressee_id, requester_id
      FROM friendships
      WHERE id = ?
    `
    )
    .get(requestId) as { id: string; addressee_id: string; requester_id: string } | undefined;

  if (!request || ![request.addressee_id, request.requester_id].includes(userId)) {
    throw new ApiError(404, "Friend request not found.");
  }

  database.prepare("DELETE FROM friendships WHERE id = ?").run(requestId);
  return getFriendsState(userId);
}

export function removeFriend(friendUserId: string, userId: string) {
  const database = getDatabase();
  const relationship = database
    .prepare(
      `
      SELECT id, status
      FROM friendships
      WHERE status = 'accepted'
        AND ((requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?))
      LIMIT 1
    `
    )
    .get(userId, friendUserId, friendUserId, userId) as
    | { id: string; status: string }
    | undefined;

  if (!relationship) {
    throw new ApiError(404, "Friend not found.");
  }

  database.prepare("DELETE FROM friendships WHERE id = ?").run(relationship.id);
  return getFriendsState(userId);
}
