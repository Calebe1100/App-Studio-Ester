import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "secondary" | "gold";
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-wine text-gold-bright hover:bg-wine-hover disabled:opacity-50 disabled:pointer-events-none",
    gold: "bg-gold text-wine-deep hover:bg-gold-bright disabled:opacity-50 disabled:pointer-events-none",
    secondary:
      "bg-paper text-ink border border-line hover:bg-cream-dark disabled:opacity-50",
    ghost: "bg-transparent text-wine hover:bg-cream-dark",
  };

  return (
    <button
      type={type}
      className={`inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-medium transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
