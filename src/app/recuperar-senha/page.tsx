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
      subtitle="Informe o celular cadastrado. Enviamos um código por WhatsApp (ou SMS) para você criar uma nova senha."
    >
      <RecoverForm />
    </AuthLayout>
  );
}
