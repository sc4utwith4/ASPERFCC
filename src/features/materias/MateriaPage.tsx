import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { Layers, NotebookPen, Play, Shuffle } from "lucide-react";
import { getMateria, isMateriaSlug, PROVA, type MateriaSlug } from "@/data/edital";
import { db } from "@/db/db";
import { bateriaAtiva, bateriasDaMateria, gerarBateriaVariantes, iniciarBateria, mapaDeQuestoes, progressoBateria } from "@/db/servicos";
import { contar } from "@/engine/pontuacao";
import { estatisticasPorSubtopico } from "@/engine/debrief";
import { formatarDiaCurto } from "@/engine/datas";
import { formatarNumero, projetarMateria } from "@/engine/pontuacao";
import { useUI } from "@/stores/ui";
import { BarraSegmentada, Botao, LegendaSegmentos, Painel, Selo, TituloPagina, Vazio, cx } from "@/components/ui";
import { BarrasDominio } from "@/components/graficos";
import { usePremissas } from "../dados";

const BLOCOS = [10, 15, 25, 50] as const;

export function MateriaPage() {
  const { slug } = useParams();
  if (!slug || !isMateriaSlug(slug)) return <Vazio titulo="Matéria não encontrada" />;
  return <Conteudo slug={slug} />;
}

