import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, GalleryVerticalEnd, ListChecks, Timer as TimerIcon } from "lucide-react";
import { getMateria, type MateriaSlug } from "@/data/edital";
import { db, type QuestaoRegistro, type Tentativa } from "@/db/db";
import { avaliarFlashcard, concluirEtapaDoPacote, exposicoesAnteriores, garantirFlashcardDaQuestao, mapaDeQuestoes, registrarResultadoRevisao, registrarTentativa, ultimaLetraCorreta } from "@/db/servicos";
import type { AlternativaId } from "@/data/schema";
import { letraDaCorreta, permutarAlternativas, type Letra } from "@/engine/alternativas";
import { prioridadeRevisao, ROTULO_RESULTADO } from "@/engine/classificacao";
import { formatarDiaCurto, hoje } from "@/engine/datas";
import { proximosIntervalos } from "@/engine/flashcardSrs";
import { escolherSubModo, type SubModoMutacao } from "@/engine/mutacao";
import { novoId } from "@/engine/rng";
import { etapaAtual, itensParaRevisar, pacoteVencido, type ModoRevisao, type PacoteRevisao } from "@/engine/srs";
import { escolherEnunciado } from "@/engine/variantes";
import { Alternador, BarraSegmentada, Botao, Painel, Selo, TituloPagina, Vazio } from "@/components/ui";
import { Resolvedor, type RespostaRegistrada } from "@/features/questao/Resolvedor";
import { SessaoFlashcards } from "@/features/flashcards/SessaoFlashcards";
import { SimuladoRunner, type PreparoSimulado } from "@/features/simulado/SimuladoRunner";
import { ResultadoSimulado } from "@/features/simulado/ResultadoSimulado";

const MINUTOS_POR_QUESTAO = 2.6;
const TOM_ESTADO = { ativo: "neutro", graduado: "salvia", critico: "terracota" } as const;

type Fase = { tipo: "escolha" } | { tipo: "erros"; mutacao: boolean } | { tipo: "flashcards" } | { tipo: "simulado"; iniciadaEm: number } | { tipo: "resumo"; modo: ModoRevisao; texto: string };

export default function PacotePage() {
  const { pacoteId } = useParams();
  const navigate = useNavigate();
  const [sessaoId] = useState(() => novoId("sessao"));
  const [fase, setFase] = useState<Fase>({ tipo: "escolha" });
  const pacote = useLiveQuery(() => (pacoteId ? db.pacotes.get(pacoteId) : undefined), [pacoteId]);
  const questoes = useLiveQuery(async () => (pacote ? mapaDeQuestoes([...pacote.questoesDaBateria, ...pacote.itens.map((i) => i.questaoId)]) : undefined), [pacote?.id]);

  if (pacote === undefined || questoes === undefined) return null;
  if (!pacote) return <Vazio titulo="Pacote não encontrado" acao={<Botao onClick={() => navigate("/revisao")}>Voltar</Botao>} />;
  const materia = getMateria(pacote.materiaSlug as MateriaSlug);
  const etapa = etapaAtual(pacote);
  const vencido = pacoteVencido(pacote, hoje());

  async function concluir(modo: ModoRevisao, texto: string) {
    await concluirEtapaDoPacote(pacote!.id, modo);
    setFase({ tipo: "resumo", modo, texto });
  }

  return (
    <>
      <button type="button" onClick={() => navigate("/revisao")} className="quiet-transition mb-3 inline-flex items-center gap-1 text-[12.5px] text-ink-2 hover:text-ink">
        <ArrowLeft size={14} strokeWidth={1.7} /> Revisão
      </button>
      <TituloPagina
        titulo={`Pacote de revisão · ${materia.nome}`}
        subtitulo={`Consolidado em ${formatarDiaCurto(pacote.criadoEm)} · ${itensParaRevisar(pacote).length} de ${pacote.itens.length} itens ativos${etapa ? ` · etapa atual: ${etapa.final ? "revisão final (D-3)" : `+${etapa.offsetDias}`} em ${formatarDiaCurto(etapa.dataPrevista)}` : ""}`}
      />
      {fase.tipo === "escolha" && <Escolha pacote={pacote} questoes={questoes} vencido={vencido} onEscolher={setFase} />}
      {fase.tipo === "erros" && <SessaoErros pacote={pacote} questoes={questoes} mutacao={fase.mutacao} sessaoId={sessaoId} onFim={(t) => void concluir("erros-frageis", t)} />}
      {fase.tipo === "flashcards" && <SessaoCartoes pacote={pacote} questoes={questoes} onFim={(t) => void concluir("flashcards", t)} />}
      {fase.tipo === "simulado" && <SessaoSimulado pacote={pacote} sessaoId={sessaoId} iniciadaEm={fase.iniciadaEm} onFim={(t) => void concluir("simulado", t)} />}
      {fase.tipo === "resumo" && (
        <ResumoSessao pacote={pacote} questoes={questoes} fase={fase} sessaoId={sessaoId} onVoltar={() => navigate("/revisao")} />
      )}
    </>
  );
}

