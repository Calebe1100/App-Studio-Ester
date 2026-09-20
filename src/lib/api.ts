/**
 * Cliente HTTP centralizado para a API do backend.
 * Injeta o access token automaticamente e lida com refresh transparente.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://studio-ester.vercel.app";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "dono" | "recepcao" | "profissional";
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

// ──────────────────────────────────────────────
// Storage helpers (access token fica em memória; refresh no localStorage)
// ──────────────────────────────────────────────

const REFRESH_KEY = "studio_ester_rt";
const USER_KEY = "studio_ester_user";

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken() {
  return _accessToken;
}

export function setRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(REFRESH_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_KEY);
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setStoredUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// Core fetch com auth
// ──────────────────────────────────────────────

type FetchOptions = RequestInit & { skipAuth?: boolean };

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { skipAuth, ...init } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };

  if (!skipAuth && _accessToken) {
    headers["Authorization"] = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  // Token expirado → tenta renovar uma vez
  if (res.status === 401 && !skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers["Authorization"] = `Bearer ${_accessToken}`;
      const retry = await fetch(`${API_BASE}${path}`, { ...init, headers });
      if (!retry.ok) throw new ApiError(retry.status, await retry.text());
      return retry.json() as Promise<T>;
    }
    // Refresh falhou → limpa sessão
    clearSession();
    throw new ApiError(401, "Sessão expirada. Faça login novamente.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body?.error ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ──────────────────────────────────────────────
// Auth endpoints
// ──────────────────────────────────────────────

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setAccessToken(data.accessToken);
  setRefreshToken(data.refreshToken);
  setStoredUser(data.user);
  return data;
}

export async function apiLogout(): Promise<void> {
  const rt = getRefreshToken();
  if (rt) {
    await apiFetch("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken: rt }),
    }).catch(() => {/* logout é best-effort */});
  }
  clearSession();
}

/** Dispara o envio do código de recuperação para o celular (WhatsApp/SMS). */
export async function apiForgotPassword(phone: string): Promise<{ expiresInMinutes: number }> {
  return apiFetch<{ message: string; expiresInMinutes: number }>(
    "/api/auth/forgot-password",
    {
      method: "POST",
      body: JSON.stringify({ phone }),
      skipAuth: true,
    },
  );
}

/** Troca o código recebido no celular por um token de redefinição. */
export async function apiVerifyResetCode(
  phone: string,
  code: string,
): Promise<{ resetToken: string; expiresIn: number }> {
  return apiFetch("/api/auth/verify-reset-code", {
    method: "POST",
    body: JSON.stringify({ phone, code }),
    skipAuth: true,
  });
}

export async function apiResetPassword(token: string, password: string): Promise<void> {
  await apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
    skipAuth: true,
  });
}

// ──────────────────────────────────────────────
// Helpers internos
// ──────────────────────────────────────────────

async function tryRefresh(): Promise<boolean> {
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const data = await apiFetch<AuthTokens>("/api/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: rt }),
      skipAuth: true,
    });
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export function clearSession() {
  setAccessToken(null);
  setRefreshToken(null);
  setStoredUser(null);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
