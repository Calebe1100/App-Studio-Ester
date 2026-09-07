export const APPOINTMENT_STATUSES = [
  "agendado",
  "confirmado",
  "em_atendimento",
  "concluido",
  "cancelado",
  "nao_compareceu",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type Professional = {
  id: string;
  name: string;
  workStart: string;
  workEnd: string;
  active: boolean;
};

export type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  active: boolean;
};

export type Client = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  active: boolean;
};

export type Appointment = {
  id: string;
  clientId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  start: string;
  end: string;
  status: AppointmentStatus;
  notes: string;
  servicePriceSnapshot: number;
  serviceDurationSnapshot: number;
};

export type AppointmentDraft = {
  clientId: string;
  professionalId: string;
  serviceId: string;
  date: string;
  start: string;
  notes: string;
};

export type SalonState = {
  professionals: Professional[];
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
};
