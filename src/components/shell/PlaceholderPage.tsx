import { AppShell } from "@/components/shell/AppShell";

export function PlaceholderPage({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <AppShell>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-gold">{badge}</p>
      <h1 className="mt-2 font-display text-3xl text-ink md:text-4xl">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">{description}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-line bg-paper p-6 text-sm text-ink-soft">
        Tela de estrutura da Fase 0. Conteúdo operacional entra nas próximas fases.
      </div>
    </AppShell>
  );
}
