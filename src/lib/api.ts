"use client";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api";
export const BACKEND_ORIGIN = API_BASE.replace(/\/api$/, "");

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface FetchOptions {
  method?: HttpMethod;
  body?: any;
  headers?: Record<string, string>;
  retry?: boolean; // internal use to avoid infinite loop
}

async function refreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    return "ok";
  } catch (err) {
    // ignore
  }
  return null;
}

export async function apiFetch<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = { ...(options.headers || {}) };

  let body = options.body;
  if (body && typeof body === "object" && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    method: options.method || "GET",
    body: body as BodyInit | undefined,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && !options.retry) {
    const newToken = await refreshToken();
    if (newToken) {
      return apiFetch<T>(path, { ...options, retry: true });
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  if (res.status === 204) {
    // no content
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export const authApi = {
  async bootstrapSession() {
    const token = await refreshToken();
    if (!token) return null;
    return authApi.getProfile();
  },
  async login(credentials: { email: string; password: string }) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: credentials,
    });
    return data;
  },
  async logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      // access token은 쿠키 기반으로 관리하므로 추가 처리 없음
    }
  },
  async getProfile() {
    return apiFetch("/me");
  },
};

export function getOAuthUrl(provider: "google" | "kakao" | "naver") {
  return `${BACKEND_ORIGIN}/oauth2/authorization/${provider}`;
}
