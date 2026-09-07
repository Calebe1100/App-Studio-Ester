import type { Metadata } from "next";
import { PlaceholderPage } from "@/components/shell/PlaceholderPage";

export const metadata: Metadata = {
  title: "Profissionais",
};

export default function ProfissionaisPage() {
  return (
    <PlaceholderPage
      badge="Cadastros"
      title="Profissionais"
      description="Cadastro de profissionais e horários de trabalho. Implementação na Fase 1."
    />
  );
}
