import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RecoverForm } from "@/components/auth/RecoverForm";

export const metadata: Metadata = {
  title: "Recuperar senha",
};

export default function RecoverPage() {
  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe o e-mail da conta. O envio do link entra na Fase 1."
    >
      <RecoverForm />
    </AuthLayout>
  );
}
