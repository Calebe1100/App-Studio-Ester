"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { isValidEmail, passwordError } from "@/lib/validation";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export function LoginForm() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setApiError("");

    // Validação local
    const nextErrors: typeof errors = {};
    if (!isValidEmail(email)) nextErrors.email = "Informe um e-mail válido.";
    const pwd = passwordError(password);
    if (pwd) nextErrors.password = pwd;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      // login() redireciona para /agenda em caso de sucesso
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setApiError("E-mail ou senha incorretos.");
        } else {
          setApiError("Erro ao conectar com o servidor. Tente novamente.");
        }
      } else {
        setApiError("Erro inesperado. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <Field
        id="email"
        label="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setApiError(""); }}
        error={errors.email}
      />
      <Field
        id="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => { setPassword(e.target.value); setApiError(""); }}
        error={errors.password}
      />

      {apiError ? (
        <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
          {apiError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando…" : "Entrar"}
      </Button>

      <div className="flex flex-col gap-2 text-center text-sm">
        <Link className="text-wine hover:underline" href="/recuperar-senha">
          Esqueci a senha
        </Link>
      </div>
    </form>
  );
}
