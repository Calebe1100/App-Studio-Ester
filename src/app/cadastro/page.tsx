import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CadastroForm } from "@/components/auth/CadastroForm";

export const metadata: Metadata = {
  title: "Cadastrar salão",
};

export default function CadastroPage() {
  return (
    <AuthLayout
      title="Cadastrar salão"
      subtitle="Crie a conta do negócio. O primeiro usuário será o dono."
    >
      <CadastroForm />
    </AuthLayout>
  );
}
