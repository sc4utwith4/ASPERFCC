import { useCallback, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { carregarCasos } from "@/data/banco";
import { db } from "@/db/db";
import { mapaDeQuestoes, registrarTentativa } from "@/db/servicos";
import { hoje } from "@/engine/datas";
import { geradorDe } from "@/engine/rng";
import { Botao, Painel, TituloPagina, Vazio } from "@/components/ui";
import type { RespostaRegistrada } from "@/features/questao/Resolvedor";
import { usePremissas } from "../dados";
import { ResultadoSimulado } from "./ResultadoSimulado";
import { SimuladoRunner, type PreparoSimulado } from "./SimuladoRunner";

export default function SimuladoExecucaoPage() {
  const { bateriaId } = useParams();
  const premissas = usePremissas();
  const navigate = useNavigate();
  const [versao, setVersao] = useState(0);
  const dados = useLiveQuery(async () => {
    if (!bateriaId) return null;
    const bateria = await db.baterias.get(bateriaId);
    if (!bateria) return null;
    const tentativas = await db.tentativas.where("bateriaId").equals(bateriaId).toArray();
    const questoes = await mapaDeQuestoes(bateria.questaoIds);
    const casos = await carregarCasos();
    const caso = casos.length ? casos[Math.floor(geradorDe(bateria.seed)() * casos.length)] : undefined;
    return { bateria, tentativas, questoes, caso };
  }, [bateriaId, versao]);

  const finalizar = useCallback(async () => {
    if (!bateriaId) return;
    await db.baterias.update(bateriaId, { encerradaEm: Date.now(), concluidaEm: Date.now(), diaConclusao: hoje() });
    setVersao((v) => v + 1);
  }, [bateriaId]);

  if (dados === undefined) return null;
  if (dados === null) return <Vazio titulo="Simulado não encontrado" />;
  const { bateria, tentativas, questoes, caso } = dados;

  async function registrar(p: PreparoSimulado, r: RespostaRegistrada) {
    await registrarTentativa({
      questaoId: p.questao.id,
      materiaSlug: p.questao.materiaSlug,
      bateriaId: bateria.id,
      contexto: "simulado",
      modo: "padrao",
      sessaoId: bateria.seed,
      varianteIdx: p.varianteIdx,
      ordem: p.ordem,
      letraCorreta: p.letraCorreta,
      escolhidaId: r.escolhidaId,
      riscadas: r.riscadas,
      confianca: r.confianca,
      acertou: r.acertou,
      resultado: r.resultado,
      tempoMs: r.tempoMs,
      dia: hoje(),
      respondidaEm: Date.now(),
    });
  }

  if (!bateria.encerradaEm) {
    return (
      <SimuladoRunner
        titulo={`Simulado Prova Real ${bateria.ciclo}`}
        questaoIds={bateria.questaoIds}
        limiteMs={bateria.limiteMs ?? 270 * 60_000}
        iniciadaEm={bateria.iniciadaEm ?? bateria.criadaEm}
        seed={bateria.seed}
        respondidas={new Set(tentativas.map((t) => t.questaoId))}
        onRegistrar={registrar}
        onFinalizar={() => void finalizar()}
      />
    );
  }

  return (
    <>
      <TituloPagina titulo={`Resultado · Simulado Prova Real ${bateria.ciclo}`} subtitulo={`${bateria.questaoIds.length} questões`} />
      {caso && (
        <Painel titulo="Fechamento: estudo de caso" className="mb-4">
          <p className="text-[13px] text-ink-2">Na prova, a discursiva divide as mesmas 4h30. Faça agora o caso sorteado para treinar o pacote completo.</p>
          <Botao variante="primario" className="mt-3" onClick={() => navigate(`/discursiva/${caso.id}`)}>
            Abrir "{caso.titulo}"
          </Botao>
        </Painel>
      )}
      <ResultadoSimulado questaoIds={bateria.questaoIds} tentativas={tentativas} questoes={questoes} premissas={premissas} provaReal />
    </>
  );
}
