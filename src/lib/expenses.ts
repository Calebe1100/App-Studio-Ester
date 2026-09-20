import { formatBRL } from "@/lib/time";
import type {
  Appointment,
  Expense,
  ExpenseCategory,
  ExpenseOccurrence,
} from "@/lib/types";
import { completedInRange, sumSnapshots } from "@/lib/totals";

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  aluguel: "Aluguel",
  pessoal: "Pessoal",
  produtos: "Produtos",
  utilidades: "Água, luz e internet",
  impostos: "Impostos e taxas",
  marketing: "Marketing",
  manutencao: "Manutenção",
  outros: "Outros",
};

export const EXPENSE_KIND_LABEL: Record<Expense["kind"], string> = {
  fixa: "Fixa (mensal)",
  isolada: "Isolada",
};

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Meses ('YYYY-MM') tocados pelo intervalo, inclusive. */
export function monthsInRange(from: string, to: string) {
  if (from > to) return [];
  const months: string[] = [];
  let [year, month] = from.split("-").map(Number);
  const limit = to.slice(0, 7);
  let current = from.slice(0, 7);
  while (current <= limit) {
    months.push(current);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    current = `${year}-${String(month).padStart(2, "0")}`;
  }
  return months;
}

/** Vencimento no mês, com o dia limitado ao último dia (31 em fevereiro cai no 28/29). */
export function monthlyOccurrenceDate(month: string, dayOfMonth: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const day = Math.min(Math.max(dayOfMonth, 1), lastDayOfMonth(year, monthNumber));
  return `${month}-${String(day).padStart(2, "0")}`;
}

/** Materializa as despesas ativas no intervalo: isoladas na data e fixas mês a mês. */
export function expenseOccurrences(
  expenses: Expense[],
  from: string,
  to: string,
): ExpenseOccurrence[] {
  const occurrences: ExpenseOccurrence[] = [];

  for (const expense of expenses) {
    if (!expense.active) continue;
    const base = {
      expenseId: expense.id,
      description: expense.description,
      category: expense.category,
      kind: expense.kind,
      amount: expense.amount,
    };

    if (expense.kind === "isolada") {
      if (expense.dueDate && expense.dueDate >= from && expense.dueDate <= to) {
        occurrences.push({ ...base, date: expense.dueDate });
      }
      continue;
    }

    if (!expense.dayOfMonth || !expense.startsOn) continue;
    const start = expense.startsOn > from ? expense.startsOn : from;
    const end = expense.endsOn && expense.endsOn < to ? expense.endsOn : to;
    for (const month of monthsInRange(start, end)) {
      const date = monthlyOccurrenceDate(month, expense.dayOfMonth);
      if (date >= start && date <= end) occurrences.push({ ...base, date });
    }
  }

  return occurrences.sort((a, b) => a.date.localeCompare(b.date));
}

export function sumOccurrences(occurrences: ExpenseOccurrence[]) {
  return occurrences.reduce((total, item) => total + item.amount, 0);
}

export function groupExpensesByCategory(occurrences: ExpenseOccurrence[]) {
  const map = new Map<ExpenseCategory, { id: string; name: string; count: number; total: number }>();
  for (const item of occurrences) {
    const current = map.get(item.category) ?? {
      id: item.category,
      name: EXPENSE_CATEGORY_LABEL[item.category],
      count: 0,
      total: 0,
    };
    current.count += 1;
    current.total += item.amount;
    map.set(item.category, current);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export type Balance = {
  from: string;
  to: string;
  revenue: number;
  completedCount: number;
  expenses: number;
  fixedExpenses: number;
  isolatedExpenses: number;
  result: number;
  marginPercent: number;
  occurrences: ExpenseOccurrence[];
};

/** Balanço do período: receita dos atendimentos concluídos − despesas do período. */
export function buildBalance(
  appointments: Appointment[],
  expenses: Expense[],
  from: string,
  to: string,
): Balance {
  const completed = completedInRange(appointments, from, to);
  const revenue = sumSnapshots(completed);
  const occurrences = expenseOccurrences(expenses, from, to);
  const fixedExpenses = sumOccurrences(occurrences.filter((item) => item.kind === "fixa"));
  const total = sumOccurrences(occurrences);
  const result = revenue - total;

  return {
    from,
    to,
    revenue,
    completedCount: completed.length,
    expenses: total,
    fixedExpenses,
    isolatedExpenses: total - fixedExpenses,
    result,
    marginPercent: revenue > 0 ? (result / revenue) * 100 : 0,
    occurrences,
  };
}

/** Descreve a periodicidade da despesa para exibição na lista. */
export function expenseScheduleLabel(expense: Expense) {
  if (expense.kind === "isolada") return expense.dueDate ?? "—";
  const start = expense.startsOn ? `desde ${expense.startsOn}` : "";
  const end = expense.endsOn ? ` até ${expense.endsOn}` : "";
  return `Todo dia ${expense.dayOfMonth} · ${start}${end}`;
}

export function balanceToCsv(balance: Balance) {
  const header = ["Tipo", "Data", "Descricao", "Categoria", "Valor"];
  const rows = balance.occurrences.map((item) => [
    EXPENSE_KIND_LABEL[item.kind],
    item.date,
    item.description,
    EXPENSE_CATEGORY_LABEL[item.category],
    formatBRL(item.amount).replace("\u00a0", " "),
  ]);
  const summary = [
    ["Resumo", `${balance.from} a ${balance.to}`, "", "", ""],
    ["Receita", "", `${balance.completedCount} concluido(s)`, "", formatBRL(balance.revenue).replace("\u00a0", " ")],
    ["Despesas", "", "", "", formatBRL(balance.expenses).replace("\u00a0", " ")],
    ["Resultado", "", "", "", formatBRL(balance.result).replace("\u00a0", " ")],
  ];
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return `\uFEFF${[header, ...rows, [], ...summary]
    .map((line) => line.map(escape).join(";"))
    .join("\n")}`;
}