function Conteudo({ slug }: { slug: MateriaSlug }) {
  const materia = getMateria(slug);
  const navigate = useNavigate();
  const ui = useUI();
  const premissas = usePremissas();
  const [bloco, setBloco] = useState<number>(ui.tamanhoBloco);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string>();

  useEffect(() => {
    if (ui.materiaAtiva !== slug) ui.definir({ materiaAtiva: slug });
  }, [slug, ui]);

  const dados = useLiveQuery(async () => {
    const [ativa, baterias, totalBanco, tentativas, debriefs] = await Promise.all([
      bateriaAtiva(slug),
      bateriasDaMateria(slug),
      db.questoes.where("materiaSlug").equals(slug).count(),
      db.tentativas.where("materiaSlug").equals(slug).sortBy("respondidaEm"),
      db.debriefs.where("materiaSlug").equals(slug).reverse().sortBy("criadoEm"),
    ]);
    const progresso = ativa ? await progressoBateria(ativa.id) : undefined;
    const naoRevisao = tentativas.filter((t) => t.contexto !== "revisao");
    const questoes = await mapaDeQuestoes(naoRevisao.map((t) => t.questaoId));
    return { ativa, baterias, totalBanco, progresso, naoRevisao, questoes, debriefs };
  }, [slug]);

  if (!dados) return null;
  const { ativa, baterias, totalBanco, progresso, naoRevisao, questoes, debriefs } = dados;
  const ultimas = new Map(naoRevisao.map((t) => [t.questaoId, t.resultado]));
  const contagemAtiva = contar([...(progresso?.ultimaPorQuestao.values() ?? [])].map((t) => t.resultado));
  const contagemGeral = contar([...ultimas.values()]);
  const estatisticas = estatisticasPorSubtopico(questoes, naoRevisao, materia.subtopicos);
  const taxa = contagemGeral.total ? contagemGeral.solidos / contagemGeral.total : 0;
  const projecao = projetarMateria(slug, taxa, premissas);
  const ciclo1Concluido = baterias.some((b) => b.ciclo === 1 && b.concluidaEm);
  const restantes = progresso ? progresso.bateria.questaoIds.length - progresso.respondidas.length : 0;

  async function comecar() {
    setOcupado(true);
    setErro(undefined);
    try {
      ui.definir({ tamanhoBloco: bloco });
      const b = await iniciarBateria(slug, bloco);
      navigate(`/resolver/${b.id}`);
    } catch (e) {
      setErro((e as Error).message);
      setOcupado(false);
    }
  }

  async function novaVariante() {
    setOcupado(true);
    const b = await gerarBateriaVariantes(slug, bloco);
    navigate(`/resolver/${b.id}`);
  }

  return (
    <>
      <TituloPagina
        titulo={materia.nome}
        subtitulo={
          <>
            {materia.bloco === "gerais" ? "Conhecimentos Gerais" : "Conhecimentos Específicos"} · {materia.questoesNaProva} questões na prova · peso {materia.peso} · 1 acerto ≈ {formatarNumero(projecao.valorPorAcerto, 1)} pts na nota padronizada (premissa)
          </>
        }
        acoes={
          <>
            <Botao variante="fantasma" icone={<NotebookPen size={14} strokeWidth={1.7} />} onClick={() => navigate(`/notas?materia=${slug}`)}>
              Notas
            </Botao>
            <Botao variante="fantasma" icone={<Layers size={14} strokeWidth={1.7} />} onClick={() => navigate(`/flashcards?materia=${slug}`)}>
              Flashcards
            </Botao>
          </>
        }
      />

      {totalBanco === 0 ? (
        <Vazio titulo="Ainda não há questões desta matéria no banco">
          Os lotes ficam em <code className="font-mono text-[12px]">src/data/questions/{slug}/</code>. Você também pode importar um lote JSON em Banco e backup.
        </Vazio>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Painel titulo={ativa ? (ativa.tipo === "ciclo" ? "1º ciclo em andamento" : `Bateria de variantes ${ativa.ciclo} em andamento`) : ciclo1Concluido ? "1º ciclo concluído" : "Comece o 1º ciclo"} descricao={ativa ? `${restantes} questões restantes de ${ativa.questaoIds.length}` : `${totalBanco} questões no banco`}>
            {progresso && (
              <>
                <BarraSegmentada s={{ ...contagemAtiva, total: progresso.bateria.questaoIds.length }} altura={8} />
                <LegendaSegmentos s={{ ...contagemAtiva, total: progresso.bateria.questaoIds.length }} className="mt-2" />
              </>
            )}
            <fieldset className="mt-4">
              <legend className="mb-1.5 text-[12px] text-ink-2">Tamanho do bloco de hoje</legend>
              <div className="flex flex-wrap gap-1.5" role="radiogroup">
                {BLOCOS.map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={bloco === n} onClick={() => setBloco(n)} className={cx("quiet-transition h-8 rounded-lg border px-3 text-[12.5px]", bloco === n ? "border-accent bg-accent-soft text-accent-text" : "border-line bg-elevated text-ink-2 hover:text-ink")}>
                    {n === 50 ? "50 · Maratona" : `${n} questões`}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Botao variante="primario" onClick={() => void comecar()} disabled={ocupado} icone={<Play size={14} strokeWidth={1.8} />}>
                {ativa ? "Continuar bloco" : ciclo1Concluido ? "Começar bateria de variantes" : "Começar bloco"}
              </Botao>
              {ciclo1Concluido && !ativa && (
                <Botao onClick={() => void novaVariante()} disabled={ocupado} icone={<Shuffle size={14} strokeWidth={1.7} />}>
                  Nova bateria de variantes
                </Botao>
              )}
              <span className="text-[12px] text-ink-2">Cada resposta é salva na hora.</span>
            </div>
            {erro && <p className="mt-2 text-[12.5px] text-danger-text">{erro}</p>}
          </Painel>

          <Painel titulo="Desempenho acumulado" descricao="Última resposta de cada questão, fora das revisões.">
            <LegendaSegmentos s={{ ...contagemGeral, total: Math.max(contagemGeral.total, PROVA.questoesPorBateria) }} />
            <p className="mt-3 text-[12.5px] text-ink-2">
              Mantendo {Math.round(taxa * 100)}% de acertos sólidos, na prova seriam ≈ {formatarNumero(projecao.acertosEsperados, 1)} de {projecao.questoesNaProva} questões ({formatarNumero(projecao.pontosBrutos, 1)} de {projecao.pontosBrutosMaximos} pontos brutos ponderados).
            </p>
          </Painel>

          <Painel className="lg:col-span-2">
            <BarrasDominio dados={estatisticas} />
          </Painel>

          <Painel titulo="Histórico" className="lg:col-span-2">
            {debriefs.length === 0 && baterias.length === 0 ? (
              <p className="text-[13px] text-ink-2">Os Debriefs de cada dia aparecem aqui.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {debriefs.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <span className="text-[13px] text-ink">
                      Debrief de {formatarDiaCurto(d.dia)} <span className="text-ink-2">· {d.tentativaIds.length} questões</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {d.consolidadoEm ? <Selo tom="salvia">consolidado</Selo> : <Selo tom="ambar">não consolidado</Selo>}
                      <Link to={`/debrief/${d.id}`} className="text-[12.5px] text-accent-text hover:underline">
                        Abrir
                      </Link>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Painel>
        </div>
      )}
    </>
  );
}
