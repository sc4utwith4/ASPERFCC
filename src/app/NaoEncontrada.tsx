import { Link } from "react-router";
import { Vazio } from "@/components/ui";

export function NaoEncontrada() {
  return (
    <Vazio titulo="Página não encontrada" acao={<Link to="/" className="text-[13px] text-accent-text hover:underline">Voltar para Hoje</Link>}>
      O endereço não corresponde a nenhuma tela do caderno.
    </Vazio>
  );
}
