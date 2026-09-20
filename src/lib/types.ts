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

export type ServiceDraft = {
  name: string;
  durationMinutes: number;
  price: number;
};

export const EXPENSE_CATEGORIES = [
  "aluguel",
  "pessoal",
  "produtos",
  "utilidades",
  "impostos",
  "marketing",
  "manutencao",
  "outros",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** `fixa` = recorrente todo mês; `isolada` = lançamento único. */
export type ExpenseKind = "fixa" | "isolada";

export type Expense = {
  id: string;
  description: string;
  category: ExpenseCategory;
  kind: ExpenseKind;
  amount: number;
  /** Isolada: data do lançamento. */
  dueDate: string | null;
  /** Fixa: dia do vencimento e vigência (`endsOn` nulo = sem fim). */
  dayOfMonth: number | null;
  startsOn: string | null;
  endsOn: string | null;
  notes: string;
  active: boolean;
};

/** Uma despesa materializada em uma data — fixas geram uma por mês de vigência. */
export type ExpenseOccurrence = {
  expenseId: string;
  description: string;
  category: ExpenseCategory;
  kind: ExpenseKind;
  amount: number;
  date: string;
};

export type ExpenseDraft = {
  description: string;
  category: ExpenseCategory;
  kind: ExpenseKind;
  amount: number;
  dueDate: string;
  dayOfMonth: number;
  startsOn: string;
  endsOn: string;
  notes: string;
};

export type ClientBookingDraft = {
  name: string;
  phone: string;
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
  expenses: Expense[];
};
