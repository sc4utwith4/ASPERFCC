import { Link } from "react-router";
import { MATERIAS, type Bloco } from "@/data/edital";
import { formatarDiaCurto } from "@/engine/datas";
import { useUI } from "@/stores/ui";
import { BarraSegmentada, Selo, TituloPagina } from "@/components/ui";
import { contagemDoResumo, tamanhoCiclo1, useContagemQuestoes, useResumos } from "../dados";

const BLOCOS: { id: Bloco; titulo: string; detalhe: string }[] = [
  { id: "gerais", titulo: "Conhecimentos Gerais", detalhe: "25 questões · peso 1" },
  { id: "especificos", titulo: "Conhecimentos Específicos", detalhe: "45 questões · peso 2" },
];

export function MateriasPage() {
  const resumos = useResumos();
  const contagens = useContagemQuestoes();
  const definir = useUI((s) => s.definir);
  return (
    <>
      <TituloPagina titulo="Matérias" subtitulo="14 disciplinas do edital B02. Cada bateria tem 50 questões: resolva em blocos diários ou em modo maratona." />
      <div className="flex flex-col gap-8">
        {BLOCOS.map((bloco) => (
          <section key={bloco.id} aria-labelledby={`bloco-${bloco.id}`}>
            <h2 id={`bloco-${bloco.id}`} className="mb-3 text-[13px] font-semibold text-ink">
              {bloco.titulo} <span className="font-normal text-ink-2">· {bloco.detalhe}</span>
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {MATERIAS.filter((m) => m.bloco === bloco.id).map((m) => {
                const r = resumos?.get(m.slug);
                const c = contagemDoResumo(r);
                const noBanco = contagens?.get(m.slug) ?? 0;
                return (
                  <li key={m.slug}>
                    <Link to={`/materias/${m.slug}`} onClick={() => definir({ materiaAtiva: m.slug })} className="quiet-transition flex h-full flex-col rounded-xl border border-line bg-elevated p-4 hover:border-line-control">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[13.5px] font-medium text-ink">{m.nome}</h3>
                        <Selo tom={m.peso === 2 ? "ardosia" : "neutro"}>peso {m.peso}</Selo>
                      </div>
                      <p className="mt-1 text-[12px] text-ink-2">
                        {m.questoesNaProva} questões na prova · {m.subtopicos.length} subtópicos · {noBanco} no banco
                      </p>
                      <div className="mt-auto pt-4">
                        <BarraSegmentada s={{ ...c, total: tamanhoCiclo1(r) }} />
                        <p className="tabular mt-1.5 flex justify-between text-[12px] text-ink-2">
                          <span>{r?.respondidasCiclo1 ?? 0}/{tamanhoCiclo1(r)} no 1º ciclo</span>
                          <span>{r?.diaConclusaoCiclo1 ? `concluída em ${formatarDiaCurto(r.diaConclusaoCiclo1)}` : r?.ultimaAtividade ? `última vez ${formatarDiaCurto(r.ultimaAtividade)}` : "não iniciada"}</span>
                        </p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
