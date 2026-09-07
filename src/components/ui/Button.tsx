import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "secondary";
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-rose text-white hover:bg-rose-hover disabled:opacity-50 disabled:pointer-events-none",
    secondary:
      "bg-paper text-ink border border-line hover:bg-cream-dark disabled:opacity-50",
    ghost: "bg-transparent text-rose hover:bg-cream-dark",
  };

  return (
    <button
      type={type}
      className={`inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-medium transition ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
