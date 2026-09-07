export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function passwordError(value: string) {
  if (value.length < 8) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }
  return null;
}
