import type { Appointment, AppointmentStatus, Professional } from "@/lib/types";
import { addMinutes, toMinutes } from "@/lib/time";

const OCCUPYING: AppointmentStatus[] = ["agendado", "confirmado", "em_atendimento", "concluido"];

export function overlaps(startA: string, endA: string, startB: string, endB: string) {
  return toMinutes(startA) < toMinutes(endB) && toMinutes(startB) < toMinutes(endA);
}

export function isWithinWorkHours(professional: Professional, start: string, end: string) {
  return toMinutes(start) >= toMinutes(professional.workStart) && toMinutes(end) <= toMinutes(professional.workEnd);
}

export function findConflict(params: {
  appointments: Appointment[];
  professionalId: string;
  date: string;
  start: string;
  durationMinutes: number;
  ignoreId?: string;
}) {
  const end = addMinutes(params.start, params.durationMinutes);
  return params.appointments.find((item) => {
    if (item.id === params.ignoreId) return false;
    if (item.professionalId !== params.professionalId) return false;
    if (item.date !== params.date) return false;
    if (!OCCUPYING.includes(item.status)) return false;
    return overlaps(params.start, end, item.start, item.end);
  });
}

export function appointmentError(params: {
  professional: Professional | undefined;
  appointments: Appointment[];
  professionalId: string;
  date: string;
  start: string;
  durationMinutes: number;
  ignoreId?: string;
}) {
  if (!params.professional) return "Selecione um profissional.";
  const end = addMinutes(params.start, params.durationMinutes);
  if (!isWithinWorkHours(params.professional, params.start, end)) {
    return `Fora do horário de ${params.professional.name} (${params.professional.workStart}–${params.professional.workEnd}).`;
  }
  const conflict = findConflict(params);
  if (conflict) {
    return `Conflito: ${params.professional.name} já tem horário das ${conflict.start} às ${conflict.end}.`;
  }
  return null;
}
