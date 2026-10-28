import { isRouteErrorResponse, useRouteError } from "react-router";

/** Erro de renderização de uma tela: mensagem legível em vez da tela padrão do roteador. */
export function ErroRota() {
  const erro = useRouteError();
  const mensagem = isRouteErrorResponse(erro) ? `${erro.status} ${erro.statusText}` : erro instanceof Error ? erro.message : String(erro);
  return (
    <div className="mx-auto mt-24 max-w-lg px-4">
      <div className="surface-panel p-5">
        <p className="text-[15px] font-semibold text-ink">Algo deu errado nesta tela</p>
        <p className="mt-2 font-mono text-[12.5px] text-danger-text">{mensagem}</p>
        <p className="mt-3 text-[13px] text-ink-2">Seu progresso está salvo no navegador. Volte para o início; se o erro continuar, exporte um backup em Banco e backup.</p>
        <a href="/" className="mt-4 inline-block text-[13px] text-accent-text hover:underline">
          Voltar para Hoje
        </a>
      </div>
    </div>
  );
}
