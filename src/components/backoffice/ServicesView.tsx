"use client";

import { useMemo, useState } from "react";
import { BackofficeFrame } from "@/components/backoffice/BackofficeFrame";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { useSalon } from "@/context/SalonContext";
import { formatBRL } from "@/lib/time";
import type { Service, ServiceDraft } from "@/lib/types";

const emptyDraft: ServiceDraft = { name: "", durationMinutes: 60, price: 0 };

export function ServicesView() {
  const { state, saveService, setServiceActive } = useSalon();
  const [draft, setDraft] = useState<ServiceDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const usedIds = useMemo(
    () => new Set(state.appointments.map((item) => item.serviceId)),
    [state.appointments],
  );

  const services = useMemo(() => {
    const term = query.trim().toLowerCase();
    return [...state.services]
      .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "pt-BR"))
      .filter((item) => item.name.toLowerCase().includes(term));
  }, [query, state.services]);

  function startEdit(service: Service) {
    setEditingId(service.id);
    setDraft({
      name: service.name,
      durationMinutes: service.durationMinutes,
      price: service.price,
    });
    setError("");
  }

  function resetForm() {
    setEditingId(undefined);
    setDraft(emptyDraft);
    setError("");
  }

  function onSave() {
    const result = saveService(draft, editingId);
    if (result) {
      setError(result);
      return;
    }
    resetForm();
  }

  return (
    <BackofficeFrame
      title="Serviços"
      description="Catálogo exclusivo do backoffice. Alterar o preço não muda agendamentos já criados (snapshot)."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <form
          className="space-y-3 rounded-2xl border border-line bg-paper p-5"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <h2 className="font-medium text-wine">{editingId ? "Editar serviço" : "Novo serviço"}</h2>
          <Field
            id="svc-name"
            label="Nome"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
          />
          <Field
            id="svc-duration"
            label="Duração (minutos)"
            type="number"
            min={15}
            step={15}
            value={draft.durationMinutes}
            onChange={(e) => setDraft((d) => ({ ...d, durationMinutes: Number(e.target.value) }))}
          />
          <Field
            id="svc-price"
            label="Preço (R$)"
            type="number"
            min={0}
            step="0.01"
            value={draft.price}
            onChange={(e) => setDraft((d) => ({ ...d, price: Number(e.target.value) }))}
            hint="Este valor aparece na agenda somente leitura."
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
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-medium text-wine">Catálogo</h2>
            <input
              className="h-10 rounded-xl border border-line bg-cream px-3 text-sm"
              placeholder="Buscar"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="pb-2 font-medium">Serviço</th>
                  <th className="pb-2 font-medium">Duração</th>
                  <th className="pb-2 font-medium">Preço</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-t border-line">
                    <td className="py-3 font-medium text-wine">{service.name}</td>
                    <td className="py-3">{service.durationMinutes} min</td>
                    <td className="py-3">{formatBRL(service.price)}</td>
                    <td className="py-3">{service.active ? "Ativo" : "Inativo"}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="secondary" className="h-9 px-3 text-xs" onClick={() => startEdit(service)}>
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-9 px-3 text-xs"
                          onClick={() => setServiceActive(service.id, !service.active)}
                        >
                          {service.active ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                      {usedIds.has(service.id) && service.active ? (
                        <p className="mt-1 text-right text-[11px] text-ink-soft">
                          Já usado na agenda — desative em vez de apagar.
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </BackofficeFrame>
  );
}
