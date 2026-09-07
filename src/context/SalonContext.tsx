"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { appointmentError } from "@/lib/conflicts";
import { STORAGE_KEY } from "@/lib/constants";
import { createSeedState } from "@/lib/seed";
import { addMinutes } from "@/lib/time";
import type { Appointment, AppointmentDraft, AppointmentStatus, SalonState } from "@/lib/types";

type SalonContextValue = {
  ready: true;
  state: SalonState;
  saveAppointment: (draft: AppointmentDraft, id?: string) => string | null;
  setStatus: (id: string, status: AppointmentStatus) => void;
};

const SalonContext = createContext<SalonContextValue | null>(null);

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

const listeners = new Set<() => void>();
let memory = createSeedState();
let hydrated = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function readStorage() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return createSeedState();
  try {
    return JSON.parse(raw) as SalonState;
  } catch {
    return createSeedState();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  if (!hydrated) {
    memory = readStorage();
    hydrated = true;
  }
  return memory;
}

function getServerSnapshot() {
  return createSeedState();
}

function write(updater: (current: SalonState) => SalonState) {
  memory = updater(memory);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  emit();
}

export function SalonProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const saveAppointment = useCallback((draft: AppointmentDraft, id?: string) => {
    let error: string | null = null;
    write((current) => {
      const service = current.services.find((item) => item.id === draft.serviceId && item.active);
      const professional = current.professionals.find(
        (item) => item.id === draft.professionalId && item.active,
      );
      if (!draft.clientId) {
        error = "Selecione um cliente.";
        return current;
      }
      if (!service) {
        error = "Selecione um serviço ativo.";
        return current;
      }
      error = appointmentError({
        professional,
        appointments: current.appointments,
        professionalId: draft.professionalId,
        date: draft.date,
        start: draft.start,
        durationMinutes: service.durationMinutes,
        ignoreId: id,
      });
      if (error) return current;

      const payload: Appointment = {
        id: id ?? newId("apt"),
        clientId: draft.clientId,
        professionalId: draft.professionalId,
        serviceId: draft.serviceId,
        date: draft.date,
        start: draft.start,
        end: addMinutes(draft.start, service.durationMinutes),
        status: "agendado",
        notes: draft.notes,
        servicePriceSnapshot: service.price,
        serviceDurationSnapshot: service.durationMinutes,
      };

      if (id) {
        return {
          ...current,
          appointments: current.appointments.map((item) =>
            item.id === id ? { ...payload, status: item.status } : item,
          ),
        };
      }
      return { ...current, appointments: [...current.appointments, payload] };
    });
    return error;
  }, []);

  const setStatus = useCallback((id: string, status: AppointmentStatus) => {
    write((current) => ({
      ...current,
      appointments: current.appointments.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
  }, []);

  const value = useMemo(
    () => ({ ready: true as const, state, saveAppointment, setStatus }),
    [saveAppointment, setStatus, state],
  );

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
}

export function useSalon() {
  const context = useContext(SalonContext);
  if (!context) throw new Error("useSalon precisa estar dentro de SalonProvider");
  return context;
}
