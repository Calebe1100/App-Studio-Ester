import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shell/PlaceholderPage";

export const metadata: Metadata = {
  title: "Clientes",
};

export default function ClientesPage() {
  return (
    <PlaceholderPage
      badge="Cadastros"
      title="Clientes"
      description="Lista e cadastro de clientes da operação. Implementação na Fase 1."
    />
  );
}
