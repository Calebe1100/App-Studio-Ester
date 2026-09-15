import type { Metadata } from "next";
import { AppShell } from "@/components/shell/AppShell";
import { TotalsView } from "@/components/backoffice/TotalsView";

export const metadata: Metadata = {
  title: "Totais",
};

export default function TotaisPage() {
  return (
    <AppShell>
      <TotalsView />
    </AppShell>
  );
}
