import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shell/PlaceholderPage";
import { ProtectedShell } from "@/components/shell/ProtectedShell";

export const metadata: Metadata = {
  title: "Clientes",
};

export default function ClientesPage() {
  return (
    <ProtectedShell roles={["dono", "recepcao"]}>
      <PlaceholderPage
        badge="Cadastros"
        title="Clientes"
        description="Lista e cadastro de clientes da operação. Implementação na Fase 1."
      />
    </ProtectedShell>
  );
}
