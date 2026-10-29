import { useState, type ReactNode } from "react";
import { Table2, BarChart3 } from "lucide-react";
import { formatarDiaCurto, type Dia } from "@/engine/datas";
import { LIMIAR_CRITICO, LIMIAR_DOMINADO, type EstatisticaSubtopico } from "@/engine/debrief";
import type { PontoEvolucao } from "@/db/servicos";
import { cx } from "./ui";

/**
 * Gráficos em HTML/CSS (sem biblioteca), seguindo a skill de dataviz:
 * marcas finas (≤ 16px), ponta de dado arredondada em 4px e base reta,
 * 2px de respiro entre segmentos, grade em linha fina sólida, legenda
 * sempre presente para 2+ séries, tooltip por marca (hover e foco) e
 * visão em tabela equivalente.
 */

function AlternarTabela({ tabela, onChange }: { tabela: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!tabela)} className="quiet-transition inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[12px] text-ink-2 hover:bg-surface hover:text-ink" aria-pressed={tabela}>
      {tabela ? <BarChart3 size={13} strokeWidth={1.7} /> : <Table2 size={13} strokeWidth={1.7} />}
      {tabela ? "Ver gráfico" : "Ver tabela"}
    </button>
  );
}

export function CabecalhoGrafico({ titulo, subtitulo, tabela, onTabela, legenda }: { titulo: string; subtitulo?: string; tabela: boolean; onTabela: (v: boolean) => void; legenda?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 className="text-[13px] font-semibold text-ink">{titulo}</h3>
        {subtitulo && <p className="text-[12px] text-ink-2">{subtitulo}</p>}
      </div>
      <div className="flex items-center gap-3">
        {legenda}
        <AlternarTabela tabela={tabela} onChange={onTabela} />
      </div>
    </div>
  );
}

export function Legenda({ itens }: { itens: { cor: string; rotulo: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-3 text-[12px] text-ink-2" aria-label="Legenda">
      {itens.map((i) => (
        <li key={i.rotulo} className="flex items-center gap-1.5">
          <span aria-hidden className={cx("inline-block h-2.5 w-2.5 rounded-[2px]", i.cor)} />
          {i.rotulo}
        </li>
      ))}
    </ul>
  );
}

// ------------------------------------------------------------------ domínio por subtópico

const ROTULO_CLASSE = { dominado: "Dominado", intermediario: "Em consolidação", critico: "Crítico", insuficiente: "Amostra insuficiente" } as const;
const COR_CLASSE = { dominado: "bg-chart-solido", intermediario: "bg-chart-fragil", critico: "bg-chart-erro", insuficiente: "bg-chart-neutro" } as const;

export function BarrasDominio({ dados, titulo = "Domínio por subtópico", subtitulo }: { dados: readonly EstatisticaSubtopico[]; titulo?: string; subtitulo?: string }) {
  const [tabela, setTabela] = useState(false);
  const ordenados = [...dados].sort((a, b) => (a.classe === "insuficiente" ? 1 : 0) - (b.classe === "insuficiente" ? 1 : 0) || a.dominio - b.dominio);
  return (
    <figure>
      <CabecalhoGrafico
        titulo={titulo}
        subtitulo={subtitulo ?? `Frágil conta meio ponto. Classifica com n ≥ 3: dominado > ${LIMIAR_DOMINADO * 100}%, crítico < ${LIMIAR_CRITICO * 100}%.`}
        tabela={tabela}
        onTabela={setTabela}
        legenda={<Legenda itens={[{ cor: "bg-chart-solido", rotulo: "Dominado" }, { cor: "bg-chart-fragil", rotulo: "Em consolidação" }, { cor: "bg-chart-erro", rotulo: "Crítico" }]} />}
      />
      {tabela ? (
        <TabelaSimples
          cabecalho={["Subtópico", "Domínio", "n", "Situação"]}
          linhas={ordenados.map((d) => [d.subtopico, d.n ? `${Math.round(d.dominio * 100)}%` : "—", String(d.n), ROTULO_CLASSE[d.classe]])}
        />
      ) : (
        <div className="relative">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(120px,1.1fr)_auto] items-center gap-x-3 gap-y-2">
            <span />
            <div className="relative h-4 text-[10.5px] text-ink-2" aria-hidden>
              <span className="tabular absolute -translate-x-full pr-1" style={{ left: `${LIMIAR_CRITICO * 100}%` }}>
                70%
              </span>
              <span className="tabular absolute pl-1" style={{ left: `${LIMIAR_DOMINADO * 100}%` }}>
                85%
              </span>
            </div>
            <span />
            {ordenados.map((d) => (
              <LinhaDominio key={d.subtopico} d={d} />
            ))}
          </div>
        </div>
      )}
    </figure>
  );
}

