import type { Metadata } from "next";
import { AgendaView } from "@/components/agenda/AgendaView";
import { ProtectedShell } from "@/components/shell/ProtectedShell";

export const metadata: Metadata = {
  title: "Agenda",
};

export default function AgendaPage() {
  return (
    <ProtectedShell>
      <AgendaView />
    </ProtectedShell>
  );
}
