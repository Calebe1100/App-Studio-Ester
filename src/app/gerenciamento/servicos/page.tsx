import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { ServicesView } from "@/components/backoffice/ServicesView";

export const metadata: Metadata = {
  title: "Serviços",
};

export default function ServicosPage() {
  return (
    <AppShell>
      <ServicesView />
    </AppShell>
  );
}
