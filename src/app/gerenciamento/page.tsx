import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";

export const metadata: Metadata = {
  title: "Gerenciamento",
};

export default function GerenciamentoPage() {
  return (
    <AppShell>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">Backoffice</p>
      <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">Gerenciamento</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
        Serviços e totais por atendimento concluído. Sem pagamento no app. Implementação na Fase 3.
      </p>
      <div className="mt-6 rounded-2xl border border-line bg-gold/15 p-4 text-sm text-wine md:hidden">
        Use um computador para gerenciar serviços e relatórios.
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="font-medium">Serviços</h2>
          <p className="mt-2 text-sm text-ink-soft">CRUD exclusivo do backoffice, apenas o dono.</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="font-medium">Totais</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Soma dos preços dos serviços nos atendimentos concluídos.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
