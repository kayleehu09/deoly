"use client";

const TOKEN_KEY = "sanctuary.session.token";
const USER_KEY = "sanctuary.session.user";

export function getSessionToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(TOKEN_KEY);
}

export function setSession(token: string, user: unknown) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getStoredUser<T>() {
  if (typeof window === "undefined") {
    return null as T | null;
  }

  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}
