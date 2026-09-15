import { inDateRange } from "@/lib/period";
import { formatBRL } from "@/lib/time";
import type { Appointment, Client, Professional, Service } from "@/lib/types";

export function completedInRange(appointments: Appointment[], from: string, to: string) {
  return appointments.filter(
    (item) => item.status === "concluido" && inDateRange(item.date, from, to),
  );
}

export function sumSnapshots(appointments: Appointment[]) {
  return appointments.reduce((total, item) => total + item.servicePriceSnapshot, 0);
}

export function groupTotals(
  appointments: Appointment[],
  key: "professionalId" | "serviceId",
  labels: Map<string, string>,
) {
  const map = new Map<string, { id: string; name: string; count: number; total: number }>();
  for (const item of appointments) {
    const id = item[key];
    const current = map.get(id) ?? { id, name: labels.get(id) ?? "—", count: 0, total: 0 };
    current.count += 1;
    current.total += item.servicePriceSnapshot;
    map.set(id, current);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function dayStatusCounts(appointments: Appointment[], date: string) {
  const todayItems = appointments.filter((item) => item.date === date);
  return {
    total: todayItems.length,
    concluido: todayItems.filter((item) => item.status === "concluido").length,
    cancelado: todayItems.filter((item) => item.status === "cancelado").length,
    naoCompareceu: todayItems.filter((item) => item.status === "nao_compareceu").length,
    abertos: todayItems.filter((item) =>
      ["agendado", "confirmado", "em_atendimento"].includes(item.status),
    ).length,
  };
}

export function toCsv(
  appointments: Appointment[],
  clients: Client[],
  professionals: Professional[],
  services: Service[],
) {
  const clientName = Object.fromEntries(clients.map((item) => [item.id, item.name]));
  const proName = Object.fromEntries(professionals.map((item) => [item.id, item.name]));
  const svcName = Object.fromEntries(services.map((item) => [item.id, item.name]));
  const header = ["Data", "Inicio", "Fim", "Cliente", "Profissional", "Servico", "Valor", "Status"];
  const rows = appointments.map((item) => [
    item.date,
    item.start,
    item.end,
    clientName[item.clientId] ?? "",
    proName[item.professionalId] ?? "",
    svcName[item.serviceId] ?? "",
    formatBRL(item.servicePriceSnapshot).replace("\u00a0", " "),
    item.status,
  ]);
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return `\uFEFF${[header, ...rows].map((line) => line.map(escape).join(";")).join("\n")}`;
}
