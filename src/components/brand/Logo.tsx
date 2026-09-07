export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose text-sm font-semibold tracking-wide text-white">
        SE
      </span>
      {compact ? null : (
        <span className="leading-tight">
          <span className="block font-display text-lg text-ink">Studio Ester</span>
          <span className="block text-xs text-ink-soft">Agenda do salão</span>
        </span>
      )}
    </div>
  );
}
