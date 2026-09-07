import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shell/PlaceholderPage";

export const metadata: Metadata = {
  title: "Agenda",
};

export default function AgendaPage() {
  return (
    <PlaceholderPage
      badge="Operação"
      title="Agenda"
      description="Grade do dia, status dos atendimentos e valor do serviço somente leitura. Implementação na Fase 2."
    />
  );
}
