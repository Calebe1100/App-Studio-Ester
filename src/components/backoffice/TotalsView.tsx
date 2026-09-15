"use client";

import { useMemo, useState } from "react";
import { BackofficeFrame } from "@/components/backoffice/BackofficeFrame";
import { Button } from "@/components/ui/Button";
import { useSalon } from "@/context/SalonContext";
import { endOfMonthISO, endOfWeekISO, startOfMonthISO, startOfWeekISO } from "@/lib/period";
import { STATUS_LABEL } from "@/lib/status";
import { todayISO, formatBRL } from "@/lib/time";
import { completedInRange, groupTotals, sumSnapshots, toCsv } from "@/lib/totals";

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
  const total = sumSnapshots(rows);
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

  function downloadCsv() {
    const csv = toCsv(rows, state.clients, state.professionals, state.services);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `totais-ana-ester-${range.from}-${range.to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <BackofficeFrame
      title="Totais"
      description="Soma dos preços dos serviços nos atendimentos concluídos. Cancelados e faltas não entram."
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
          Exportar CSV
        </Button>
      </div>
      <p className="mt-3 text-xs text-ink-soft">
        Período {range.from} a {range.to}
      </p>

      <div className="mt-4 rounded-2xl border border-line bg-wine p-5 text-gold-bright">
        <p className="text-xs uppercase tracking-[0.18em] text-gold/80">Total do período</p>
        <p className="mt-2 font-display text-4xl">{formatBRL(total)}</p>
        <p className="mt-1 text-sm text-gold/75">{rows.length} atendimento(s) concluído(s)</p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Breakdown title="Por serviço" rows={byService} />
        <Breakdown title="Por profissional" rows={byProfessional} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-paper">
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
