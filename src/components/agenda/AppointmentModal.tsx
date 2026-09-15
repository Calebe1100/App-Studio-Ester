"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, SelectField, TextAreaField } from "@/components/ui/Field";
import { useSalon } from "@/context/SalonContext";
import { nextStatuses, STATUS_LABEL } from "@/lib/status";
import { formatBRL } from "@/lib/time";
import type { Appointment, AppointmentDraft } from "@/lib/types";

type Props = {
  onClose: () => void;
  appointment?: Appointment;
  defaults?: Partial<AppointmentDraft>;
};

export function AppointmentModal({ onClose, appointment, defaults }: Props) {
  const { state, saveAppointment, setStatus } = useSalon();
  const [draft, setDraft] = useState<AppointmentDraft>(() => {
    if (appointment) {
      return {
        clientId: appointment.clientId,
        professionalId: appointment.professionalId,
        serviceId: appointment.serviceId,
        date: appointment.date,
        start: appointment.start,
        notes: appointment.notes,
      };
    }
    return {
      clientId: defaults?.clientId ?? state.clients[0]?.id ?? "",
      professionalId: defaults?.professionalId ?? state.professionals[0]?.id ?? "",
      serviceId: defaults?.serviceId ?? state.services[0]?.id ?? "",
      date: defaults?.date ?? "",
      start: defaults?.start ?? "09:00",
      notes: defaults?.notes ?? "",
    };
  });
  const [error, setError] = useState("");

  const service = useMemo(
    () => state.services.find((item) => item.id === draft.serviceId),
    [draft.serviceId, state.services],
  );

  function onSave() {
    const result = saveAppointment(draft, appointment?.id);
    if (result) {
      setError(result);
      return;
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-wine-deep/55 p-0 md:items-center md:p-6">
      <div className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-paper p-5 shadow-2xl md:max-w-lg md:rounded-3xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-deep">
          {appointment ? "Atendimento" : "Novo horário"}
        </p>
        <h2 className="mt-1 font-display text-2xl text-wine">
          {appointment ? "Editar agendamento" : "Agendar"}
        </h2>

        <div className="mt-5 space-y-3">
          <SelectField
            id="client"
            label="Cliente"
            value={draft.clientId}
            onChange={(e) => setDraft((d) => ({ ...d, clientId: e.target.value }))}
          >
            {state.clients
              .filter((item) => item.active)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </SelectField>
          <SelectField
            id="professional"
            label="Profissional"
            value={draft.professionalId}
            onChange={(e) => setDraft((d) => ({ ...d, professionalId: e.target.value }))}
          >
            {state.professionals
              .filter((item) => item.active)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.workStart}–{item.workEnd})
                </option>
              ))}
          </SelectField>
          <SelectField
            id="service"
            label="Serviço"
            value={draft.serviceId}
            onChange={(e) => setDraft((d) => ({ ...d, serviceId: e.target.value }))}
          >
            {state.services
              .filter((item) => item.active)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.durationMinutes} min
                </option>
              ))}
          </SelectField>
          <div className="rounded-xl border border-line bg-cream px-3 py-2 text-sm">
            <span className="text-ink-soft">Valor do serviço</span>
            <p className="font-medium text-wine">{service ? formatBRL(service.price) : "—"}</p>
            <p className="text-xs text-ink-soft">Somente leitura. O preço vem do catálogo.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="date"
              label="Data"
              type="date"
              value={draft.date}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            />
            <Field
              id="start"
              label="Início"
              type="time"
              step={1800}
              value={draft.start}
              onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
            />
          </div>
          <TextAreaField
            id="notes"
            label="Observação"
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          />
          {error ? <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p> : null}
        </div>

        {appointment ? (
          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-ink">Status</p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-cream-dark px-3 py-1 text-xs text-ink">
                {STATUS_LABEL[appointment.status]}
              </span>
              {nextStatuses(appointment.status).map((status) => (
                <Button
                  key={status}
                  variant="secondary"
                  className="h-9 px-3 text-xs"
                  onClick={() => {
                    setStatus(appointment.id, status);
                    onClose();
                  }}
                >
                  {STATUS_LABEL[status]}
                </Button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="gold" className="flex-1" onClick={onSave}>
            Salvar
          </Button>
        </div>
      </div>
    </div>
  );
}
