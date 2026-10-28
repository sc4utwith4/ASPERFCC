import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Timer as TimerIcon } from "lucide-react";
import { MATERIAS, PROVA } from "@/data/edital";
import { db } from "@/db/db";
import { criarSimuladoProvaReal } from "@/db/servicos";
import { formatarDiaCurto } from "@/engine/datas";
import { Botao, Painel, Selo, TituloPagina } from "@/components/ui";
import { TabelaSimples } from "@/components/graficos";

export default function SimuladoPage() {
  const navigate = useNavigate();
  const [criando, setCriando] = useState(false);
  const simulados = useLiveQuery(() => db.baterias.where("tipo").equals("simulado-prova-real").reverse().sortBy("criadaEm"), []);
  const totalBanco = useLiveQuery(() => db.questoes.count(), []) ?? 0;
  const emAndamento = simulados?.find((s) => !s.encerradaEm);

  async function iniciar() {
    setCriando(true);
    const b = await criarSimuladoProvaReal();
    navigate(`/simulado/${b.id}`);
  }

  return (
    <>
      <TituloPagina titulo="Simulado Prova Real" subtitulo="70 questões na distribuição exata do edital B02, 4h30 de relógio, sem gabarito até o fim, e um estudo de caso para fechar." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Painel titulo="Como funciona" className="lg:col-span-2">
          <ul className="flex list-disc flex-col gap-1 pl-4 text-[13px] text-ink-2">
            <li>Questões sorteadas do banco por matéria, priorizando as que você menos viu; ordem de prova: Gerais e depois Específicos.</li>
            <li>Seletor de confiança ativo: acerto com dúvida conta como frágil no resultado.</li>
            <li>Reserve cerca de 60 min para o estudo de caso e 20 min para "transcrever o gabarito": na prova real, a folha de respostas é à parte.</li>
            <li>O resultado estima a nota padronizada com as premissas de média e desvio do grupo (Configurações).</li>
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {emAndamento ? (
              <Botao variante="primario" onClick={() => navigate(`/simulado/${emAndamento.id}`)} icone={<TimerIcon size={14} strokeWidth={1.7} />}>
                Retomar simulado em andamento
              </Botao>
            ) : (
              <Botao variante="primario" onClick={() => void iniciar()} disabled={criando || totalBanco === 0} icone={<TimerIcon size={14} strokeWidth={1.7} />}>
                Iniciar simulado (4h30)
              </Botao>
            )}
            {totalBanco < PROVA.totalQuestoes && <span className="text-[12.5px] text-warning-text">O banco tem só {totalBanco} questões; o simulado usará as disponíveis.</span>}
          </div>
        </Painel>
        <Painel titulo="Distribuição">
          <TabelaSimples cabecalho={["Matéria", "Questões", "Peso"]} linhas={MATERIAS.map((m) => [m.nomeCurto, String(m.questoesNaProva), String(m.peso)])} />
        </Painel>
        <Painel titulo="Simulados anteriores" className="lg:col-span-3">
          {!simulados?.length ? (
            <p className="text-[13px] text-ink-2">Nenhum ainda.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {simulados.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-[13px]">
                  <span className="text-ink">
                    Simulado {s.ciclo} · {formatarDiaCurto(s.dia)}
                  </span>
                  <span className="flex items-center gap-2">
                    {s.encerradaEm ? <Selo tom="salvia">encerrado</Selo> : <Selo tom="ambar">em andamento</Selo>}
                    <Link to={`/simulado/${s.id}`} className="text-[12.5px] text-accent-text hover:underline">
                      Abrir
                    </Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>
    </>
  );
}
