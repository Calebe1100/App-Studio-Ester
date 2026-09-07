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
    <div className="min-h-dvh md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-line bg-paper md:flex md:flex-col md:p-5">
        <Logo />
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-xl px-3 py-2.5 ${
                  active ? "bg-rose text-white" : "text-ink-soft hover:bg-cream"
                }`}
              >
                <span className="block text-sm font-medium">{item.label}</span>
                <span className={`text-xs ${active ? "text-white/80" : "text-ink-soft/80"}`}>
                  {item.hint}
                </span>
              </Link>
            );
          })}
        </nav>
        <p className="mt-auto pt-8 text-xs text-ink-soft">
          Login e sessão reais entram na Fase 1.
        </p>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between border-b border-line bg-paper px-4 py-3 md:px-8">
          <div className="md:hidden">
            <Logo compact />
          </div>
          <p className="hidden text-sm text-ink-soft md:block">Studio Ester · Fase 0</p>
          <Link className="text-sm font-medium text-rose" href="/login">
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
                  className={`py-3 text-center text-xs font-medium ${
                    active ? "text-rose" : "text-ink-soft"
                  }`}
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