function LinhaDominio({ d }: { d: EstatisticaSubtopico }) {
  const pct = Math.round(d.dominio * 100);
  return (
    <>
      <span className="truncate text-[12.5px] text-ink" title={d.subtopico}>
        {d.subtopico}
      </span>
      <div className="relative h-[10px]" role="img" aria-label={`${d.subtopico}: ${d.n ? `${pct}% de domínio em ${d.n} questões` : "sem questões respondidas"}; ${ROTULO_CLASSE[d.classe]}`}>
        <div className="absolute inset-y-0 left-0 w-full rounded-r-[4px] bg-line" />
        {d.n > 0 && <div className={cx("absolute inset-y-0 left-0 rounded-r-[4px]", COR_CLASSE[d.classe])} style={{ width: `${Math.max(2, pct)}%` }} />}
        <div aria-hidden className="absolute -inset-y-1 w-px bg-line-control" style={{ left: `${LIMIAR_CRITICO * 100}%` }} />
        <div aria-hidden className="absolute -inset-y-1 w-px bg-line-control" style={{ left: `${LIMIAR_DOMINADO * 100}%` }} />
      </div>
      <span className="tabular text-right text-[12px] text-ink-2 whitespace-nowrap">{d.n ? `${pct}% · n=${d.n}` : "n=0"}</span>
    </>
  );
}

// ------------------------------------------------------------------ colunas por dia

interface SerieColuna {
  chave: string;
  rotulo: string;
  cor: string;
  valor: (p: PontoEvolucao) => number;
}

const SERIES_RESULTADO: SerieColuna[] = [
  { chave: "solidos", rotulo: "Sólidos", cor: "bg-chart-solido", valor: (p) => p.solidos },
  { chave: "frageis", rotulo: "Frágeis", cor: "bg-chart-fragil", valor: (p) => p.frageis },
  { chave: "erros", rotulo: "Erros", cor: "bg-chart-erro", valor: (p) => p.erros + p.errosConvictos },
];

const SERIE_FOCO: SerieColuna[] = [{ chave: "foco", rotulo: "Minutos de foco", cor: "bg-chart-foco", valor: (p) => p.minutosFoco }];

function escalaLimpa(max: number): number[] {
  if (max <= 0) return [0, 1];
  const bruto = max / 3;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const passo = [1, 2, 5, 10].map((m) => m * potencia).find((p) => p >= bruto) ?? bruto;
  const topo = Math.ceil(max / passo) * passo;
  const ticks: number[] = [];
  for (let v = 0; v <= topo + 1e-9; v += passo) ticks.push(Math.round(v));
  return ticks;
}

