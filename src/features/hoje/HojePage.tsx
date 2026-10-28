import { useNavigate, Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, CalendarCheck, GalleryVerticalEnd, Play } from "lucide-react";
import { getMateria, MATERIAS, type MateriaSlug } from "@/data/edital";
import { db } from "@/db/db";
import { flashcardsVencidos, pacotesVencidos } from "@/db/servicos";
import { diaDaSemana, diferencaDias, formatarDia, formatarDiaCurto, hoje } from "@/engine/datas";
import { calcularRitmo } from "@/engine/ritmo";
import { diasDeAtraso, etapaAtual, itensParaRevisar } from "@/engine/srs";
import { formatarNumero, projetarProva, valorMarginal } from "@/engine/pontuacao";
import { useUI } from "@/stores/ui";
import { BarraSegmentada, Botao, Metrica, Painel, Selo, TituloPagina, Vazio } from "@/components/ui";
import { contagemDoResumo, respondidasCiclo1, tamanhoCiclo1, taxasLiquidas, totalCiclo1, useDataProva, usePremissas, useResumos } from "../dados";

const ROTULO_STATUS = { "em-dia": "Ritmo viável", apertado: "Ritmo apertado", inviavel: "Ritmo inviável", concluido: "1º ciclo concluído" } as const;

export function HojePage() {
  const navigate = useNavigate();
  const dia = hoje();
  const dataProva = useDataProva();
  const premissas = usePremissas();
  const meta = useUI((s) => s.metaDiaria);
  const definir = useUI((s) => s.definir);
  const resumos = useResumos();
  const vencidos = useLiveQuery(() => pacotesVencidos(dia), [dia]);
  const cards = useLiveQuery(() => flashcardsVencidos(dia), [dia]);
  const baterias = useLiveQuery(async () => (await db.baterias.toArray()).filter((b) => !b.concluidaEm && (b.tipo === "ciclo" || b.tipo === "variantes")), []);
  const feitasHoje = useLiveQuery(async () => new Set((await db.tentativas.where("dia").equals(dia).toArray()).map((t) => t.questaoId)).size, [dia]) ?? 0;

  const totalDoCiclo = totalCiclo1(resumos);
  const restantes = totalDoCiclo - respondidasCiclo1(resumos);
  const ritmo = calcularRitmo(dia, restantes, dataProva, meta);
  const diasProva = diferencaDias(dia, dataProva);
  const taxas = taxasLiquidas(resumos);
  const projecao = taxas.size >= 3 ? projetarProva(taxas, premissas) : undefined;
  const marginal = valorMarginal(premissas);

  const sugestoes = MATERIAS.map((m) => ({ m, r: resumos?.get(m.slug) }))
    .filter(({ r }) => (r?.respondidasCiclo1 ?? 0) < tamanhoCiclo1(r) && (r?.totalQuestoes ?? 0) > 0)
    .sort((a, b) => b.m.questoesNaProva * b.m.peso - a.m.questoesNaProva * a.m.peso || (a.r?.respondidasCiclo1 ?? 0) - (b.r?.respondidasCiclo1 ?? 0))
    .slice(0, 3);

  return (
    <>
      <TituloPagina
        titulo={`Hoje · ${diaDaSemana(dia)}, ${formatarDiaCurto(dia)}`}
        subtitulo={
          diasProva >= 0 ? (
            <>
              Faltam <strong className="tabular text-ink">{diasProva}</strong> dias para a prova ({formatarDia(dataProva)}, FCC). Meta de hoje: <span className="tabular">{feitasHoje}/{meta}</span> questões.
            </>
          ) : (
            "A data da prova já passou. Ajuste em Configurações."
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Painel titulo="Ritmo até a prova" descricao="Para a etapa +30 da revisão caber antes de D-3." className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metrica rotulo="Restam no 1º ciclo" valor={restantes} detalhe={`de ${totalDoCiclo}`} />
            <Metrica rotulo="Questões por dia" valor={ritmo.questoesPorDia} detalhe={`até ${formatarDiaCurto(ritmo.limiteEscadaCompleta)}`} />
            <Metrica rotulo="Dias até o limite" valor={ritmo.diasAteLimite} detalhe="escada completa" />
            <div>
              <div className="text-[12px] text-ink-2">Situação</div>
              <div className="mt-1.5">
                <Selo tom={ritmo.status === "em-dia" || ritmo.status === "concluido" ? "salvia" : ritmo.status === "apertado" ? "ambar" : "terracota"}>{ROTULO_STATUS[ritmo.status]}</Selo>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] text-ink-2">
            Baterias fechadas depois de {formatarDiaCurto(ritmo.limiteEscadaCompleta)} ganham uma revisão final em D-3 no lugar das etapas que não cabem antes da prova.
          </p>
        </Painel>

        <Painel titulo="Revisões vencidas" acao={<Link to="/revisao" className="text-[12px] text-ink-2 hover:text-ink">Ver todas</Link>}>
          {vencidos === undefined ? null : vencidos.length === 0 ? (
            <p className="text-[13px] text-ink-2">Nada vencido hoje. Cada dia consolidado no Debrief agenda revisões em +1, +3, +7, +15 e +30 dias.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {vencidos.slice(0, 4).map((p) => {
                const etapa = etapaAtual(p);
                const atraso = diasDeAtraso(p, dia);
                return (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] text-ink">{getMateria(p.materiaSlug as MateriaSlug).nomeCurto}</p>
                      <p className="text-[12px] text-ink-2">
                        Etapa +{etapa?.offsetDias} · {itensParaRevisar(p).length} itens{atraso > 0 ? ` · ${atraso}d de atraso` : ""}
                      </p>
                    </div>
                    <Botao tamanho="sm" onClick={() => navigate(`/revisao/${p.id}`)} icone={<CalendarCheck size={14} strokeWidth={1.7} />}>
                      Revisar
                    </Botao>
                  </li>
                );
              })}
            </ul>
          )}
        </Painel>

        <Painel titulo="Continuar de onde parou" className="lg:col-span-2">
          {baterias === undefined ? null : baterias.length === 0 ? (
            <Vazio titulo="Nenhuma bateria em andamento">
              Escolha uma matéria e comece um bloco. Cada resposta é salva na hora, então dá para parar no meio.
            </Vazio>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {baterias.map((b) => {
                const m = getMateria(b.materiaSlug as MateriaSlug);
                const r = resumos?.get(m.slug);
                const c = contagemDoResumo(r);
                return (
                  <li key={b.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <div className="min-w-[180px] flex-1">
                      <p className="text-[13px] text-ink">
                        {m.nome} <span className="text-ink-2">· {b.tipo === "ciclo" ? "1º ciclo" : `bateria de variantes ${b.ciclo}`}</span>
                      </p>
                      <BarraSegmentada s={{ ...c, total: tamanhoCiclo1(r) }} className="mt-1.5 max-w-[360px]" />
                    </div>
                    <Botao
                      variante="primario"
                      tamanho="sm"
                      onClick={() => {
                        definir({ materiaAtiva: m.slug });
                        navigate(`/resolver/${b.id}`);
                      }}
                      icone={<Play size={13} strokeWidth={1.8} />}
                    >
                      Continuar
                    </Botao>
                  </li>
                );
              })}
            </ul>
          )}
        </Painel>

        <Painel titulo="Flashcards">
          <p className="text-[13px] text-ink-2">
            <span className="dado text-[22px] font-medium text-ink">{cards?.length ?? 0}</span> para hoje
          </p>
          <Botao className="mt-3" onClick={() => navigate("/flashcards")} icone={<GalleryVerticalEnd size={14} strokeWidth={1.7} />} disabled={!cards?.length}>
            Revisar cartões
          </Botao>
        </Painel>

        <Painel titulo="Sugestão de estudo" descricao="Matérias com mais peso real na prova e menos questões feitas." className="lg:col-span-2">
          {sugestoes.length === 0 ? (
            <p className="text-[13px] text-ink-2">Todas as matérias com questões no banco já têm o 1º ciclo concluído ou em andamento. Gere baterias de variantes no Radar do Edital.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-3">
              {sugestoes.map(({ m, r }) => (
                <li key={m.slug}>
                  <Link to={`/materias/${m.slug}`} onClick={() => definir({ materiaAtiva: m.slug })} className="quiet-transition block h-full rounded-lg border border-line bg-elevated p-3 hover:border-line-control">
                    <p className="text-[13px] font-medium text-ink">{m.nomeCurto}</p>
                    <p className="mt-0.5 text-[12px] text-ink-2">
                      {m.questoesNaProva} questões × peso {m.peso} · <span className="tabular">{r?.respondidasCiclo1 ?? 0}/{tamanhoCiclo1(r)}</span> feitas
                    </p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[12px] text-accent-text">
                      Estudar <ArrowRight size={12} strokeWidth={1.8} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Painel>

        <Painel titulo="Projeção da objetiva" descricao="Estimativa: média e desvio do grupo são premissas (Configurações).">
          {projecao ? (
            <>
              <Metrica rotulo="Nota padronizada estimada" valor={formatarNumero(projecao.notaObjetiva, 0)} detalhe={projecao.habilitado ? "acima do corte de 150" : "abaixo do corte de 150"} />
              <p className="mt-2 text-[12px] text-ink-2">
                1 acerto em Específicos ≈ {formatarNumero(marginal.razao, 2)}× um acerto em Gerais nestas premissas, e não 2×.
                {projecao.materiasSemDados.length ? ` ${projecao.materiasSemDados.length} matérias sem dados usam a sua média.` : ""}
              </p>
            </>
          ) : (
            <p className="text-[13px] text-ink-2">Responda pelo menos 5 questões em 3 matérias para estimar a nota padronizada (NP) da prova objetiva.</p>
          )}
        </Painel>
      </div>
    </>
  );
}
