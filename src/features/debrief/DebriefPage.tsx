import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarPlus, Check, Play, Sparkles } from "lucide-react";
import { getMateria, type MateriaSlug } from "@/data/edital";
import { db, type Tentativa } from "@/db/db";
import { consolidarDebrief, mapaDeQuestoes, progressoBateria, salvarDebrief } from "@/db/servicos";
import { ROTULO_RESULTADO } from "@/engine/classificacao";
import { formatarDia, formatarDiaCurto } from "@/engine/datas";
import { dossieDePegadinhas, estatisticasPorSubtopico, resumoDeOuro } from "@/engine/debrief";
import { contar, formatarNumero, formatarPercentual, percentualBruto, percentualLiquido, projetarMateria } from "@/engine/pontuacao";
import { BarraSegmentada, Botao, LegendaSegmentos, Metrica, Painel, Selo, TituloPagina, Vazio } from "@/components/ui";
import { BarrasDominio } from "@/components/graficos";
import { usePremissas } from "../dados";

const TOM = { ACERTO_SOLIDO: "salvia", ACERTO_FRAGIL: "ambar", ERRO: "terracota", ERRO_CONVICTO: "terracota" } as const;

export function DebriefPage() {
  const { debriefId } = useParams();
  const navigate = useNavigate();
  const premissas = usePremissas();
  const dados = useLiveQuery(async () => {
    if (!debriefId) return null;
    const debrief = await db.debriefs.get(debriefId);
    if (!debrief) return null;
    const doDia = (await db.tentativas.bulkGet(debrief.tentativaIds)).filter((t): t is Tentativa => !!t);
    const historico = (await db.tentativas.where("materiaSlug").equals(debrief.materiaSlug).sortBy("respondidaEm")).filter((t) => t.contexto !== "revisao");
    const questoes = await mapaDeQuestoes([...doDia, ...historico].map((t) => t.questaoId));
    const pacote = debrief.pacoteId ? await db.pacotes.get(debrief.pacoteId) : undefined;
    const progresso = await progressoBateria(debrief.bateriaId);
    return { debrief, doDia, historico, questoes, pacote, progresso };
  }, [debriefId]);

  const [resumo, setResumo] = useState("");
  const [conclusao, setConclusao] = useState("");
  const [consolidando, setConsolidando] = useState(false);
  useEffect(() => {
    if (dados?.debrief) {
      setResumo(dados.debrief.resumoOuro);
      setConclusao(dados.debrief.conclusaoCornell);
    }
    // Só ao trocar de debrief, para não sobrescrever a edição em curso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dados?.debrief.id]);

  const derivados = useMemo(() => {
    if (!dados) return undefined;
    const ultimas = new Map<string, Tentativa>();
    for (const t of dados.doDia) ultimas.set(t.questaoId, t);
    const resultados = [...ultimas.values()].map((t) => t.resultado);
    const contagem = contar(resultados);
    return {
      contagem,
      bruto: percentualBruto(contagem),
      liquido: percentualLiquido(contagem),
      dossie: dossieDePegadinhas(dados.questoes, dados.doDia),
      ouro: resumoDeOuro(dados.questoes, dados.doDia),
      estatisticas: estatisticasPorSubtopico(dados.questoes, dados.historico, getMateria(dados.debrief.materiaSlug).subtopicos),
    };
  }, [dados]);

  if (dados === undefined) return null;
  if (dados === null || !derivados) return <Vazio titulo="Debrief não encontrado" acao={<Botao onClick={() => navigate("/")}>Voltar para Hoje</Botao>} />;

  const { debrief, pacote, progresso } = dados;
  const materia = getMateria(debrief.materiaSlug as MateriaSlug);
  const projecao = projetarMateria(materia.slug, derivados.liquido, premissas);
  const linhasConclusao = conclusao.split("\n").length;
  const restantes = progresso ? progresso.bateria.questaoIds.length - progresso.respondidas.length : 0;
  const salvar = () => salvarDebrief(debrief.id, { resumoOuro: resumo, conclusaoCornell: conclusao });

  async function consolidar() {
    setConsolidando(true);
    await salvar();
    await consolidarDebrief(debrief.id);
    setConsolidando(false);
  }

  return (
    <>
      <TituloPagina
        titulo={`Conclusão diária · ${materia.nome}`}
        subtitulo={`${formatarDia(debrief.dia)} · ${derivados.contagem.total} questões no bloco`}
        acoes={debrief.consolidadoEm ? <Selo tom="salvia"><Check size={12} strokeWidth={2} /> consolidado</Selo> : <Selo tom="ambar">ainda não consolidado</Selo>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Painel titulo="Diagnóstico FCC" className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metrica rotulo="Acerto bruto" valor={formatarPercentual(derivados.bruto)} detalhe="sólidos + frágeis" />
            <Metrica rotulo="Acerto líquido" valor={formatarPercentual(derivados.liquido)} detalhe="só certeza consciente" />
            <Metrica rotulo="Acertos frágeis" valor={derivados.contagem.frageis} detalhe="voltam na revisão" />
            <Metrica rotulo="Erros convictos" valor={derivados.contagem.errosConvictos} detalhe="equívocos conceituais" />
          </div>
          <BarraSegmentada s={derivados.contagem} className="mt-4" altura={8} />
          <LegendaSegmentos s={derivados.contagem} className="mt-2" />
          <p className="mt-4 text-[13px] leading-relaxed text-ink-2">
            Com {formatarPercentual(derivados.liquido)} de acerto líquido, as {projecao.questoesNaProva} questões de {materia.nomeCurto} na prova (peso {materia.peso}) renderiam ≈{" "}
            <strong className="text-ink">{formatarNumero(projecao.acertosEsperados, 1)} acertos</strong> = {formatarNumero(projecao.pontosBrutos, 1)} de {projecao.pontosBrutosMaximos} pontos brutos ponderados. Na nota padronizada, cada acerto aqui vale ≈ {formatarNumero(projecao.valorPorAcerto, 1)} pontos (premissa de σ do grupo, editável).
          </p>
        </Painel>

        <Painel titulo="Próximo passo">
          {debrief.consolidadoEm && pacote ? (
            <>
              <p className="text-[13px] text-ink-2">{pacote.itens.length ? `${pacote.itens.length} questões (erros e acertos frágeis) viraram um pacote de revisão:` : "Tudo sólido hoje. O pacote só oferece o simulado da bateria."}</p>
              <ol className="mt-3 flex flex-col gap-1.5">
                {pacote.etapas.map((e) => (
                  <li key={e.indice} className="flex items-center justify-between text-[13px]">
                    <span className="text-ink">{e.final ? "Revisão final (D-3)" : `+${e.offsetDias} dia${e.offsetDias > 1 ? "s" : ""}`}</span>
                    <span className="tabular text-ink-2">{formatarDiaCurto(e.dataPrevista)}</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <>
              <p className="text-[13px] text-ink-2">Consolidar transforma este bloco em um Pacote de Revisão Inteligente (+1, +3, +7, +15 e +30 dias) com os erros e acertos frágeis do dia, e cria os flashcards deles.</p>
              <Botao variante="primario" className="mt-3 w-full" onClick={() => void consolidar()} disabled={consolidando} icone={<CalendarPlus size={15} strokeWidth={1.7} />}>
                Consolidar dia e gerar ciclo de revisão
              </Botao>
            </>
          )}
          <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3">
            {restantes > 0 && progresso && (
              <Botao onClick={() => navigate(`/resolver/${progresso.bateria.id}`)} icone={<Play size={14} strokeWidth={1.8} />}>
                Próximo bloco ({restantes} restantes)
              </Botao>
            )}
            <Link to="/" className="text-center text-[12.5px] text-ink-2 hover:text-ink">
              Voltar para Hoje
            </Link>
          </div>
        </Painel>

        <Painel className="lg:col-span-3">
          <BarrasDominio dados={derivados.estatisticas} titulo="Subtópicos: dominados × críticos" subtitulo="Acumulado da matéria (última resposta de cada questão). Frágil conta meio ponto; só classifica com n ≥ 3." />
        </Painel>

        <Painel titulo="Dossiê de pegadinhas do dia" descricao="Das questões que você errou ou acertou com dúvida." className="lg:col-span-2">
          {derivados.dossie.length === 0 ? (
            <p className="text-[13px] text-ink-2">Nenhuma pegadinha te pegou hoje.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {derivados.dossie.map((item) => (
                <li key={item.questaoId} className="rounded-lg border border-line bg-elevated px-3.5 py-2.5">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
                    <Selo tom={TOM[item.resultado]}>{ROTULO_RESULTADO[item.resultado]}</Selo>
                    <span>{item.subtopico}</span>
                    <span className="tabular">· {item.questaoId}</span>
                  </div>
                  <p className="text-[13.5px] leading-[1.6] text-ink">{item.pegadinha}</p>
                </li>
              ))}
            </ul>
          )}
        </Painel>

        <Painel titulo="Síntese de fechamento" className="lg:col-span-1">
          <label htmlFor="resumo-ouro" className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink">
            <Sparkles size={13} strokeWidth={1.7} className="text-warning-text" /> Resumo de Ouro do dia
          </label>
          <p className="mt-0.5 text-[12px] text-ink-2">Gerado dos conceitos que mais apareceram nos erros e dúvidas ({derivados.ouro.length}). Edite à vontade.</p>
          <textarea id="resumo-ouro" value={resumo} onChange={(e) => setResumo(e.target.value)} onBlur={() => void salvar()} rows={8} className="field mt-2 font-serif text-[14.5px] leading-[1.6]" />
          <label htmlFor="conclusao-cornell" className="mt-4 block text-[12.5px] font-medium text-ink">
            O que eu não posso esquecer desta matéria até a prova
          </label>
          <p className="mt-0.5 text-[12px] text-ink-2">Três linhas, com as suas palavras (Cornell).</p>
          <textarea id="conclusao-cornell" value={conclusao} onChange={(e) => setConclusao(e.target.value)} onBlur={() => void salvar()} rows={3} className="field mt-2 font-serif text-[14.5px] leading-[1.6]" />
          <p className={linhasConclusao > 3 ? "mt-1 text-[12px] text-warning-text" : "mt-1 text-[12px] text-ink-2"}>
            <span className="tabular">{linhasConclusao}</span>/3 linhas{linhasConclusao > 3 ? ": seja mais conciso" : ""}
          </p>
        </Painel>
      </div>
    </>
  );
}
