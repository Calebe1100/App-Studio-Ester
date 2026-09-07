"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { isValidEmail } from "@/lib/validation";

export function RecoverForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      setNotice("");
      return;
    }
    setError("");
    setNotice("O envio de e-mail de recuperação entra na Fase 1.");
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <Field
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
      />
      {notice ? (
        <p className="rounded-xl bg-cream-dark px-3 py-2 text-sm text-ink-soft">{notice}</p>
      ) : null}
      <Button type="submit">Enviar link</Button>
      <p className="text-center text-sm text-ink-soft">
        <Link className="font-medium text-rose hover:underline" href="/login">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
