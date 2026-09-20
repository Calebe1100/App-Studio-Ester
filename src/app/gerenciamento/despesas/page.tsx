import type { Metadata } from "next";
import { ExpensesView } from "@/components/backoffice/ExpensesView";
import { ProtectedShell } from "@/components/shell/ProtectedShell";

export const metadata: Metadata = {
  title: "Despesas",
};

export default function DespesasPage() {
  return (
    <ProtectedShell roles={["dono"]}>
      <ExpensesView />
    </ProtectedShell>
  );
}
