import { Link } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { PenLine } from "lucide-react";
import { carregarCasos } from "@/data/banco";
import { DISCURSIVA, getMateria } from "@/data/edital";
import { db } from "@/db/db";
import { formatarDiaCurto, diaDe } from "@/engine/datas";
import { formatarNumero } from "@/engine/pontuacao";
import { Painel, Selo, TituloPagina, Vazio } from "@/components/ui";

export default function DiscursivaPage() {
  const casos = useLiveQuery(() => carregarCasos(), []);
  const respostas = useLiveQuery(() => db.discursivas.toArray(), []);
  if (!casos || !respostas) return null;
  const corrigidas = respostas.filter((r) => r.status === "corrigida" && r.notaTotal !== undefined);
  const media = corrigidas.length ? corrigidas.reduce((s, r) => s + (r.notaTotal ?? 0), 0) / corrigidas.length : undefined;

  return (
    <>
      <TituloPagina
        titulo="Laboratório Discursivo"
        subtitulo="Estudos de caso inéditos cruzando matérias específicas no contexto do TCE-GO. Nota de 0 a 100; habilita com 50. É o 1º critério de desempate do cargo."
      />
      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <Painel titulo="Regras do edital (Cap. 11)" className="lg:col-span-2">
          <ul className="flex list-disc flex-col gap-1 pl-4 text-[13px] text-ink-2">
            <li>Uma questão prática; o limite de linhas vem na própria questão. Texto fora do espaço não é corrigido.</li>
            <li>Nota prejudicada por abordagem tangencial, parcial ou diluída; cópia de trechos da prova pode reduzir a nota drasticamente.</li>
            <li>Só são corrigidas as discursivas até a 48ª posição da objetiva (ampla concorrência).</li>
            <li>Espelho de treino: 70 pontos de conteúdo (fundamento, aplicação ao TCE-GO, conclusão) + 30 de coesão e norma-padrão.</li>
          </ul>
        </Painel>
        <Painel titulo="Seu histórico">
          <p className="text-[13px] text-ink-2">
            <span className="dado text-[22px] font-medium text-ink">{corrigidas.length}</span> respostas corrigidas
          </p>
          <p className="mt-1 text-[13px] text-ink-2">{media !== undefined ? `Média: ${formatarNumero(media, 1)} / ${DISCURSIVA.escalaMaxima}` : "Ainda sem média."}</p>
        </Painel>
      </div>
      {casos.length === 0 ? (
        <Vazio titulo="Nenhum caso no banco ainda">Os casos ficam em src/data/casos/caso-NN.json.</Vazio>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {casos.map((c) => {
            const minhas = respostas.filter((r) => r.casoId === c.id);
            const ultima = minhas.filter((r) => r.status === "corrigida").sort((a, b) => (b.finalizadaEm ?? 0) - (a.finalizadaEm ?? 0))[0];
            const rascunho = minhas.find((r) => r.status === "rascunho");
            return (
              <li key={c.id}>
                <Link to={`/discursiva/${c.id}`} className="quiet-transition flex h-full flex-col rounded-xl border border-line bg-elevated p-4 hover:border-line-control">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-[13.5px] font-medium text-ink">{c.titulo}</h2>
                    <PenLine size={15} strokeWidth={1.6} className="mt-0.5 shrink-0 text-ink-3" />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.materiasRelacionadas.map((m) => (
                      <Selo key={m} tom="neutro">
                        {getMateria(m).nomeCurto}
                      </Selo>
                    ))}
                    {c.revisarFonteOficial && <Selo tom="ambar">conferir no texto oficial</Selo>}
                  </div>
                  <p className="mt-auto pt-3 text-[12px] text-ink-2">
                    {c.limiteLinhas} linhas · {c.tempoSugeridoMin} min sugeridos
                    {ultima ? ` · última nota ${formatarNumero(ultima.notaTotal ?? 0, 0)} (${formatarDiaCurto(diaDe(new Date(ultima.finalizadaEm ?? 0)))})` : ""}
                    {rascunho ? " · rascunho salvo" : ""}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
