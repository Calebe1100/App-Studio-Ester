import type { InputHTMLAttributes } from "react";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>;

export function Field({ id, label, error, hint, className = "", ...props }: FieldProps) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        id={id}
        className={`h-11 w-full rounded-xl border bg-paper px-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-rose focus:ring-2 focus:ring-rose/20 ${
          error ? "border-danger" : "border-line"
        } ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      {hint && !error ? <span className="text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
}
