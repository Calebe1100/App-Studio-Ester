import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-wine-deep">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-gold/15 to-transparent" />
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-10">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="rounded-3xl border border-gold/25 bg-paper p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)]">
          <h1 className="font-display text-3xl text-wine">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
