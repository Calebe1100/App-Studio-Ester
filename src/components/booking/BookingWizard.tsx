"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Field, TextAreaField } from "@/components/ui/Field";
import { useSalon } from "@/context/SalonContext";
import { findConflict, isWithinWorkHours } from "@/lib/conflicts";
import { addMinutes, formatBRL, formatLongDate, timeSlots, todayISO } from "@/lib/time";

type Step = "service" | "professional" | "datetime" | "confirm" | "success";

function StepIndicator({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "service", label: "Serviço" },
    { key: "professional", label: "Profissional" },
    { key: "datetime", label: "Data e hora" },
    { key: "confirm", label: "Confirmar" },
  ];
  const order: Step[] = ["service", "professional", "datetime", "confirm", "success"];
  const currentIndex = order.indexOf(current);

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, index) => {
        const stepIndex = order.indexOf(step.key);
        const done = stepIndex < currentIndex;
        const active = stepIndex === currentIndex;
        return (
          <div key={step.key} className="flex items-center gap-1">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                done
                  ? "bg-gold text-wine-deep"
                  : active
                    ? "bg-wine text-cream"
                    : "bg-line text-ink-soft"
              }`}
            >
              {done ? "✓" : index + 1}
            </div>
            <span
              className={`hidden text-xs sm:block ${active ? "font-medium text-wine" : done ? "text-gold-deep" : "text-ink-soft"}`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && <div className="mx-1 h-px w-4 bg-line" />}
          </div>
        );
      })}
    </div>
  );
}

export function BookingWizard() {
  const { state, bookForClient } = useSalon();
  const [step, setStep] = useState<Step>("service");
  const [serviceId, setServiceId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const selectedService = useMemo(
    () => state.services.find((s) => s.id === serviceId),
    [serviceId, state.services],
  );

  const selectedProfessional = useMemo(
    () => state.professionals.find((p) => p.id === professionalId),
    [professionalId, state.professionals],
  );

  const availableSlots = useMemo(() => {
    if (!professionalId || !serviceId || !date) return [];
    const professional = state.professionals.find((p) => p.id === professionalId && p.active);
    const service = state.services.find((s) => s.id === serviceId && s.active);
    if (!professional || !service) return [];

    return timeSlots().filter((slot) => {
      const end = addMinutes(slot, service.durationMinutes);
      if (!isWithinWorkHours(professional, slot, end)) return false;
      const conflict = findConflict({
        appointments: state.appointments,
        professionalId,
        date,
        start: slot,
        durationMinutes: service.durationMinutes,
      });
      return !conflict;
    });
  }, [professionalId, serviceId, date, state]);

  function handleConfirm() {
    setError("");
    const result = bookForClient({ name, phone, professionalId, serviceId, date, start, notes });
    if (result) {
      setError(result);
      return;
    }
    setStep("success");
  }

  function reset() {
    setStep("service");
    setServiceId("");
    setProfessionalId("");
    setDate(todayISO());
    setStart("");
    setName("");
    setPhone("");
    setNotes("");
    setError("");
  }

  if (step === "success") {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-3xl">
            🌸
          </div>
          <h1 className="mt-4 font-display text-3xl text-wine">Agendado com sucesso!</h1>
          <p className="mt-2 text-ink-soft">
            Seu horário foi reservado. Aguardamos você no estúdio!
          </p>
          <div className="mt-6 rounded-2xl border border-line bg-paper p-5 text-left text-sm space-y-2 w-full max-w-sm">
            <div className="flex justify-between">
              <span className="text-ink-soft">Serviço</span>
              <span className="font-medium text-wine">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Profissional</span>
              <span className="font-medium text-wine">{selectedProfessional?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Data</span>
              <span className="font-medium text-wine capitalize">{formatLongDate(date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Horário</span>
              <span className="font-medium text-wine">{start}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-soft">Valor</span>
              <span className="font-medium text-gold-deep">
                {selectedService ? formatBRL(selectedService.price) : "—"}
              </span>
            </div>
          </div>
          <Button variant="gold" className="mt-6" onClick={reset}>
            Fazer novo agendamento
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold-deep">Studio de Beleza</p>
          <h1 className="mt-1 font-display text-3xl text-wine md:text-4xl">Agendar horário</h1>
          <p className="mt-1 text-sm text-ink-soft">Escolha o serviço, profissional e horário.</p>
        </div>

        <div className="mt-5">
          <StepIndicator current={step} />
        </div>

        <div className="mt-6">
          {/* Step 1 – Service */}
          {step === "service" && (
            <div>
              <h2 className="mb-4 font-display text-xl text-wine">Qual serviço você deseja?</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {state.services
                  .filter((s) => s.active)
                  .map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => {
                        setServiceId(service.id);
                        setStep("professional");
                      }}
                      className="rounded-2xl border border-line bg-paper p-4 text-left transition-colors hover:border-gold hover:bg-gold/5"
                    >
                      <p className="font-medium text-wine">{service.name}</p>
                      <p className="mt-1 text-sm text-ink-soft">{service.durationMinutes} minutos</p>
                      <p className="mt-2 text-lg font-semibold text-gold-deep">{formatBRL(service.price)}</p>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* Step 2 – Professional */}
          {step === "professional" && (
            <div>
              <h2 className="mb-4 font-display text-xl text-wine">Com quem você prefere?</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {state.professionals
                  .filter((p) => p.active)
                  .map((professional) => (
                    <button
                      key={professional.id}
                      type="button"
                      onClick={() => {
                        setProfessionalId(professional.id);
                        setStep("datetime");
                      }}
                      className="rounded-2xl border border-line bg-paper p-4 text-left transition-colors hover:border-gold hover:bg-gold/5"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wine/10 font-semibold text-wine">
                        {professional.name.charAt(0)}
                      </div>
                      <p className="mt-3 font-medium text-wine">{professional.name}</p>
                      <p className="text-sm text-ink-soft">
                        {professional.workStart}–{professional.workEnd}
                      </p>
                    </button>
                  ))}
              </div>
              <Button variant="secondary" className="mt-4" onClick={() => setStep("service")}>
                Voltar
              </Button>
            </div>
          )}

          {/* Step 3 – Date & Time */}
          {step === "datetime" && (
            <div>
              <h2 className="mb-4 font-display text-xl text-wine">Quando você prefere?</h2>
              <Field
                id="date"
                label="Data"
                type="date"
                value={date}
                min={todayISO()}
                onChange={(e) => {
                  setDate(e.target.value);
                  setStart("");
                }}
              />
              {date && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-ink">Horários disponíveis</p>
                  {availableSlots.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line bg-cream p-4 text-sm text-ink-soft">
                      Nenhum horário disponível nesta data. Tente outro dia.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setStart(slot)}
                          className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                            start === slot
                              ? "border-wine bg-wine text-cream"
                              : "border-line bg-paper text-ink hover:border-gold hover:bg-gold/5"
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="mt-6 flex gap-3">
                <Button variant="secondary" onClick={() => setStep("professional")}>
                  Voltar
                </Button>
                <Button
                  variant="gold"
                  disabled={!start}
                  onClick={() => start && setStep("confirm")}
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 4 – Confirm */}
          {step === "confirm" && (
            <div>
              <h2 className="mb-4 font-display text-xl text-wine">Seus dados</h2>

              {/* Summary card */}
              <div className="mb-5 rounded-2xl border border-line bg-cream p-4 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink-soft">Serviço</span>
                  <span className="font-medium text-wine">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Profissional</span>
                  <span className="font-medium text-wine">{selectedProfessional?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Data</span>
                  <span className="font-medium text-wine capitalize">{formatLongDate(date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Horário</span>
                  <span className="font-medium text-wine">{start}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Valor</span>
                  <span className="font-medium text-gold-deep">
                    {selectedService ? formatBRL(selectedService.price) : "—"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Field
                  id="name"
                  label="Seu nome completo"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Field
                  id="phone"
                  label="Telefone / WhatsApp"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <TextAreaField
                  id="notes"
                  label="Observações (opcional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && (
                <p className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
              )}

              <div className="mt-6 flex gap-3">
                <Button variant="secondary" onClick={() => setStep("datetime")}>
                  Voltar
                </Button>
                <Button variant="gold" className="flex-1" onClick={handleConfirm}>
                  Confirmar agendamento
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
