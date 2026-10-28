import { Link, useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { CalendarCheck } from "lucide-react";
import { getMateria, type MateriaSlug } from "@/data/edital";
import { db } from "@/db/db";
import { diaDaSemana, diferencaDias, formatarDiaCurto, hoje, somarDias } from "@/engine/datas";
import { diasDeAtraso, etapaAtual, itensParaRevisar, pacoteConcluido, pacoteVencido, type PacoteRevisao } from "@/engine/srs";
import { Botao, Painel, Selo, TituloPagina, Vazio } from "@/components/ui";

export default function RevisaoPage() {
  const navigate = useNavigate();
  const dia = hoje();
  const pacotes = useLiveQuery(() => db.pacotes.orderBy("criadoEm").reverse().toArray(), []);
  if (!pacotes) return null;
  const vencidos = pacotes.filter((p) => pacoteVencido(p, dia));
  const proximos = pacotes.filter((p) => !pacoteVencido(p, dia) && !pacoteConcluido(p));
  const concluidos = pacotes.filter((p) => pacoteConcluido(p));
  const agenda = Array.from({ length: 14 }, (_, i) => {
    const d = somarDias(dia, i + 1);
    return { dia: d, pacotes: proximos.filter((p) => etapaAtual(p)?.dataPrevista === d) };
  });

  return (
    <>
      <TituloPagina titulo="Revisão espaçada" subtitulo="Pacotes gerados ao consolidar cada dia. Itens graduam com 2 acertos sólidos seguidos; reincidentes viram críticos." />
      {pacotes.length === 0 ? (
        <Vazio titulo="Nenhum pacote de revisão ainda" acao={<Botao variante="primario" onClick={() => navigate("/materias")}>Estudar uma matéria</Botao>}>
          Termine um bloco de questões e clique em "Consolidar dia" no Debrief. Os erros e acertos frágeis do dia voltam em +1, +3, +7, +15 e +30 dias.
        </Vazio>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Painel titulo={`Para hoje (${vencidos.length})`} className="lg:col-span-2">
            {vencidos.length === 0 ? (
              <p className="text-[13px] text-ink-2">Em dia. Nenhum pacote vencido.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {vencidos.map((p) => (
                  <LinhaPacote key={p.id} p={p} dia={dia} acao={<Botao variante="primario" tamanho="sm" icone={<CalendarCheck size={14} strokeWidth={1.7} />} onClick={() => navigate(`/revisao/${p.id}`)}>Revisar</Botao>} />
                ))}
              </ul>
            )}
          </Painel>
          <Painel titulo="Próximos 14 dias">
            <ul className="flex flex-col gap-1">
              {agenda.map((a) => (
                <li key={a.dia} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-ink-2">
                    {diaDaSemana(a.dia)}, <span className="tabular">{formatarDiaCurto(a.dia)}</span>
                  </span>
                  <span className="tabular text-ink">{a.pacotes.length ? `${a.pacotes.length} pacote(s) · ${a.pacotes.reduce((s, p) => s + itensParaRevisar(p).length, 0)} itens` : "—"}</span>
                </li>
              ))}
            </ul>
          </Painel>
          <Painel titulo={`Agendados (${proximos.length})`} className="lg:col-span-2">
            {proximos.length === 0 ? (
              <p className="text-[13px] text-ink-2">Sem pacotes agendados.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-line">
                {proximos.map((p) => (
                  <LinhaPacote key={p.id} p={p} dia={dia} acao={<Link to={`/revisao/${p.id}`} className="text-[12.5px] text-accent-text hover:underline">Detalhes</Link>} />
                ))}
              </ul>
            )}
          </Painel>
          <Painel titulo={`Concluídos (${concluidos.length})`}>
            <ul className="flex flex-col gap-1.5">
              {concluidos.slice(0, 12).map((p) => (
                <li key={p.id} className="flex items-center justify-between text-[12.5px]">
                  <Link to={`/revisao/${p.id}`} className="truncate text-ink hover:underline">
                    {getMateria(p.materiaSlug as MateriaSlug).nomeCurto} · {formatarDiaCurto(p.criadoEm)}
                  </Link>
                  <Selo tom="salvia">{p.itens.filter((i) => i.estado === "graduado").length}/{p.itens.length} graduados</Selo>
                </li>
              ))}
              {concluidos.length === 0 && <li className="text-[13px] text-ink-2">Nenhum ainda.</li>}
            </ul>
          </Painel>
        </div>
      )}
    </>
  );
}

function LinhaPacote({ p, dia, acao }: { p: PacoteRevisao; dia: string; acao: React.ReactNode }) {
  const etapa = etapaAtual(p);
  const atraso = diasDeAtraso(p, dia);
  const criticos = p.itens.filter((i) => i.estado === "critico").length;
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] text-ink">
          {getMateria(p.materiaSlug as MateriaSlug).nome} <span className="text-ink-2">· consolidado em {formatarDiaCurto(p.criadoEm)}</span>
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
          {etapa ? <span>{etapa.final ? "Revisão final (D-3)" : `Etapa +${etapa.offsetDias}`} · {formatarDiaCurto(etapa.dataPrevista)}</span> : <span>sem etapas pendentes</span>}
          <span>· {itensParaRevisar(p).length} itens ativos</span>
          {criticos > 0 && <Selo tom="terracota">{criticos} crítico(s)</Selo>}
          {atraso > 0 && <Selo tom="ambar">{atraso}d de atraso</Selo>}
          {etapa && !atraso && diferencaDias(dia, etapa.dataPrevista) > 0 && <span>em {diferencaDias(dia, etapa.dataPrevista)}d</span>}
        </p>
      </div>
      {acao}
    </li>
  );
}
