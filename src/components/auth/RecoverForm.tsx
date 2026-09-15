"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { isValidEmail } from "@/lib/validation";
import { apiForgotPassword, ApiError } from "@/lib/api";

export function RecoverForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFieldError("");
    setNotice("");

    if (!isValidEmail(email)) {
      setFieldError("Informe um e-mail válido.");
      return;
    }

    setLoading(true);
    try {
      await apiForgotPassword(email.trim().toLowerCase());
      // A API sempre retorna 200 para não revelar se o e-mail existe
      setNotice("Se esse e-mail estiver cadastrado, você receberá as instruções em breve.");
      setEmail("");
    } catch (err) {
      if (err instanceof ApiError && err.status !== 200) {
        setFieldError("Erro ao conectar com o servidor. Tente novamente.");
      } else {
        // Mesmo em caso de erro inesperado, não revelar informação
        setNotice("Se esse e-mail estiver cadastrado, você receberá as instruções em breve.");
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
        onChange={(e) => { setEmail(e.target.value); setFieldError(""); setNotice(""); }}
        error={fieldError}
      />

      {notice ? (
        <p role="status" className="rounded-xl bg-cream-dark px-3 py-2 text-sm text-ink-soft">
          {notice}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading || !!notice}>
        {loading ? "Enviando…" : "Enviar link"}
      </Button>

      <p className="text-center text-sm text-ink-soft">
        <Link className="font-medium text-wine hover:underline" href="/login">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
