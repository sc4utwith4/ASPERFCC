import { useEffect, useState } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { db } from "@/db/db";
import { semearBanco, type ProgressoSeed } from "@/db/seeder";
import { BarraFina } from "@/components/ui";
import { rotas } from "./rotas";

const router = createBrowserRouter(rotas);

/**
 * Inicialização: na primeira visita, espera o seeder popular o IndexedDB
 * (com progresso determinado, sem spinner). Nas seguintes, abre na hora e
 * sincroniza os lotes em segundo plano.
 */
export function App() {
  const [pronto, setPronto] = useState(false);
  const [progresso, setProgresso] = useState<ProgressoSeed>({ etapa: "Abrindo o banco local", feito: 0, total: 1 });
  const [erro, setErro] = useState<string>();

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const jaTemDados = (await db.questoes.count()) > 0;
        if (jaTemDados && ativo) setPronto(true);
        await semearBanco((p) => ativo && setProgresso(p));
        if (ativo) setPronto(true);
      } catch (e) {
        console.error(e);
        if (ativo) setErro((e as Error).message);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  if (erro) {
    return (
      <div className="mx-auto mt-24 max-w-md px-4 text-center">
        <p className="text-[15px] font-medium">Não foi possível abrir o banco local</p>
        <p className="mt-2 text-[13px] text-ink-2">{erro}</p>
        <p className="mt-2 text-[13px] text-ink-2">O app usa IndexedDB. Em janela privada ou com dados do site bloqueados, o navegador pode recusar o acesso.</p>
      </div>
    );
  }
  if (!pronto) {
    return (
      <div className="mx-auto mt-32 max-w-sm px-4" role="status" aria-live="polite">
        <p className="text-[14px] font-medium">Preparando o caderno</p>
        <p className="mt-1 text-[12.5px] text-ink-2">{progresso.etapa}</p>
        <BarraFina valor={progresso.total ? progresso.feito / progresso.total : 0} rotulo="Progresso da preparação" className="mt-3" />
      </div>
    );
  }
  return <RouterProvider router={router} />;
}