function Escolha({ pacote, questoes, vencido, onEscolher }: { pacote: PacoteRevisao; questoes: Map<string, QuestaoRegistro>; vencido: boolean; onEscolher: (f: Fase) => void }) {
  const [mutacao, setMutacao] = useState((etapaAtual(pacote)?.indice ?? 0) >= 1);
  const ativos = itensParaRevisar(pacote);
  const etapa = etapaAtual(pacote);
  const minutos = Math.round(pacote.questoesDaBateria.length * MINUTOS_POR_QUESTAO);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {!etapa ? (
        <Painel titulo="Pacote concluído" className="lg:col-span-3">
          <p className="text-[13px] text-ink-2">Todas as etapas foram feitas ou todos os itens graduaram.</p>
        </Painel>
      ) : (
        <>
          {!vencido && (
            <p className="rounded-lg border border-line bg-surface px-3 py-2 text-[12.5px] text-ink-2 lg:col-span-3">
              Esta etapa vence em {formatarDiaCurto(etapa.dataPrevista)}. Você pode antecipá-la; as etapas seguintes passam a contar a partir de hoje.
            </p>
          )}
          <ModoCard
            icone={<ListChecks size={16} strokeWidth={1.7} />}
            titulo="Erros + acertos frágeis"
            descricao={`${ativos.length} questões, com alternativas embaralhadas e contexto do enunciado rotacionado.`}
            acao={
              <>
                <Alternador ativo={mutacao} onChange={setMutacao} rotulo="Modo Mutação (caça ao erro)" descricao="Cada questão vira caça ao erro, versão invertida ou justificativa." />
                <Botao variante="primario" className="mt-3 w-full" disabled={ativos.length === 0} onClick={() => onEscolher({ tipo: "erros", mutacao })}>
                  Começar
                </Botao>
              </>
            }
          />
          <ModoCard
            icone={<GalleryVerticalEnd size={16} strokeWidth={1.7} />}
            titulo="Flashcards rápidos"
            descricao="Cartões gerados do resumo de cada questão errada ou frágil. Revisam o conceito; a graduação da questão acontece nos modos com questão."
            acao={
              <Botao variante="primario" className="mt-3 w-full" disabled={ativos.length === 0} onClick={() => onEscolher({ tipo: "flashcards" })}>
                Começar
              </Botao>
            }
          />
          <ModoCard
            icone={<TimerIcon size={16} strokeWidth={1.7} />}
            titulo="Refazer a bateria em simulado"
            descricao={`${pacote.questoesDaBateria.length} questões cronometradas (${minutos} min, ${MINUTOS_POR_QUESTAO} min por questão), sem gabarito até o fim.`}
            acao={
              <Botao variante="primario" className="mt-3 w-full" onClick={() => onEscolher({ tipo: "simulado", iniciadaEm: Date.now() })}>
                Começar
              </Botao>
            }
          />
        </>
      )}
      <Painel titulo="Itens do pacote" className="lg:col-span-3">
        <ul className="flex flex-col divide-y divide-line">
          {[...pacote.itens].sort((a, b) => prioridadeRevisao(b.origem) - prioridadeRevisao(a.origem)).map((item) => {
            const q = questoes.get(item.questaoId);
            return (
              <li key={item.questaoId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="min-w-0 text-[13px] text-ink">
                  <span className="tabular text-ink-2">{item.questaoId}</span> · {q?.subtopico}
                </span>
                <span className="flex flex-wrap items-center gap-1.5">
                  <Selo tom="neutro">origem: {ROTULO_RESULTADO[item.origem].toLowerCase()}</Selo>
                  {item.historico.length > 0 && <span className="tabular text-[12px] text-ink-2">{item.historico.map((h) => (h.resultado === "ACERTO_SOLIDO" ? "●" : h.resultado === "ACERTO_FRAGIL" ? "◐" : "○")).join(" ")}</span>}
                  <Selo tom={TOM_ESTADO[item.estado]}>{item.estado}</Selo>
                </span>
              </li>
            );
          })}
        </ul>
      </Painel>
    </div>
  );
}

