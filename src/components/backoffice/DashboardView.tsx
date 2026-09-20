"use client";

import Link from "next/link";
import { BackofficeFrame } from "@/components/backoffice/BackofficeFrame";
import { useSalon } from "@/context/SalonContext";
import { buildBalance } from "@/lib/expenses";
import { endOfMonthISO, startOfMonthISO } from "@/lib/period";
import { dayStatusCounts, completedInRange, groupTotals, sumSnapshots } from "@/lib/totals";
import { formatBRL, todayISO } from "@/lib/time";

export function DashboardView() {
  const { state } = useSalon();
  const today = todayISO();
  const monthBalance = buildBalance(
    state.appointments,
    state.expenses,
    startOfMonthISO(today),
    endOfMonthISO(today),
  );
  const counts = dayStatusCounts(state.appointments, today);
  const doneToday = completedInRange(state.appointments, today, today);
  const totalToday = sumSnapshots(doneToday);
  const byProfessional = groupTotals(
    doneToday,
    "professionalId",
    new Map(state.professionals.map((item) => [item.id, item.name])),
  );

  const cards = [
    { label: "Atendimentos do dia", value: String(counts.total) },
    { label: "Em aberto", value: String(counts.abertos) },
    { label: "Concluídos", value: String(counts.concluido) },
    { label: "Cancelados / faltas", value: String(counts.cancelado + counts.naoCompareceu) },
  ];

  return (
    <BackofficeFrame
      title="Gerenciamento"
      description="Valores dos serviços concluídos e despesas lançadas pelo dono. Não há pagamento, caixa ou formas de cobrança no app."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-line bg-paper p-4">
            <p className="text-xs uppercase tracking-wide text-ink-soft">{card.label}</p>
            <p className="mt-2 font-display text-3xl text-wine">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-wine p-5 text-gold-bright">
          <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Total do dia (concluídos)</p>
          <p className="mt-2 font-display text-4xl">{formatBRL(totalToday)}</p>
          <p className="mt-2 text-sm text-gold/75">Soma dos preços snapshot dos atendimentos concluídos hoje.</p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">Balanço do mês</p>
          <p
            className={`mt-2 font-display text-4xl ${
              monthBalance.result < 0 ? "text-danger" : "text-wine"
            }`}
          >
            {formatBRL(monthBalance.result)}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Receita {formatBRL(monthBalance.revenue)} − despesas {formatBRL(monthBalance.expenses)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="font-medium text-wine">Por profissional hoje</h2>
          {byProfessional.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">Nenhum atendimento concluído hoje.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {byProfessional.map((row) => (
                <li key={row.id} className="flex justify-between gap-3">
                  <span>{row.name}</span>
                  <span className="font-medium text-wine">
                    {row.count} · {formatBRL(row.total)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="font-medium text-wine">Atalhos</h2>
          <div className="mt-3 flex flex-col gap-2 text-sm">
            <Link className="rounded-xl bg-cream px-3 py-2 text-wine hover:bg-cream-dark" href="/gerenciamento/servicos">
              Cadastrar e editar serviços
            </Link>
            <Link className="rounded-xl bg-cream px-3 py-2 text-wine hover:bg-cream-dark" href="/gerenciamento/despesas">
              Lançar despesas fixas e isoladas
            </Link>
            <Link className="rounded-xl bg-cream px-3 py-2 text-wine hover:bg-cream-dark" href="/gerenciamento/totais">
              Totais e balanço do período
            </Link>
            <Link className="rounded-xl bg-cream px-3 py-2 text-wine hover:bg-cream-dark" href="/agenda">
              Voltar à agenda
            </Link>
          </div>
        </div>
      </div>
    </BackofficeFrame>
  );
}