export function ColunasEvolucao({ pontos, tipo }: { pontos: readonly PontoEvolucao[]; tipo: "resultados" | "foco" }) {
  const [tabela, setTabela] = useState(false);
  const [ativo, setAtivo] = useState<number>();
  const series = tipo === "resultados" ? SERIES_RESULTADO : SERIE_FOCO;
  const totais = pontos.map((p) => series.reduce((s, serie) => s + serie.valor(p), 0));
  const ticks = escalaLimpa(Math.max(...totais, 0));
  const topo = ticks.at(-1) ?? 1;
  const ALTURA = 132;
  const titulo = tipo === "resultados" ? "Questões por dia" : "Minutos de foco por dia";
  const subtitulo = `Últimos ${pontos.length} dias${tipo === "resultados" ? " · inclui estudo, revisões e simulados" : " · sessões de foco ≥ 1 min do timer"}`;
  const vazio = totais.every((t) => t === 0);

  return (
    <figure>
      <CabecalhoGrafico titulo={titulo} subtitulo={subtitulo} tabela={tabela} onTabela={setTabela} legenda={series.length > 1 ? <Legenda itens={series.map((s) => ({ cor: s.cor, rotulo: s.rotulo }))} /> : undefined} />
      {tabela ? (
        <TabelaSimples
          cabecalho={["Dia", ...series.map((s) => s.rotulo), ...(tipo === "resultados" ? ["Erros convictos"] : [])]}
          linhas={pontos.map((p) => [formatarDiaCurto(p.dia), ...series.map((s) => String(s.valor(p))), ...(tipo === "resultados" ? [String(p.errosConvictos)] : [])])}
        />
      ) : vazio ? (
        <p className="rounded-lg border border-dashed border-line-control px-4 py-6 text-center text-[12.5px] text-ink-2">
          {tipo === "resultados" ? "Nenhuma questão respondida neste período ainda." : "Nenhuma sessão de foco registrada. O timer da barra superior grava cada sessão concluída."}
        </p>
      ) : (
        <div className="relative pl-8">
          <div className="relative" style={{ height: ALTURA }}>
            {ticks.map((t) => (
              <div key={t} className="absolute right-0 left-0 flex items-center" style={{ bottom: (t / topo) * ALTURA }} aria-hidden>
                <span className="tabular absolute -left-8 w-6 -translate-y-1/2 text-right text-[10.5px] text-ink-2">{t}</span>
                <div className="h-px w-full bg-chart-grade" />
              </div>
            ))}
            <div className="absolute inset-0 flex items-end">
              {pontos.map((p, i) => {
                const valores = series.map((s) => ({ s, v: s.valor(p) })).filter((x) => x.v > 0);
                const resumo = `${formatarDiaCurto(p.dia)}: ${series.map((s) => `${s.rotulo} ${s.valor(p)}`).join(", ")}${tipo === "resultados" && p.errosConvictos ? ` (${p.errosConvictos} convictos)` : ""}`;
                return (
                  <button
                    key={p.dia}
                    type="button"
                    aria-label={resumo}
                    onPointerEnter={() => setAtivo(i)}
                    onPointerLeave={() => setAtivo(undefined)}
                    onFocus={() => setAtivo(i)}
                    onBlur={() => setAtivo(undefined)}
                    className="group relative flex h-full min-w-0 flex-1 flex-col-reverse items-center gap-[2px] px-[1px]"
                  >
                    {valores.map(({ s, v }, k) => (
                      <span
                        key={s.chave}
                        className={cx("block w-full max-w-[16px] quiet-transition", s.cor, k === valores.length - 1 && "rounded-t-[4px]", ativo !== undefined && ativo !== i && "opacity-55")}
                        style={{ height: Math.max(2, (v / topo) * ALTURA - 2) }}
                      />
                    ))}
                  </button>
                );
              })}
            </div>
            {ativo !== undefined && pontos[ativo] && <Tooltip ponto={pontos[ativo]} series={series} tipo={tipo} posicao={(ativo + 0.5) / pontos.length} />}
          </div>
          <EixoDias pontos={pontos} />
        </div>
      )}
    </figure>
  );
}

function Tooltip({ ponto, series, tipo, posicao }: { ponto: PontoEvolucao; series: SerieColuna[]; tipo: "resultados" | "foco"; posicao: number }) {
  const direita = posicao > 0.6;
  return (
    <div className="pointer-events-none absolute top-0 z-10 min-w-[150px] rounded-lg border border-line bg-elevated px-3 py-2 shadow-float" style={direita ? { right: `${(1 - posicao) * 100 + 2}%` } : { left: `${posicao * 100 + 2}%` }} role="status">
      <p className="mb-1 text-[11.5px] text-ink-2">{formatarDiaCurto(ponto.dia)}</p>
      {series.map((s) => (
        <p key={s.chave} className="flex items-center justify-between gap-4 text-[12px]">
          <span className="flex items-center gap-1.5 text-ink-2">
            <span aria-hidden className={cx("inline-block h-[2px] w-3", s.cor)} />
            {s.rotulo}
          </span>
          <strong className="tabular font-semibold text-ink">{s.valor(ponto)}</strong>
        </p>
      ))}
      {tipo === "resultados" && ponto.errosConvictos > 0 && <p className="mt-1 text-[11.5px] text-ink-2">dos erros, {ponto.errosConvictos} convicto(s)</p>}
    </div>
  );
}

function EixoDias({ pontos }: { pontos: readonly PontoEvolucao[] }) {
  return (
    <div className="mt-1.5 flex" aria-hidden>
      {pontos.map((p, i) => (
        <span key={p.dia} className="tabular min-w-0 flex-1 text-center text-[10.5px] text-ink-2">
          {i % 5 === 0 || i === pontos.length - 1 ? formatarDiaCurto(p.dia as Dia).split(" ")[0] : ""}
        </span>
      ))}
    </div>
  );
}

export function TabelaSimples({ cabecalho, linhas }: { cabecalho: string[]; linhas: string[][] }) {
  return (
    <div className="max-h-[320px] overflow-auto rounded-lg border border-line">
      <table className="w-full border-collapse text-[12.5px]">
        <thead className="sticky top-0 bg-surface">
          <tr>
            {cabecalho.map((c, i) => (
              <th key={c} scope="col" className={cx("border-b border-line px-3 py-1.5 font-medium text-ink-2", i === 0 ? "text-left" : "text-right")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {l.map((c, j) => (
                <td key={j} className={cx("px-3 py-1.5", j === 0 ? "text-left text-ink" : "tabular text-right text-ink-2")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