function ModoCard({ icone, titulo, descricao, acao }: { icone: React.ReactNode; titulo: string; descricao: string; acao: React.ReactNode }) {
  return (
    <section className="surface-card flex flex-col p-4">
      <h2 className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
        <span className="text-accent-text">{icone}</span>
        {titulo}
      </h2>
      <p className="mt-1 mb-3 flex-1 text-[12.5px] text-ink-2">{descricao}</p>
      <div>{acao}</div>
    </section>
  );
}

interface PreparoRevisao {
  questao: QuestaoRegistro;
  ordem: AlternativaId[];
  varianteIdx: number;
  letraCorreta: Letra;
  modo: "padrao" | SubModoMutacao;
}

function SessaoErros({ pacote, questoes, mutacao, sessaoId, onFim }: { pacote: PacoteRevisao; questoes: Map<string, QuestaoRegistro>; mutacao: boolean; sessaoId: string; onFim: (texto: string) => void }) {
  const [fila] = useState(() =>
    itensParaRevisar(pacote)
      .sort((a, b) => (b.estado === "critico" ? 1 : 0) - (a.estado === "critico" ? 1 : 0) || prioridadeRevisao(b.origem) - prioridadeRevisao(a.origem))
      .map((i) => i.questaoId),
  );
  const [indice, setIndice] = useState(0);
  const [preparo, setPreparo] = useState<PreparoRevisao>();
  const [placar, setPlacar] = useState({ solidos: 0, frageis: 0, erros: 0 });
  const id = fila[indice];

  useEffect(() => {
    if (!id) return;
    let ativo = true;
    setPreparo(undefined);
    void (async () => {
      const q = questoes.get(id) ?? (await db.questoes.get(id));
      if (!q || !ativo) return;
      const [exposicoes, ultima] = await Promise.all([exposicoesAnteriores(id), ultimaLetraCorreta(id)]);
      const ordem = permutarAlternativas(q, sessaoId, ultima);
      setPreparo({ questao: q, ordem, varianteIdx: escolherEnunciado(q, Math.max(1, exposicoes)).varianteIdx, letraCorreta: letraDaCorreta(q, ordem), modo: mutacao ? escolherSubModo(q, sessaoId) : "padrao" });
    })();
    return () => {
      ativo = false;
    };
  }, [id, questoes, sessaoId, mutacao]);

  async function registrar(r: RespostaRegistrada) {
    if (!preparo) return;
    const dia = hoje();
    await registrarTentativa({
      questaoId: preparo.questao.id,
      materiaSlug: preparo.questao.materiaSlug,
      pacoteId: pacote.id,
      contexto: "revisao",
      modo: preparo.modo,
      sessaoId,
      varianteIdx: preparo.varianteIdx,
      ordem: preparo.ordem,
      letraCorreta: preparo.letraCorreta,
      escolhidaId: r.escolhidaId,
      riscadas: r.riscadas,
      confianca: r.confianca,
      acertou: r.acertou,
      resultado: r.resultado,
      tempoMs: r.tempoMs,
      dia,
      respondidaEm: Date.now(),
      justificativa: r.justificativa,
    });
    await registrarResultadoRevisao(pacote.id, preparo.questao.id, r.resultado, dia);
    setPlacar((p) => ({ solidos: p.solidos + (r.resultado === "ACERTO_SOLIDO" ? 1 : 0), frageis: p.frageis + (r.resultado === "ACERTO_FRAGIL" ? 1 : 0), erros: p.erros + (r.acertou ? 0 : 1) }));
  }

  function proxima() {
    if (indice + 1 >= fila.length) {
      onFim(`${placar.solidos} sólidos, ${placar.frageis} frágeis e ${placar.erros} erros em ${fila.length} questões.`);
      return;
    }
    setIndice((i) => i + 1);
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-4">
        <p className="tabular text-[12.5px] text-ink-2">
          Questão {indice + 1} de {fila.length}
        </p>
        <BarraSegmentada s={{ ...placar, total: fila.length }} className="mt-1.5" altura={4} />
      </div>
      {preparo ? (
        <Resolvedor
          key={`${preparo.questao.id}`}
          questao={preparo.questao}
          ordem={preparo.ordem}
          varianteIdx={preparo.varianteIdx}
          letraCorreta={preparo.letraCorreta}
          modo={preparo.modo}
          seed={sessaoId}
          onRegistrar={registrar}
          onProxima={proxima}
          rotuloProxima={indice + 1 >= fila.length ? "Concluir etapa" : "Próxima"}
          cabecalho={<p className="mb-3 text-[12px] text-ink-2">{preparo.questao.subtopico} · {preparo.questao.id}</p>}
        />
      ) : (
        <p className="text-[13px] text-ink-2" role="status">
          Carregando questão…
        </p>
      )}
    </div>
  );
}

