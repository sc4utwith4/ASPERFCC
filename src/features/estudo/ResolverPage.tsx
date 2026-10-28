import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Flag } from "lucide-react";
import { getMateria, type MateriaSlug } from "@/data/edital";
import { db, type Bateria, type QuestaoRegistro } from "@/db/db";
import { exposicoesAnteriores, gerarDebrief, progressoBateria, registrarTentativa, ultimaLetraCorreta } from "@/db/servicos";
import { letraDaCorreta, permutarAlternativas, type Letra } from "@/engine/alternativas";
import { hoje, formatarDuracao } from "@/engine/datas";
import { escolherSubModo, type SubModoMutacao } from "@/engine/mutacao";
import { novoId } from "@/engine/rng";
import { escolherEnunciado } from "@/engine/variantes";
import type { AlternativaId } from "@/data/schema";
import { Botao, BarraSegmentada, Selo, Vazio } from "@/components/ui";
import { useAgora } from "@/features/workspace/Timer";
import { Resolvedor, type RespostaRegistrada } from "@/features/questao/Resolvedor";
import { SeloFonteOficial } from "@/features/questao/QuestaoView";

interface Preparo {
  questao: QuestaoRegistro;
  ordem: AlternativaId[];
  varianteIdx: number;
  letraCorreta: Letra;
  modo: "padrao" | SubModoMutacao;
}

