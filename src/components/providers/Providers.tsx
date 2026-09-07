"use client";

import { SalonProvider } from "@/context/SalonContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <SalonProvider>{children}</SalonProvider>;
}