function SessaoCartoes({ pacote, questoes, onFim }: { pacote: PacoteRevisao; questoes: Map<string, QuestaoRegistro>; onFim: (texto: string) => void }) {
  const cards = useLiveQuery(async () => {
    const lista = [];
    for (const item of itensParaRevisar(pacote)) {
      const q = questoes.get(item.questaoId);
      if (q) lista.push(await garantirFlashcardDaQuestao(q));
    }
    return lista;
  }, [pacote.id]);
  if (!cards) return null;
  const porId = new Map(cards.map((c) => [c.id, c]));
  return (
    <SessaoFlashcards
      cartoes={cards.map((c) => ({ id: c.id, frente: c.frente, verso: c.verso, contexto: questoes.get(c.refId)?.subtopico }))}
      intervalos={(id) => {
        const c = porId.get(id);
        return c ? proximosIntervalos(c.estado, hoje()) : undefined;
      }}
      onAvaliar={(id, a) => avaliarFlashcard(id, a)}
      onFim={(c) => onFim(`${c.facil} fáceis, ${c.bom} bons e ${c.dificil} difíceis (estes voltam amanhã).`)}
    />
  );
}

function SessaoSimulado({ pacote, sessaoId, iniciadaEm, onFim }: { pacote: PacoteRevisao; sessaoId: string; iniciadaEm: number; onFim: (texto: string) => void }) {
  const ids = pacote.questoesDaBateria;
  const naoGraduados = new Set(itensParaRevisar(pacote).map((i) => i.questaoId));
  async function registrar(p: PreparoSimulado, r: RespostaRegistrada) {
    const dia = hoje();
    await registrarTentativa({
      questaoId: p.questao.id,
      materiaSlug: p.questao.materiaSlug,
      pacoteId: pacote.id,
      contexto: "simulado",
      modo: "padrao",
      sessaoId,
      varianteIdx: p.varianteIdx,
      ordem: p.ordem,
      letraCorreta: p.letraCorreta,
      escolhidaId: r.escolhidaId,
      riscadas: r.riscadas,
      confianca: r.confianca,
      acertou: r.acertou,
      resultado: r.resultado,
      tempoMs: r.tempoMs,
      dia,
      respondidaEm: Date.now(),
    });
    if (naoGraduados.has(p.questao.id)) await registrarResultadoRevisao(pacote.id, p.questao.id, r.resultado, dia);
  }
  return (
    <SimuladoRunner
      titulo={`Simulado da bateria · ${getMateria(pacote.materiaSlug as MateriaSlug).nomeCurto}`}
      questaoIds={ids}
      limiteMs={ids.length * MINUTOS_POR_QUESTAO * 60_000}
      iniciadaEm={iniciadaEm}
      seed={sessaoId}
      respondidas={new Set()}
      onRegistrar={registrar}
      onFinalizar={() => onFim(`Simulado de ${ids.length} questões concluído.`)}
    />
  );
}

function ResumoSessao({ pacote, questoes, fase, sessaoId, onVoltar }: { pacote: PacoteRevisao; questoes: Map<string, QuestaoRegistro>; fase: Extract<Fase, { tipo: "resumo" }>; sessaoId: string; onVoltar: () => void }) {
  const tentativas = useLiveQuery(async () => (await db.tentativas.where("pacoteId").equals(pacote.id).toArray()).filter((t: Tentativa) => t.sessaoId === sessaoId), [pacote.id, sessaoId]);
  const etapa = etapaAtual(pacote);
  return (
    <div className="flex flex-col gap-4">
      <Painel titulo="Etapa concluída">
        <p className="text-[13px] text-ink">{fase.texto}</p>
        <p className="mt-2 text-[12.5px] text-ink-2">
          {etapa ? `Próxima etapa: ${etapa.final ? "revisão final (D-3)" : `+${etapa.offsetDias}`} em ${formatarDiaCurto(etapa.dataPrevista)}. ${itensParaRevisar(pacote).length} itens seguem ativos.` : "O pacote terminou: não há mais etapas."}
        </p>
        <div className="mt-3 flex gap-2">
          <Botao variante="primario" onClick={onVoltar}>
            Voltar para Revisão
          </Botao>
        </div>
      </Painel>
      {fase.modo === "simulado" && tentativas && <ResultadoSimulado questaoIds={pacote.questoesDaBateria} tentativas={tentativas} questoes={questoes} />}
    </div>
  );
}

