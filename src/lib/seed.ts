import { todayISO, addMinutes } from "@/lib/time";
import type { SalonState } from "@/lib/types";

export function createSeedState(): SalonState {
  const date = todayISO();
  return {
    professionals: [
      { id: "pro-1", name: "Camila Souza", workStart: "09:00", workEnd: "18:00", active: true },
      { id: "pro-2", name: "Juliana Alves", workStart: "10:00", workEnd: "19:00", active: true },
    ],
    services: [
      { id: "svc-1", name: "Corte feminino", durationMinutes: 60, price: 120, active: true },
      { id: "svc-2", name: "Escova", durationMinutes: 45, price: 80, active: true },
      { id: "svc-3", name: "Manicure", durationMinutes: 45, price: 50, active: true },
      { id: "svc-4", name: "Coloração", durationMinutes: 120, price: 250, active: true },
    ],
    clients: [
      { id: "cli-1", name: "Maria Lima", phone: "(11) 98888-1111", notes: "", active: true },
      { id: "cli-2", name: "Ana Ribeiro", phone: "(11) 97777-2222", notes: "Prefere manhã", active: true },
      { id: "cli-3", name: "Beatriz Nunes", phone: "(11) 96666-3333", notes: "", active: true },
    ],
    appointments: [
      {
        id: "apt-1",
        clientId: "cli-1",
        professionalId: "pro-1",
        serviceId: "svc-1",
        date,
        start: "10:00",
        end: addMinutes("10:00", 60),
        status: "agendado",
        notes: "",
        servicePriceSnapshot: 120,
        serviceDurationSnapshot: 60,
      },
      {
        id: "apt-2",
        clientId: "cli-2",
        professionalId: "pro-2",
        serviceId: "svc-2",
        date,
        start: "11:00",
        end: addMinutes("11:00", 45),
        status: "confirmado",
        notes: "",
        servicePriceSnapshot: 80,
        serviceDurationSnapshot: 45,
      },
    ],
  };
}
