import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Entrar"
      subtitle="Acesse a agenda do salão com o e-mail da sua conta."
    >
      <LoginForm />
    </AuthLayout>
  );
}
