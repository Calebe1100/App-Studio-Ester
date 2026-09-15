"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/shell/AppShell";

interface ProtectedShellProps {
  children: ReactNode;
  roles?: Array<"dono" | "recepcao" | "profissional">;
}

/**
 * Combina AuthGuard + AppShell.
 * Use nas pages que exigem login e mostram a navegação do app.
 */
export function ProtectedShell({ children, roles }: ProtectedShellProps) {
  return (
    <AuthGuard roles={roles}>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
