"use client";

export const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000/api/v1";

export function getAccessToken() {
  return localStorage.getItem("atechskills_access_token");
}

export function getRefreshToken() {
  return localStorage.getItem("atechskills_refresh_token");
}

export function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function refreshSession() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${apiBase}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
  if (!response.ok) {
    localStorage.removeItem("atechskills_access_token");
    localStorage.removeItem("atechskills_refresh_token");
    localStorage.removeItem("atechskills_user");
    window.dispatchEvent(new Event("atechskills:auth-changed"));
    return false;
  }

  const data = await response.json();
  if (data.accessToken) localStorage.setItem("atechskills_access_token", data.accessToken);
  if (data.refreshToken) localStorage.setItem("atechskills_refresh_token", data.refreshToken);
  if (data.user) localStorage.setItem("atechskills_user", JSON.stringify(data.user));
  window.dispatchEvent(new Event("atechskills:auth-changed"));
  return Boolean(data.accessToken);
}

export async function ensureFreshSession() {
  return Boolean(getAccessToken()) || refreshSession();
}

export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, value));
  let response = await fetch(input, { ...init, headers });

  if ((response.status === 401 || response.status === 403) && await refreshSession()) {
    const retryHeaders = new Headers(init.headers);
    Object.entries(authHeaders()).forEach(([key, value]) => retryHeaders.set(key, value));
    response = await fetch(input, { ...init, headers: retryHeaders });
  }

  return response;
}
