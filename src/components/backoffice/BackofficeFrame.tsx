"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/gerenciamento", label: "Painel", exact: true },
  { href: "/gerenciamento/servicos", label: "Serviços", exact: false },
  { href: "/gerenciamento/totais", label: "Totais", exact: false },
];

export function BackofficeFrame({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-deep">Backoffice</p>
      <h1 className="mt-1 font-display text-3xl text-wine md:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>
      <p className="mt-3 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-wine md:hidden">
        Use um computador para cadastrar serviços e ver relatórios com conforto.
      </p>
      <nav className="mt-5 flex gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                active ? "bg-wine text-gold-bright" : "bg-paper text-ink-soft ring-1 ring-line"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}