export function ResolverPage() {
  const { bateriaId } = useParams();
  const navigate = useNavigate();
  const [sessaoId] = useState(() => novoId("sessao"));
  const [bateria, setBateria] = useState<Bateria>();
  const [fila, setFila] = useState<string[]>([]);
  const [indice, setIndice] = useState(0);
  const [preparo, setPreparo] = useState<Preparo>();
  const [resultados, setResultados] = useState<RespostaRegistrada[]>([]);
  const [respondidasAntes, setRespondidasAntes] = useState(0);
  const [carregado, setCarregado] = useState(false);

  // Monta o bloco: as próximas N questões não respondidas da bateria.
  useEffect(() => {
    if (!bateriaId) return;
    void (async () => {
      const p = await progressoBateria(bateriaId);
      if (!p) {
        setCarregado(true);
        return;
      }
      const pendentes = p.bateria.questaoIds.filter((id) => !p.ultimaPorQuestao.has(id));
      setBateria(p.bateria);
      setFila(pendentes.slice(0, p.bateria.tamanhoBloco));
      setRespondidasAntes(p.respondidas.length);
      setCarregado(true);
    })();
  }, [bateriaId]);

  const atualId = fila[indice];

  useEffect(() => {
    if (!atualId || !bateria) return;
    let ativo = true;
    void (async () => {
      const [questao, exposicoes, ultimaLetra] = await Promise.all([db.questoes.get(atualId), exposicoesAnteriores(atualId), ultimaLetraCorreta(atualId)]);
      if (!questao || !ativo) return;
      const ordem = permutarAlternativas(questao, sessaoId, ultimaLetra);
      const { varianteIdx } = escolherEnunciado(questao, exposicoes);
      const modo = bateria.mutacao.includes(questao.id) ? escolherSubModo(questao, sessaoId) : "padrao";
      setPreparo({ questao, ordem, varianteIdx, letraCorreta: letraDaCorreta(questao, ordem), modo });
    })();
    return () => {
      ativo = false;
    };
  }, [atualId, bateria, sessaoId]);

  const irParaDebrief = useCallback(async () => {
    if (!bateriaId) return;
    const d = await gerarDebrief(bateriaId, hoje());
    navigate(`/debrief/${d.id}`, { replace: true });
  }, [bateriaId, navigate]);

  async function registrar(r: RespostaRegistrada) {
    if (!preparo || !bateria) return;
    await registrarTentativa({
      questaoId: preparo.questao.id,
      materiaSlug: preparo.questao.materiaSlug,
      bateriaId: bateria.id,
      contexto: bateria.tipo === "variantes" ? "variantes" : "estudo",
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
      dia: hoje(),
      respondidaEm: Date.now(),
      justificativa: r.justificativa,
    });
    setResultados((rs) => [...rs, r]);
  }

  function proxima() {
    if (indice + 1 >= fila.length) {
      void irParaDebrief();
      return;
    }
    setPreparo(undefined);
    setIndice((i) => i + 1);
  }

  const contagem = useMemo(() => {
    const c = { solidos: 0, frageis: 0, erros: 0, errosConvictos: 0 };
    for (const r of resultados) {
      if (r.resultado === "ACERTO_SOLIDO") c.solidos++;
      else if (r.resultado === "ACERTO_FRAGIL") c.frageis++;
      else if (r.resultado === "ERRO_CONVICTO") c.errosConvictos++;
      else c.erros++;
    }
    return c;
  }, [resultados]);

  if (!carregado) return null;
  if (!bateria || bateria.materiaSlug === "prova-real") return <Vazio titulo="Bateria não encontrada" acao={<Botao onClick={() => navigate("/materias")}>Ir para Matérias</Botao>} />;
  const materia = getMateria(bateria.materiaSlug as MateriaSlug);
  if (fila.length === 0) {
    return (
      <Vazio titulo="Esta bateria já foi toda respondida" acao={<Botao variante="primario" onClick={() => void irParaDebrief()}>Abrir o Debrief de hoje</Botao>}>
        Gere uma nova bateria de variantes na página da matéria ou no Radar do Edital.
      </Vazio>
    );
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <header className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={() => navigate(`/materias/${materia.slug}`)} className="quiet-transition inline-flex items-center gap-1 text-[12.5px] text-ink-2 hover:text-ink">
            <ArrowLeft size={14} strokeWidth={1.7} /> {materia.nome}
          </button>
          <div className="flex items-center gap-3">
            <span className="tabular text-[12.5px] text-ink-2">
              Questão {Math.min(indice + 1, fila.length)} de {fila.length} no bloco · {respondidasAntes + resultados.length}/{bateria.questaoIds.length} na bateria
            </span>
            {resultados.length > 0 && (
              <Botao variante="fantasma" tamanho="sm" icone={<Flag size={13} strokeWidth={1.7} />} onClick={() => void irParaDebrief()}>
                Encerrar bloco
              </Botao>
            )}
          </div>
        </div>
        <BarraSegmentada s={{ ...contagem, total: fila.length }} className="mt-2" altura={4} />
      </header>
      {preparo ? (
        <Resolvedor
          key={`${preparo.questao.id}-${indice}`}
          questao={preparo.questao}
          ordem={preparo.ordem}
          varianteIdx={preparo.varianteIdx}
          letraCorreta={preparo.letraCorreta}
          modo={preparo.modo}
          seed={sessaoId}
          onRegistrar={registrar}
          onProxima={proxima}
          rotuloProxima={indice + 1 >= fila.length ? "Ver Debrief do dia" : "Próxima"}
          cabecalho={<CabecalhoQuestao preparo={preparo} />}
        />
      ) : (
        <p className="text-[13px] text-ink-2" role="status">
          Carregando questão…
        </p>
      )}
    </div>
  );
}

function CabecalhoQuestao({ preparo }: { preparo: Preparo }) {
  const [inicio] = useState(() => Date.now());
  const agora = useAgora(1000);
  const q = preparo.questao;
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
      <span className="font-medium text-ink">{q.subtopico}</span>
      <span>·</span>
      <span>{q.nivel}</span>
      {preparo.varianteIdx >= 0 && <Selo tom="neutro">contexto {preparo.varianteIdx + 2}</Selo>}
      {q.procedencia === "gerador-ia" && <Selo tom="ambar">gerada por IA, não revisada</Selo>}
      <SeloFonteOficial questao={q} />
      <span className="dado ml-auto" aria-label="Tempo nesta questão">
        {formatarDuracao(agora - inicio)}
      </span>
    </div>
  );
}
