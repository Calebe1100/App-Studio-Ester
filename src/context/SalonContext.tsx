"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { appointmentError } from "@/lib/conflicts";
import { STORAGE_KEY } from "@/lib/constants";
import { createSeedState } from "@/lib/seed";
import { addMinutes } from "@/lib/time";
import type { Appointment, AppointmentDraft, AppointmentStatus, ClientBookingDraft, SalonState, Service, ServiceDraft } from "@/lib/types";

type SalonContextValue = {
  ready: true;
  state: SalonState;
  saveAppointment: (draft: AppointmentDraft, id?: string) => string | null;
  bookForClient: (draft: ClientBookingDraft) => string | null;
  setStatus: (id: string, status: AppointmentStatus) => void;
  saveService: (draft: ServiceDraft, id?: string) => string | null;
  setServiceActive: (id: string, active: boolean) => void;
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

// Valor estável para o SSR — mesmo objeto entre todas as chamadas (exigido pelo React)
const SERVER_SNAPSHOT: SalonState = createSeedState();

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
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

  const bookForClient = useCallback((draft: ClientBookingDraft) => {
    let error: string | null = null;
    write((current) => {
      const trimmedName = draft.name.trim();
      const trimmedPhone = draft.phone.trim();
      if (trimmedName.length < 2) {
        error = "Informe seu nome completo.";
        return current;
      }
      // Find existing client by phone, or create a new one
      let client = trimmedPhone
        ? current.clients.find((c) => c.phone === trimmedPhone)
        : undefined;
      let base = current;
      if (!client) {
        client = { id: newId("cli"), name: trimmedName, phone: trimmedPhone, notes: "", active: true };
        base = { ...current, clients: [...current.clients, client] };
      }
      const service = base.services.find((s) => s.id === draft.serviceId && s.active);
      const professional = base.professionals.find((p) => p.id === draft.professionalId && p.active);
      if (!service) { error = "Serviço não encontrado."; return current; }
      error = appointmentError({
        professional,
        appointments: base.appointments,
        professionalId: draft.professionalId,
        date: draft.date,
        start: draft.start,
        durationMinutes: service.durationMinutes,
      });
      if (error) return current;
      const payload: Appointment = {
        id: newId("apt"),
        clientId: client.id,
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
      return { ...base, appointments: [...base.appointments, payload] };
    });
    return error;
  }, []);

  const setStatus = useCallback((id: string, status: AppointmentStatus) => {
    write((current) => ({
      ...current,
      appointments: current.appointments.map((item) => (item.id === id ? { ...item, status } : item)),
    }));
  }, []);

  const saveService = useCallback((draft: ServiceDraft, id?: string) => {
    const name = draft.name.trim();
    if (name.length < 2) return "Informe o nome do serviço.";
    if (draft.durationMinutes < 15) return "A duração mínima é 15 minutos.";
    if (draft.price < 0) return "O preço não pode ser negativo.";

    write((current) => {
      const payload: Service = {
        id: id ?? newId("svc"),
        name,
        durationMinutes: draft.durationMinutes,
        price: draft.price,
        active: true,
      };
      if (id) {
        return {
          ...current,
          services: current.services.map((item) => (item.id === id ? { ...item, ...payload, active: item.active } : item)),
        };
      }
      return { ...current, services: [...current.services, payload] };
    });
    return null;
  }, []);

  const setServiceActive = useCallback((id: string, active: boolean) => {
    write((current) => ({
      ...current,
      services: current.services.map((item) => (item.id === id ? { ...item, active } : item)),
    }));
  }, []);

  const value = useMemo(
    () => ({ ready: true as const, state, saveAppointment, bookForClient, setStatus, saveService, setServiceActive }),
    [bookForClient, saveAppointment, saveService, setServiceActive, setStatus, state],
  );

  return <SalonContext.Provider value={value}>{children}</SalonContext.Provider>;
}

export function useSalon() {
  const context = useContext(SalonContext);
  if (!context) throw new Error("useSalon precisa estar dentro de SalonProvider");
  return context;
}
