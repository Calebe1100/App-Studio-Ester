import type { Metadata } from "next";
import { TotalsView } from "@/components/backoffice/TotalsView";
import { ProtectedShell } from "@/components/shell/ProtectedShell";

export const metadata: Metadata = {
  title: "Totais",
};

export default function TotaisPage() {
  return (
    <ProtectedShell roles={["dono"]}>
      <TotalsView />
    </ProtectedShell>
  );
}
