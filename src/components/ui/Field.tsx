import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClass =
  "h-11 w-full rounded-xl border bg-paper px-3 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-gold focus:ring-2 focus:ring-gold/25";

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
        className={`${fieldClass} ${error ? "border-danger" : "border-line"} ${className}`}
        {...props}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
      {hint && !error ? <span className="text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({ id, label, error, children, className = "", ...props }: SelectFieldProps) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <select
        id={id}
        className={`${fieldClass} ${error ? "border-danger" : "border-line"} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}

type AreaProps = {
  id: string;
  label: string;
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ id, label, className = "", ...props }: AreaProps) {
  return (
    <label className="block space-y-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        id={id}
        className={`min-h-20 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-gold focus:ring-2 focus:ring-gold/25 ${className}`}
        {...props}
      />
    </label>
  );
}
