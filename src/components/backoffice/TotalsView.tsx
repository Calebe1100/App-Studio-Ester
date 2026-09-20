"use client";

import { useMemo, useState } from "react";
import { BackofficeFrame } from "@/components/backoffice/BackofficeFrame";
import { Button } from "@/components/ui/Button";
import { useSalon } from "@/context/SalonContext";
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_KIND_LABEL,
  balanceToCsv,
  buildBalance,
  groupExpensesByCategory,
} from "@/lib/expenses";
import { endOfMonthISO, endOfWeekISO, startOfMonthISO, startOfWeekISO } from "@/lib/period";
import { STATUS_LABEL } from "@/lib/status";
import { todayISO, formatBRL } from "@/lib/time";
import { completedInRange, groupTotals, toCsv } from "@/lib/totals";

type Preset = "hoje" | "semana" | "mes";

export function TotalsView() {
  const { state } = useSalon();
  const today = todayISO();
  const [preset, setPreset] = useState<Preset>("hoje");

  const range = useMemo(() => {
    if (preset === "semana") return { from: startOfWeekISO(today), to: endOfWeekISO(today) };
    if (preset === "mes") return { from: startOfMonthISO(today), to: endOfMonthISO(today) };
    return { from: today, to: today };
  }, [preset, today]);

  const rows = completedInRange(state.appointments, range.from, range.to);
  const balance = useMemo(
    () => buildBalance(state.appointments, state.expenses, range.from, range.to),
    [range.from, range.to, state.appointments, state.expenses],
  );
  const byCategory = groupExpensesByCategory(balance.occurrences);
  const byService = groupTotals(
    rows,
    "serviceId",
    new Map(state.services.map((item) => [item.id, item.name])),
  );
  const byProfessional = groupTotals(
    rows,
    "professionalId",
    new Map(state.professionals.map((item) => [item.id, item.name])),
  );

  function download(csv: string, filename: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadCsv() {
    download(
      toCsv(rows, state.clients, state.professionals, state.services),
      `totais-ana-ester-${range.from}-${range.to}.csv`,
    );
  }

  function downloadBalanceCsv() {
    download(balanceToCsv(balance), `balanco-ana-ester-${range.from}-${range.to}.csv`);
  }

  return (
    <BackofficeFrame
      title="Totais e balanço"
      description="Receita = preços dos serviços nos atendimentos concluídos (cancelados e faltas não entram). Despesas fixas e isoladas do período são subtraídas para fechar o balanço."
    >
      <div className="flex flex-wrap items-center gap-2">
        {(["hoje", "semana", "mes"] as Preset[]).map((item) => (
          <Button
            key={item}
            variant={preset === item ? "gold" : "secondary"}
            onClick={() => setPreset(item)}
          >
            {item === "hoje" ? "Hoje" : item === "semana" ? "Semana" : "Mês"}
          </Button>
        ))}
        <Button variant="secondary" onClick={downloadCsv} disabled={rows.length === 0}>
          Exportar atendimentos
        </Button>
        <Button variant="secondary" onClick={downloadBalanceCsv}>
          Exportar balanço
        </Button>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        Período {range.from} a {range.to}
      </p>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Receita</p>
          <p className="mt-2 font-display text-3xl text-wine">{formatBRL(balance.revenue)}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {balance.completedCount} atendimento(s) concluído(s)
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-paper p-5">
          <p className="text-xs uppercase tracking-wide text-ink-soft">Despesas</p>
          <p className="mt-2 font-display text-3xl text-danger">{formatBRL(balance.expenses)}</p>
          <p className="mt-1 text-xs text-ink-soft">
            Fixas {formatBRL(balance.fixedExpenses)} · Isoladas {formatBRL(balance.isolatedExpenses)}
          </p>
        </div>
        <div
          className={`rounded-2xl border p-5 ${
            balance.result < 0 ? "border-danger/40 bg-danger/10" : "border-line bg-wine text-gold-bright"
          }`}
        >
          <p
            className={`text-xs uppercase tracking-[0.18em] ${
              balance.result < 0 ? "text-danger" : "text-gold/80"
            }`}
          >
            Resultado do período
          </p>
          <p className={`mt-2 font-display text-3xl ${balance.result < 0 ? "text-danger" : ""}`}>
            {formatBRL(balance.result)}
          </p>
          <p className={`mt-1 text-xs ${balance.result < 0 ? "text-danger" : "text-gold/75"}`}>
            {balance.revenue > 0
              ? `Margem ${balance.marginPercent.toFixed(1)}% da receita`
              : "Sem receita no período"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Breakdown title="Receita por serviço" rows={byService} />
        <Breakdown title="Receita por profissional" rows={byProfessional} />
        <Breakdown title="Despesas por categoria" rows={byCategory} />
      </div>

      <h2 className="mt-6 font-medium text-wine">Despesas do período</h2>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Despesa</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Valor</th>
            </tr>
          </thead>
          <tbody>
            {balance.occurrences.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-ink-soft" colSpan={5}>
                  Nenhuma despesa neste período.
                </td>
              </tr>
            ) : (
              balance.occurrences.map((item) => (
                <tr key={`${item.expenseId}-${item.date}`} className="border-t border-line">
                  <td className="px-4 py-3">{item.date}</td>
                  <td className="px-4 py-3">{item.description}</td>
                  <td className="px-4 py-3">{EXPENSE_CATEGORY_LABEL[item.category]}</td>
                  <td className="px-4 py-3">{EXPENSE_KIND_LABEL[item.kind]}</td>
                  <td className="px-4 py-3 font-medium text-danger">{formatBRL(item.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-6 font-medium text-wine">Atendimentos concluídos</h2>
      <div className="mt-2 overflow-x-auto rounded-2xl border border-line bg-paper">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-cream text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Serviço</th>
              <th className="px-4 py-3 font-medium">Profissional</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-ink-soft" colSpan={6}>
                  Nenhum concluído neste período.
                </td>
              </tr>
            ) : (
              rows.map((item) => (
                <tr key={item.id} className="border-t border-line">
                  <td className="px-4 py-3">
                    {item.date} {item.start}
                  </td>
                  <td className="px-4 py-3">
                    {state.clients.find((client) => client.id === item.clientId)?.name}
                  </td>
                  <td className="px-4 py-3">
                    {state.services.find((service) => service.id === item.serviceId)?.name}
                  </td>
                  <td className="px-4 py-3">
                    {state.professionals.find((pro) => pro.id === item.professionalId)?.name}
                  </td>
                  <td className="px-4 py-3 font-medium text-wine">{formatBRL(item.servicePriceSnapshot)}</td>
                  <td className="px-4 py-3">{STATUS_LABEL[item.status]}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </BackofficeFrame>
  );
}

function Breakdown({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; name: string; count: number; total: number }[];
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-5">
      <h2 className="font-medium text-wine">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">Sem dados.</p>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {rows.map((row) => (
            <li key={row.id} className="flex justify-between gap-3">
              <span>
                {row.name} · {row.count}
              </span>
              <span className="font-medium">{formatBRL(row.total)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
