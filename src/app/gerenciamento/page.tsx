import type { Metadata } from "next";
import { DashboardView } from "@/components/backoffice/DashboardView";
import { ProtectedShell } from "@/components/shell/ProtectedShell";

export const metadata: Metadata = {
  title: "Gerenciamento",
};

export default function GerenciamentoPage() {
  return (
    <ProtectedShell roles={["dono"]}>
      <DashboardView />
    </ProtectedShell>
  );
}
