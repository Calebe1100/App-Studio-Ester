"use client";

import { useMemo, useState } from "react";
import { BackofficeFrame } from "@/components/backoffice/BackofficeFrame";
import { Button } from "@/components/ui/Button";
import { Field, SelectField, TextAreaField } from "@/components/ui/Field";
import { useSalon } from "@/context/SalonContext";
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_KIND_LABEL,
  expenseOccurrences,
  expenseScheduleLabel,
  sumOccurrences,
} from "@/lib/expenses";
import { endOfMonthISO, startOfMonthISO } from "@/lib/period";
import { formatBRL, todayISO } from "@/lib/time";
import { EXPENSE_CATEGORIES, type Expense, type ExpenseDraft, type ExpenseKind } from "@/lib/types";

function emptyDraft(today: string): ExpenseDraft {
  return {
    description: "",
    category: "outros",
    kind: "isolada",
    amount: 0,
    dueDate: today,
    dayOfMonth: 5,
    startsOn: startOfMonthISO(today),
    endsOn: "",
    notes: "",
  };
}

export function ExpensesView() {
  const { state, saveExpense, setExpenseActive } = useSalon();
  const today = todayISO();
  const [draft, setDraft] = useState<ExpenseDraft>(() => emptyDraft(today));
  const [editingId, setEditingId] = useState<string | undefined>();
  const [error, setError] = useState("");

  const monthTotals = useMemo(() => {
    const from = startOfMonthISO(today);
    const to = endOfMonthISO(today);
    const occurrences = expenseOccurrences(state.expenses, from, to);
    return {
      fixed: sumOccurrences(occurrences.filter((item) => item.kind === "fixa")),
      isolated: sumOccurrences(occurrences.filter((item) => item.kind === "isolada")),
      total: sumOccurrences(occurrences),
    };
  }, [state.expenses, today]);

  const expenses = useMemo(
    () =>
      [...state.expenses].sort(
        (a, b) =>
          Number(b.active) - Number(a.active) ||
          a.kind.localeCompare(b.kind) ||
          a.description.localeCompare(b.description, "pt-BR"),
      ),
    [state.expenses],
  );

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setDraft({
      description: expense.description,
      category: expense.category,
      kind: expense.kind,
      amount: expense.amount,
      dueDate: expense.dueDate ?? today,
      dayOfMonth: expense.dayOfMonth ?? 5,
      startsOn: expense.startsOn ?? startOfMonthISO(today),
      endsOn: expense.endsOn ?? "",
      notes: expense.notes,
    });
    setError("");
  }

  function resetForm() {
    setEditingId(undefined);
    setDraft(emptyDraft(today));
    setError("");
  }

  function onSave() {
    const result = saveExpense(draft, editingId);
    if (result) {
      setError(result);
      return;
    }
    resetForm();
  }

  return (
    <BackofficeFrame
      title="Despesas"
      description="Lançamentos que saem do caixa do salão. Despesas fixas repetem todo mês; isoladas valem só na data informada. Ambas entram no balanço do período."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Fixas do mês" value={formatBRL(monthTotals.fixed)} />
        <SummaryCard label="Isoladas do mês" value={formatBRL(monthTotals.isolated)} />
        <SummaryCard label="Total previsto no mês" value={formatBRL(monthTotals.total)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <form
          className="space-y-3 rounded-2xl border border-line bg-paper p-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <h2 className="font-medium text-wine">{editingId ? "Editar despesa" : "Nova despesa"}</h2>

          <div className="flex gap-2">
            {(["isolada", "fixa"] as ExpenseKind[]).map((kind) => (
              <Button
                key={kind}
                variant={draft.kind === kind ? "gold" : "secondary"}
                className="flex-1"
                onClick={() => setDraft((d) => ({ ...d, kind }))}
              >
                {EXPENSE_KIND_LABEL[kind]}
              </Button>
            ))}
          </div>

          <Field
            id="exp-description"
            label="Descrição"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />

          <SelectField
            id="exp-category"
            label="Categoria"
            value={draft.category}
            onChange={(e) =>
              setDraft((d) => ({ ...d, category: e.target.value as ExpenseDraft["category"] }))
            }
          >
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {EXPENSE_CATEGORY_LABEL[category]}
              </option>
            ))}
          </SelectField>

          <Field
            id="exp-amount"
            label="Valor (R$)"
            type="number"
            min={0}
            step="0.01"
            value={draft.amount}
            onChange={(e) => setDraft((d) => ({ ...d, amount: Number(e.target.value) }))}
          />

          {draft.kind === "isolada" ? (
            <Field
              id="exp-due-date"
              label="Data da despesa"
              type="date"
              value={draft.dueDate}
              onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
              hint="Entra no balanço apenas nesta data."
            />
          ) : (
            <>
              <Field
                id="exp-day"
                label="Dia do vencimento"
                type="number"
                min={1}
                max={31}
                value={draft.dayOfMonth}
                onChange={(e) => setDraft((d) => ({ ...d, dayOfMonth: Number(e.target.value) }))}
                hint="Dia 31 cai no último dia dos meses mais curtos."
              />
              <Field
                id="exp-starts-on"
                label="Início da vigência"
                type="date"
                value={draft.startsOn}
                onChange={(e) => setDraft((d) => ({ ...d, startsOn: e.target.value }))}
              />
              <Field
                id="exp-ends-on"
                label="Fim da vigência (opcional)"
                type="date"
                value={draft.endsOn}
                onChange={(e) => setDraft((d) => ({ ...d, endsOn: e.target.value }))}
                hint="Deixe vazio enquanto a despesa continuar valendo."
              />
            </>
          )}

          <TextAreaField
            id="exp-notes"
            label="Observações"
            value={draft.notes}
            onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          />

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex gap-2">
            <Button type="submit" variant="gold" className="flex-1">
              Salvar
            </Button>
            {editingId ? (
              <Button type="button" variant="secondary" className="flex-1" onClick={resetForm}>
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>

        <div className="rounded-2xl border border-line bg-paper p-5">
          <h2 className="font-medium text-wine">Lançamentos</h2>
          <p className="mt-1 text-xs text-ink-soft">
            Despesas desativadas ficam no histórico, mas saem do balanço.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="pb-2 font-medium">Descrição</th>
                  <th className="pb-2 font-medium">Tipo</th>
                  <th className="pb-2 font-medium">Quando</th>
                  <th className="pb-2 font-medium">Valor</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td className="py-6 text-ink-soft" colSpan={6}>
                      Nenhuma despesa cadastrada.
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => (
                    <tr key={expense.id} className="border-t border-line">
                      <td className="py-3">
                        <p className="font-medium text-wine">{expense.description}</p>
                        <p className="text-xs text-ink-soft">
                          {EXPENSE_CATEGORY_LABEL[expense.category]}
                        </p>
                      </td>
                      <td className="py-3">{EXPENSE_KIND_LABEL[expense.kind]}</td>
                      <td className="py-3 text-xs text-ink-soft">{expenseScheduleLabel(expense)}</td>
                      <td className="py-3 font-medium">{formatBRL(expense.amount)}</td>
                      <td className="py-3">{expense.active ? "Ativa" : "Inativa"}</td>
                      <td className="py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="secondary"
                            className="h-9 px-3 text-xs"
                            onClick={() => startEdit(expense)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-9 px-3 text-xs"
                            onClick={() => setExpenseActive(expense.id, !expense.active)}
                          >
                            {expense.active ? "Desativar" : "Ativar"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BackofficeFrame>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4">
      <p className="text-xs uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-2xl text-wine">{value}</p>
    </div>
  );
}
