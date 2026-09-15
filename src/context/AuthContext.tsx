"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  apiLogin,
  apiLogout,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  setStoredUser,
  getStoredUser,
  clearSession,
  type AuthUser,
} from "@/lib/api";

// ──────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);

  // Na montagem: verifica se há refresh token salvo e tenta restaurar sessão
  useEffect(() => {
    async function restore() {
      const rt = getRefreshToken();
      if (!rt) {
        setStatus("unauthenticated");
        return;
      }

      try {
        // Renova silenciosamente o access token
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/api/auth/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: rt }),
          }
        );

        if (!res.ok) {
          clearSession();
          setStatus("unauthenticated");
          return;
        }

        const data = await res.json();
        setAccessToken(data.accessToken);

        // Decodifica o payload do JWT para obter dados do usuário
        // Restaura dados do usuário do localStorage (gravados no login)
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
        } else {
          // Fallback: extrai do payload JWT
          const payload = parseJwtPayload(data.accessToken);
          if (payload) {
            setUser({
              id: String(payload.sub ?? ""),
              name: "",
              email: "",
              role: (payload.role as AuthUser["role"]) ?? "profissional",
            });
          }
        }

        // Salva novo refresh token (rotação)
        setRefreshToken(data.refreshToken);
        setStoredUser(storedUser); // mantém dados do usuário
        setStatus("authenticated");
      } catch {
        clearSession();
        setStatus("unauthenticated");
      }
    }

    restore();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password); // lança ApiError se falhar
    setUser(data.user);
    setStatus("authenticated");
    router.replace("/agenda");
  }, [router]);

  const logout = useCallback(async () => {
    setStatus("unauthenticated");
    setUser(null);
    await apiLogout();
    router.replace("/login");
  }, [router]);

  const value = useMemo(
    () => ({ status, user, login, logout }),
    [status, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de AuthProvider");
  return ctx;
}

// ──────────────────────────────────────────────
// Util
// ──────────────────────────────────────────────

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
