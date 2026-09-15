"use client";

import { SalonProvider } from "@/context/SalonContext";
import { AuthProvider } from "@/context/AuthContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <SalonProvider>{children}</SalonProvider>
    </AuthProvider>
  );
}
