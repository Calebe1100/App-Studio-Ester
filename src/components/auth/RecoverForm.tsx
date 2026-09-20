"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import {
  RESET_CODE_LENGTH,
  formatPhone,
  isValidPhone,
  passwordError,
  phoneDigits,
  resetCodeError,
} from "@/lib/validation";
import { ApiError, apiForgotPassword, apiResetPassword, apiVerifyResetCode } from "@/lib/api";

type Step = "phone" | "code" | "password" | "done";

const RESEND_SECONDS = 60;
const CONNECTION_ERROR = "Erro ao conectar com o servidor. Tente novamente.";

export function RecoverForm() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  function describeError(err: unknown) {
    return err instanceof ApiError && err.message ? err.message : CONNECTION_ERROR;
  }

  async function requestCode(resending = false) {
    setFieldError("");
    setNotice("");

    if (!isValidPhone(phone)) {
      setFieldError("Informe um celular válido com DDD.");
      return;
    }

    setLoading(true);
    try {
      const { expiresInMinutes } = await apiForgotPassword(phoneDigits(phone));
      // A API sempre responde 200 para não revelar se o celular existe
      setStep("code");
      setSecondsLeft(RESEND_SECONDS);
      setNotice(
        resending
          ? "Enviamos um novo código."
          : `Se esse celular estiver cadastrado, o código chega em instantes por WhatsApp ou SMS. Ele vale por ${expiresInMinutes ?? 10} minutos.`,
      );
    } catch (err) {
      setFieldError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setFieldError("");
    setNotice("");

    const invalid = resetCodeError(code);
    if (invalid) {
      setFieldError(invalid);
      return;
    }

    setLoading(true);
    try {
      const { resetToken: token } = await apiVerifyResetCode(phoneDigits(phone), phoneDigits(code));
      setResetToken(token);
      setStep("password");
    } catch (err) {
      setFieldError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  async function savePassword() {
    setFieldError("");
    setNotice("");

    const invalid = passwordError(password);
    if (invalid) {
      setFieldError(invalid);
      return;
    }
    if (password !== confirm) {
      setFieldError("As senhas não conferem.");
      return;
    }

    setLoading(true);
    try {
      await apiResetPassword(resetToken, password);
      setStep("done");
    } catch (err) {
      setFieldError(describeError(err));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (step === "phone") void requestCode();
    if (step === "code") void verifyCode();
    if (step === "password") void savePassword();
  }

  function restart() {
    setStep("phone");
    setCode("");
    setResetToken("");
    setFieldError("");
    setNotice("");
    setSecondsLeft(0);
  }

  if (step === "done") {
    return (
      <div className="space-y-4">
        <p role="status" className="rounded-xl bg-cream-dark px-3 py-2 text-sm text-ink-soft">
          Senha atualizada. Use a nova senha para entrar.
        </p>
        <Link href="/login" className="block">
          <Button className="w-full">Ir para o login</Button>
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      {step === "phone" ? (
        <Field
          id="phone"
          label="Celular"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="(11) 99999-9999"
          hint="Use o número cadastrado na sua conta."
          value={phone}
          onChange={(e) => {
            setPhone(formatPhone(e.target.value));
            setFieldError("");
          }}
          error={fieldError}
        />
      ) : null}

      {step === "code" ? (
        <>
          <p className="text-sm text-ink-soft">
            Código enviado para <strong className="text-ink">{phone}</strong>.{" "}
            <button type="button" className="font-medium text-wine hover:underline" onClick={restart}>
              Trocar número
            </button>
          </p>
          <Field
            id="code"
            label={`Código de ${RESET_CODE_LENGTH} dígitos`}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={RESET_CODE_LENGTH}
            placeholder="000000"
            className="tracking-[0.4em]"
            value={code}
            onChange={(e) => {
              setCode(phoneDigits(e.target.value).slice(0, RESET_CODE_LENGTH));
              setFieldError("");
            }}
            error={fieldError}
          />
        </>
      ) : null}

      {step === "password" ? (
        <>
          <Field
            id="password"
            label="Nova senha"
            type="password"
            autoComplete="new-password"
            hint="Mínimo de 8 caracteres"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldError("");
            }}
          />
          <Field
            id="confirm"
            label="Confirmar nova senha"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setFieldError("");
            }}
            error={fieldError}
          />
        </>
      ) : null}

      {notice ? (
        <p role="status" className="rounded-xl bg-cream-dark px-3 py-2 text-sm text-ink-soft">
          {notice}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? "Enviando…"
          : step === "phone"
            ? "Enviar código"
            : step === "code"
              ? "Validar código"
              : "Salvar nova senha"}
      </Button>

      {step === "code" ? (
        <Button
          variant="ghost"
          className="w-full"
          disabled={loading || secondsLeft > 0}
          onClick={() => void requestCode(true)}
        >
          {secondsLeft > 0 ? `Reenviar código em ${secondsLeft}s` : "Reenviar código"}
        </Button>
      ) : null}

      <p className="text-center text-sm text-ink-soft">
        <Link className="font-medium text-wine hover:underline" href="/login">
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}
