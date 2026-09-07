"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { isValidEmail, passwordError } from "@/lib/validation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [notice, setNotice] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!isValidEmail(email)) nextErrors.email = "Informe um e-mail válido.";
    const pwd = passwordError(password);
    if (pwd) nextErrors.password = pwd;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setNotice("");
      return;
    }
    setNotice("Autenticação entra na Fase 1. Por enquanto a tela e a validação já estão prontas.");
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
        error={errors.email}
      />
      <Field
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      {notice ? (
        <p className="rounded-xl bg-cream-dark px-3 py-2 text-sm text-ink-soft">{notice}</p>
      ) : null}
      <Button type="submit">Entrar</Button>
      <div className="flex flex-col gap-2 text-center text-sm">
        <Link className="text-rose hover:underline" href="/recuperar-senha">
          Esqueci a senha
        </Link>
        <p className="text-ink-soft">
          Primeiro acesso?{" "}
          <Link className="font-medium text-rose hover:underline" href="/cadastro">
            Cadastrar salão
          </Link>
        </p>
      </div>
    </form>
  );
}
