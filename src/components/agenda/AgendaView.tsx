"use client";

import { useMemo, useState } from "react";
import { AppointmentModal } from "@/components/agenda/AppointmentModal";
import { Button } from "@/components/ui/Button";
import { useSalon } from "@/context/SalonContext";
import { GRID_START, SLOT_MINUTES } from "@/lib/constants";
import { STATUS_CLASS, STATUS_LABEL } from "@/lib/status";
import { addDaysISO, formatBRL, formatLongDate, timeSlots, toMinutes, todayISO } from "@/lib/time";
import type { Appointment, AppointmentDraft } from "@/lib/types";

const ROW_HEIGHT = 44;

function useLookups() {
  const { state } = useSalon();
  return {
    clientName: (id: string) => state.clients.find((item) => item.id === id)?.name ?? "Cliente",
    professionalName: (id: string) => state.professionals.find((item) => item.id === id)?.name ?? "Profissional",
    serviceName: (id: string) => state.services.find((item) => item.id === id)?.name ?? "Serviço",
  };
}

export function AgendaView() {
  const { state } = useSalon();
  const [date, setDate] = useState(todayISO);
  const [professionalId, setProfessionalId] = useState("all");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Appointment | undefined>();
  const [defaults, setDefaults] = useState<Partial<AppointmentDraft>>({});
  const lookups = useLookups();

  const professionals = useMemo(() => {
    const active = state.professionals.filter((item) => item.active);
    if (professionalId === "all") return active;
    return active.filter((item) => item.id === professionalId);
  }, [professionalId, state.professionals]);

  const dayAppointments = useMemo(
    () =>
      state.appointments
        .filter((item) => item.date === date)
        .sort((a, b) => toMinutes(a.start) - toMinutes(b.start)),
    [date, state.appointments],
  );

  const slots = timeSlots();

  function openCreate(partial: Partial<AppointmentDraft>) {
    setSelected(undefined);
    setDefaults({ date, start: "09:00", ...partial });
    setOpen(true);
  }

  function openEdit(appointment: Appointment) {
    setSelected(appointment);
    setOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-deep">Operação</p>
          <h1 className="mt-1 font-display text-3xl text-wine md:text-4xl">Agenda</h1>
          <p className="mt-1 capitalize text-sm text-ink-soft">{formatLongDate(date)}</p>
        </div>
        <Button variant="gold" className="md:hidden" onClick={() => openCreate({ date })}>
          Novo horário
        </Button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => setDate((d) => addDaysISO(d, -1))}>
          Anterior
        </Button>
        <Button variant="secondary" onClick={() => setDate(todayISO())}>
          Hoje
        </Button>
        <Button variant="secondary" onClick={() => setDate((d) => addDaysISO(d, 1))}>
          Próximo
        </Button>
        <select
          className="h-11 rounded-xl border border-line bg-paper px-3 text-sm"
          value={professionalId}
          onChange={(e) => setProfessionalId(e.target.value)}
        >
          <option value="all">Todas as profissionais</option>
          {state.professionals.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <Button className="hidden md:inline-flex" variant="gold" onClick={() => openCreate({ date })}>
          Novo horário
        </Button>
      </div>

      <section className="mt-6 space-y-3 md:hidden">
        {dayAppointments.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-paper p-5 text-sm text-ink-soft">
            Nenhum atendimento neste dia.
          </p>
        ) : (
          dayAppointments.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openEdit(item)}
              className="w-full rounded-2xl border border-line bg-paper p-4 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-wine">{lookups.clientName(item.clientId)}</p>
                  <p className="text-sm text-ink-soft">
                    {item.start}–{item.end} · {lookups.professionalName(item.professionalId)}
                  </p>
                  <p className="text-sm text-ink-soft">{lookups.serviceName(item.serviceId)}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-[11px] ${STATUS_CLASS[item.status]}`}>
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-gold-deep">{formatBRL(item.servicePriceSnapshot)}</p>
            </button>
          ))
        )}
      </section>

      <section className="mt-6 hidden overflow-x-auto rounded-2xl border border-line bg-paper md:block">
        <div
          className="min-w-[720px] grid"
          style={{ gridTemplateColumns: `72px repeat(${professionals.length}, minmax(180px, 1fr))` }}
        >
          <div className="sticky top-0 z-10 border-b border-line bg-cream px-2 py-3 text-xs text-ink-soft">Hora</div>
          {professionals.map((professional) => (
            <div
              key={professional.id}
              className="sticky top-0 z-10 border-b border-l border-line bg-cream px-3 py-3"
            >
              <p className="font-medium text-wine">{professional.name}</p>
              <p className="text-xs text-ink-soft">
                {professional.workStart}–{professional.workEnd}
              </p>
            </div>
          ))}

          <div className="relative">
            {slots.map((slot) => (
              <div
                key={slot}
                className="border-t border-line px-2 text-[11px] text-ink-soft"
                style={{ height: ROW_HEIGHT }}
              >
                {slot.endsWith(":00") ? slot : ""}
              </div>
            ))}
          </div>

          {professionals.map((professional) => {
            const items = dayAppointments.filter((item) => item.professionalId === professional.id);
            return (
              <div key={professional.id} className="relative border-l border-line">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    aria-label={`Agendar ${slot} com ${professional.name}`}
                    onClick={() =>
                      openCreate({ date, start: slot, professionalId: professional.id })
                    }
                    className="block w-full border-t border-line hover:bg-gold/10"
                    style={{ height: ROW_HEIGHT }}
                  />
                ))}
                {items.map((item) => {
                  const top = ((toMinutes(item.start) - toMinutes(GRID_START)) / SLOT_MINUTES) * ROW_HEIGHT;
                  const height = Math.max(
                    ROW_HEIGHT,
                    ((toMinutes(item.end) - toMinutes(item.start)) / SLOT_MINUTES) * ROW_HEIGHT,
                  );
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openEdit(item);
                      }}
                      className={`absolute left-1 right-1 z-10 overflow-hidden rounded-lg px-2 py-1 text-left shadow-sm ${STATUS_CLASS[item.status]}`}
                      style={{ top, height: height - 4 }}
                    >
                      <p className="truncate text-xs font-semibold">{lookups.clientName(item.clientId)}</p>
                      <p className="truncate text-[11px] opacity-90">
                        {item.start} · {lookups.serviceName(item.serviceId)}
                      </p>
                      <p className="truncate text-[11px] opacity-90">{formatBRL(item.servicePriceSnapshot)}</p>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {open ? (
        <AppointmentModal
          key={selected?.id ?? `new-${defaults.professionalId}-${defaults.start}-${defaults.date}`}
          appointment={selected}
          defaults={defaults}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
