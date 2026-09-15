"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

interface AuthGuardProps {
  children: ReactNode;
  /** Papéis permitidos. Se omitido, qualquer usuário autenticado tem acesso. */
  roles?: Array<"dono" | "recepcao" | "profissional">;
}

/**
 * Protege rotas que exigem autenticação (e opcionalmente papel específico).
 *
 * - status "loading"         → mostra spinner enquanto restaura sessão
 * - status "unauthenticated" → redireciona para /login
 * - role insuficiente        → redireciona para /agenda (acesso negado)
 * - autenticado + role ok    → renderiza os filhos
 */
export function AuthGuard({ children, roles }: AuthGuardProps) {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && roles && user && !roles.includes(user.role)) {
      router.replace("/agenda"); // acesso negado → redireciona para agenda
    }
  }, [status, user, roles, router]);

  // Carregando sessão
  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="animate-pulse text-sm text-ink-soft">Carregando…</span>
      </div>
    );
  }

  // Não autenticado ou papel insuficiente — evita flash de conteúdo
  if (status === "unauthenticated") return null;
  if (roles && user && !roles.includes(user.role)) return null;

  return <>{children}</>;
}
