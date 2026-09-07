"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { isValidEmail, passwordError } from "@/lib/validation";

export function CadastroForm() {
  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (salonName.trim().length < 2) nextErrors.salonName = "Informe o nome do salão.";
    if (!isValidEmail(email)) nextErrors.email = "Informe um e-mail válido.";
    const pwd = passwordError(password);
    if (pwd) nextErrors.password = pwd;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setNotice("");
      return;
    }
    setNotice("O cadastro real do salão entra na Fase 1. Os campos e as regras desta tela já estão definidos.");
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <Field
        id="salonName"
        label="Nome do salão"
        value={salonName}
        onChange={(e) => setSalonName(e.target.value)}
        error={errors.salonName}
      />
      <Field
        id="phone"
        label="Telefone"
        type="tel"
        hint="Opcional na Fase 1"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Field
        id="email"
        label="E-mail do dono"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <Field
        id="password"
        label="Senha"
        type="password"
        autoComplete="new-password"
        hint="Mínimo de 8 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      {notice ? (
        <p className="rounded-xl bg-cream-dark px-3 py-2 text-sm text-ink-soft">{notice}</p>
      ) : null}
      <Button type="submit">Criar conta</Button>
      <p className="text-center text-sm text-ink-soft">
        Já tem conta?{" "}
        <Link className="font-medium text-rose hover:underline" href="/login">
          Entrar
        </Link>
      </p>
    </form>
  );
}
