import type { AppointmentStatus } from "@/lib/types";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  agendado: "Agendado",
  confirmado: "Confirmado",
  em_atendimento: "Em atendimento",
  concluido: "Concluído",
  cancelado: "Cancelado",
  nao_compareceu: "Não compareceu",
};

export const STATUS_CLASS: Record<AppointmentStatus, string> = {
  agendado: "bg-wine text-gold-bright",
  confirmado: "bg-gold text-wine-deep",
  em_atendimento: "bg-wine-hover text-gold-bright",
  concluido: "bg-cream-dark text-ink-soft",
  cancelado: "bg-danger/15 text-danger line-through",
  nao_compareceu: "bg-line text-ink-soft",
};

export function nextStatuses(current: AppointmentStatus): AppointmentStatus[] {
  switch (current) {
    case "agendado":
      return ["confirmado", "em_atendimento", "cancelado", "nao_compareceu"];
    case "confirmado":
      return ["em_atendimento", "cancelado", "nao_compareceu"];
    case "em_atendimento":
      return ["concluido", "cancelado"];
    default:
      return [];
  }
}
