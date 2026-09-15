import type { Metadata } from "next";
import { ServicesView } from "@/components/backoffice/ServicesView";
import { ProtectedShell } from "@/components/shell/ProtectedShell";

export const metadata: Metadata = {
  title: "Serviços",
};

export default function ServicosPage() {
  return (
    <ProtectedShell roles={["dono"]}>
      <ServicesView />
    </ProtectedShell>
  );
}
