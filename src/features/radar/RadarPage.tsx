import { Fragment, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown, ChevronRight, Shuffle } from "lucide-react";
import { carregarCasos } from "@/data/banco";
import { DISCURSIVA, MATERIAS, type MateriaSlug } from "@/data/edital";
import { db } from "@/db/db";
import { evolucaoDiaria, gerarBateriaVariantes, mapaDeQuestoes } from "@/db/servicos";
import { diferencaDias, formatarDia, formatarDiaCurto, hoje } from "@/engine/datas";
import { estatisticasPorSubtopico } from "@/engine/debrief";
import { formatarNumero, formatarPercentual, projetarProva, valorMarginal } from "@/engine/pontuacao";
import { calcularRitmo } from "@/engine/ritmo";
import { useUI } from "@/stores/ui";
import { Abas, BarraSegmentada, Botao, Metrica, Painel, Selo, TituloPagina } from "@/components/ui";
import { BarrasDominio, ColunasEvolucao } from "@/components/graficos";
import { contagemDoResumo, respondidasCiclo1, tamanhoCiclo1, taxasLiquidas, totalCiclo1, useDataProva, usePremissas, useResumos } from "../dados";

type Periodo = "14" | "30" | "60";

export default function RadarPage() {
  const navigate = useNavigate();
  const dia = hoje();
  const dataProva = useDataProva();
  const premissas = usePremissas();
  const meta = useUI((s) => s.metaDiaria);
  const resumos = useResumos();
  const [periodo, setPeriodo] = useState<Periodo>("30");
  const [aberta, setAberta] = useState<MateriaSlug>();
  const [gerando, setGerando] = useState<MateriaSlug>();
  const evolucao = useLiveQuery(() => evolucaoDiaria(Number(periodo), dia), [periodo, dia]);
  const discursivas = useLiveQuery(() => db.discursivas.where("status").equals("corrigida").toArray(), []);
  const casos = useLiveQuery(() => carregarCasos(), []);
  const subtopicos = useLiveQuery(async () => {
    const mapa = new Map<MateriaSlug, ReturnType<typeof estatisticasPorSubtopico>>();
    for (const m of MATERIAS) {
      const tentativas = (await db.tentativas.where("materiaSlug").equals(m.slug).sortBy("respondidaEm")).filter((t) => t.contexto !== "revisao");
      mapa.set(m.slug, estatisticasPorSubtopico(await mapaDeQuestoes(tentativas.map((t) => t.questaoId)), tentativas, m.subtopicos));
    }
    return mapa;
  }, []);

  if (!resumos) return null;
  const respondidas = respondidasCiclo1(resumos);
  const totalDoCiclo = totalCiclo1(resumos);
  const ritmo = calcularRitmo(dia, totalDoCiclo - respondidas, dataProva, meta);
  const taxas = taxasLiquidas(resumos);
  const projecao = taxas.size >= 3 ? projetarProva(taxas, premissas) : undefined;
  const marginal = valorMarginal(premissas);
  const notasDisc = (discursivas ?? []).map((d) => d.notaTotal ?? 0);
  const casosFeitos = new Set((discursivas ?? []).map((d) => d.casoId)).size;

  async function variantes(slug: MateriaSlug) {
    setGerando(slug);
    const b = await gerarBateriaVariantes(slug);
    navigate(`/resolver/${b.id}`);
  }

  return (
    <>
      <TituloPagina titulo="Radar do Edital" subtitulo={`Matriz de domínio das 14 disciplinas + Discursiva · prova em ${formatarDia(dataProva)} (faltam ${Math.max(0, diferencaDias(dia, dataProva))} dias)`} />

      <div className="mb-4 grid gap-4 lg:grid-cols-4">
        <Painel className="lg:col-span-1">
          <Metrica rotulo="1º ciclo" valor={`${respondidas}/${totalDoCiclo}`} detalhe={`${MATERIAS.filter((m) => resumos.get(m.slug)?.diaConclusaoCiclo1).length} matérias concluídas`} />
        </Painel>
        <Painel className="lg:col-span-1">
          <Metrica rotulo="Ritmo necessário" valor={`${ritmo.questoesPorDia}/dia`} detalhe={`até ${formatarDiaCurto(ritmo.limiteEscadaCompleta)} (escada completa)`} />
        </Painel>
        <Painel className="lg:col-span-1">
          <Metrica rotulo="Objetiva estimada" valor={projecao ? formatarNumero(projecao.notaObjetiva, 0) : "—"} detalhe={projecao ? `corte 150 · premissas editáveis` : "dados insuficientes"} />
        </Painel>
        <Painel className="lg:col-span-1">
          <Metrica rotulo="Específica × geral" valor={`${formatarNumero(marginal.razao, 2)}×`} detalhe="valor de 1 acerto (escore padronizado)" />
        </Painel>
      </div>

      <Painel titulo="Matriz de domínio" descricao="Clique em uma matéria para ver os subtópicos. Acerto líquido = sólidos ÷ respondidas; retenção = acertos sólidos nas revisões." className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-line text-left text-ink-2">
                <th scope="col" className="py-2 pr-3 font-medium">Matéria</th>
                <th scope="col" className="px-1.5 py-2 text-right font-medium">Na prova</th>
                <th scope="col" className="px-1.5 py-2 font-medium">1º ciclo</th>
                <th scope="col" className="px-1.5 py-2 font-medium">Concluída</th>
                <th scope="col" className="px-1.5 py-2 text-right font-medium">Baterias</th>
                <th scope="col" className="px-1.5 py-2 text-right font-medium">Líquido</th>
                <th scope="col" className="px-1.5 py-2 text-right font-medium">Retenção</th>
                <th scope="col" className="px-1.5 py-2 text-right font-medium">Críticos</th>
                <th scope="col" className="py-2 pl-2 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {MATERIAS.map((m) => {
                const r = resumos.get(m.slug);
                const c = contagemDoResumo(r);
                const stats = subtopicos?.get(m.slug) ?? [];
                const criticos = stats.filter((s) => s.classe === "critico").length;
                const insuficientes = stats.filter((s) => s.classe === "insuficiente").length;
                const liquido = c.total ? c.solidos / c.total : undefined;
                const expandida = aberta === m.slug;
                return (
                  <Fragment key={m.slug}>
                    <tr className="border-b border-line">
                      <td className="py-2 pr-3">
                        <button type="button" onClick={() => setAberta(expandida ? undefined : m.slug)} className="flex items-center gap-1.5 text-left text-ink" aria-expanded={expandida}>
                          {expandida ? <ChevronDown size={13} className="text-ink-3" /> : <ChevronRight size={13} className="text-ink-3" />}
                          {m.nomeCurto}
                        </button>
                      </td>
                      <td className="tabular px-1.5 py-2 text-right text-ink-2">
                        {m.questoesNaProva} × {m.peso}
                      </td>
                      <td className="px-1.5 py-2">
                        <div className="flex items-center gap-2">
                          <BarraSegmentada s={{ ...c, total: tamanhoCiclo1(r) }} className="w-16" altura={5} />
                          <span className="tabular text-ink-2">
                            {r?.respondidasCiclo1 ?? 0}/{tamanhoCiclo1(r)}
                          </span>
                        </div>
                      </td>
                      <td className="tabular px-1.5 py-2 text-ink-2">{r?.diaConclusaoCiclo1 ? formatarDiaCurto(r.diaConclusaoCiclo1) : "—"}</td>
                      <td className="tabular px-1.5 py-2 text-right text-ink-2">{r?.bateriasFechadas ?? 0}</td>
                      <td className="tabular px-1.5 py-2 text-right text-ink">{liquido !== undefined ? formatarPercentual(liquido) : "—"}</td>
                      <td className="tabular px-1.5 py-2 text-right text-ink">{r?.retencao !== undefined ? formatarPercentual(r.retencao) : "—"}</td>
                      <td className="px-1.5 py-2 text-right">{criticos ? <Selo tom="terracota">{criticos}</Selo> : <span className="text-ink-2">{insuficientes === m.subtopicos.length ? "—" : "0"}</span>}</td>
                      <td className="py-2 pl-2 text-right">
                        {r?.diaConclusaoCiclo1 ? (
                          <Botao tamanho="sm" icone={<Shuffle size={13} strokeWidth={1.7} />} disabled={gerando === m.slug} onClick={() => void variantes(m.slug)}>
                            Nova bateria
                          </Botao>
                        ) : (
                          <Link to={`/materias/${m.slug}`} className="text-[12.5px] text-accent-text hover:underline">
                            Estudar
                          </Link>
                        )}
                      </td>
                    </tr>
                    {expandida && (
                      <tr className="border-b border-line">
                        <td colSpan={9} className="bg-surface px-3 py-4">
                          <BarrasDominio dados={stats} titulo={`Subtópicos de ${m.nome}`} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              <tr>
                <td className="py-2 pr-3 pl-5 text-ink">Discursiva</td>
                <td className="tabular px-1.5 py-2 text-right text-ink-2">0–100</td>
                <td className="tabular px-1.5 py-2 text-ink-2">
                  {casosFeitos}/{casos?.length ?? 0} casos
                </td>
                <td className="px-1.5 py-2 text-ink-2">—</td>
                <td className="tabular px-1.5 py-2 text-right text-ink-2">{notasDisc.length}</td>
                <td className="tabular px-1.5 py-2 text-right text-ink">{notasDisc.length ? formatarNumero(notasDisc.reduce((a, b) => a + b, 0) / notasDisc.length, 0) : "—"}</td>
                <td className="tabular px-1.5 py-2 text-right text-ink-2">{notasDisc.length ? `máx. ${formatarNumero(Math.max(...notasDisc), 0)}` : "—"}</td>
                <td className="px-1.5 py-2 text-right">{notasDisc.length && notasDisc.at(-1)! < DISCURSIVA.notaMinima ? <Selo tom="terracota">&lt; 50</Selo> : <span className="text-ink-2">—</span>}</td>
                <td className="py-2 pl-2 text-right">
                  <Link to="/discursiva" className="text-[12.5px] text-accent-text hover:underline">
                    Abrir
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12px] text-ink-2">"Nova bateria" refaz o mesmo pool de 50 questões com novo embaralhamento, enunciados rotacionados, ~30% em Modo Mutação e as de menor domínio primeiro. Questões inéditas entram por lote JSON ou pelo gerador (npm run gerar).</p>
      </Painel>

      <div className="mb-3 flex items-center gap-3">
        <span className="text-[12.5px] text-ink-2">Período dos gráficos</span>
        <Abas rotulo="Período" ativa={periodo} onChange={setPeriodo} abas={[{ id: "14", rotulo: "14 dias" }, { id: "30", rotulo: "30 dias" }, { id: "60", rotulo: "60 dias" }]} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Painel>{evolucao && <ColunasEvolucao pontos={evolucao} tipo="resultados" />}</Painel>
        <Painel>{evolucao && <ColunasEvolucao pontos={evolucao} tipo="foco" />}</Painel>
      </div>
    </>
  );
}
