import type { AuthResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

async function request(path: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, { ...init, cache: "no-store" });
  } catch {
    throw new Error(
      `Cannot reach the API at ${API_URL}. Start the Django backend and MongoDB, then try again.`
    );
  }
}

function storage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function saveTokens(access: string, refresh: string) {
  storage()?.setItem("tracker_access", access);
  storage()?.setItem("tracker_refresh", refresh);
}

export function clearTokens() {
  storage()?.removeItem("tracker_access");
  storage()?.removeItem("tracker_refresh");
}

export function hasSession() {
  return Boolean(storage()?.getItem("tracker_refresh"));
}

async function parseResponse(response: Response) {
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({ detail: "Unexpected server response." }));
  if (!response.ok) {
    const detail =
      body.detail ??
      Object.values(body)
        .flat()
        .join(" ") ??
      "Request failed.";
    throw new Error(String(detail));
  }
  return body;
}

async function refreshAccessToken() {
  const refresh = storage()?.getItem("tracker_refresh");
  if (!refresh) throw new Error("Your session has ended. Please sign in again.");

  const response = await request("/auth/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  const data = (await parseResponse(response)) as Pick<AuthResponse, "access" | "refresh">;
  saveTokens(data.access, data.refresh);
  return data.access;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const access = storage()?.getItem("tracker_access");
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const response = await request(path, { ...init, headers });
  if (response.status === 401 && retry && storage()?.getItem("tracker_refresh")) {
    try {
      const freshAccess = await refreshAccessToken();
      headers.set("Authorization", `Bearer ${freshAccess}`);
      return apiFetch<T>(path, { ...init, headers }, false);
    } catch (error) {
      clearTokens();
      throw error;
    }
  }
  return parseResponse(response) as Promise<T>;
}

export async function authenticate(path: "login" | "register", payload: object) {
  const data = await apiFetch<AuthResponse>(`/auth/${path}/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  saveTokens(data.access, data.refresh);
  return data;
}
