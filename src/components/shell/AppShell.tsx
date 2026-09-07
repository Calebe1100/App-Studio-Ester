"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";

const nav = [
  { href: "/agenda", label: "Agenda", hint: "Operação" },
  { href: "/clientes", label: "Clientes", hint: "Cadastros" },
  { href: "/profissionais", label: "Profissionais", hint: "Cadastros" },
  { href: "/gerenciamento", label: "Gerenciamento", hint: "Backoffice" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[248px_1fr]">
      <aside className="hidden bg-wine-deep md:flex md:flex-col md:p-5">
        <Logo size="wide" />
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2.5 ${
                  active ? "bg-gold text-wine-deep" : "text-gold-bright/80 hover:bg-wine-hover"
                }`}
              >
                <span className="block text-sm font-medium">{item.label}</span>
                <span className={`text-xs ${active ? "text-wine/70" : "text-gold/60"}`}>{item.hint}</span>
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto pt-8 text-[11px] uppercase tracking-[0.18em] text-gold/50">
          Studio de Beleza
        </p>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between border-b border-line bg-paper px-4 py-3 md:px-8">
          <div className="md:hidden">
            <Logo size="sm" />
          </div>
          <p className="hidden font-display text-sm tracking-wide text-wine md:block">Ana Ester · Agenda</p>
          <Link className="text-sm font-medium text-wine" href="/login">
            Sair
          </Link>
        </header>
        <main className="flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 grid grid-cols-3 border-t border-line bg-paper md:hidden">
          {nav
            .filter((item) => ["Agenda", "Clientes", "Gerenciamento"].includes(item.label))
            .map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`py-3 text-center text-xs font-medium ${active ? "text-wine" : "text-ink-soft"}`}
                >
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </div>
    </div>
  );
}
