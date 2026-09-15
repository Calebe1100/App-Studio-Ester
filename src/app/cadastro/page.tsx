import { redirect } from "next/navigation";

/**
 * O salão é único e fixo — não há cadastro público de salão.
 * Qualquer acesso a /cadastro é redirecionado para /login.
 */
export default function CadastroPage() {
  redirect("/login");
}
