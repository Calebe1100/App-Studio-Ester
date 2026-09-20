export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function passwordError(value: string) {
  if (value.length < 8) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }
  return null;
}

/** Mantém apenas os dígitos do telefone. */
export function phoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

/** Celular/fixo brasileiro: 10 ou 11 dígitos com DDD. */
export function isValidPhone(value: string) {
  const digits = phoneDigits(value);
  if (digits.startsWith("55")) return digits.length === 12 || digits.length === 13;
  return digits.length === 10 || digits.length === 11;
}

/** Aplica a máscara (99) 99999-9999 conforme o usuário digita. */
export function formatPhone(value: string) {
  const digits = phoneDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export const RESET_CODE_LENGTH = 6;

export function resetCodeError(value: string) {
  if (phoneDigits(value).length !== RESET_CODE_LENGTH) {
    return `O código tem ${RESET_CODE_LENGTH} dígitos.`;
  }
  return null;
}
