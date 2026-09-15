import type { Metadata } from "next";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { ProtectedShell } from "@/components/shell/ProtectedShell";

export const metadata: Metadata = {
  title: "Agendar",
};

export default function AgendarPage() {
  return (
    <ProtectedShell>
      <BookingWizard />
    </ProtectedShell>
  );
}
