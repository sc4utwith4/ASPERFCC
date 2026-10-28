import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { getMateria, MATERIAS, type MateriaSlug } from "@/data/edital";
import type { QuestaoRegistro, Tentativa } from "@/db/db";
import { ROTULO_RESULTADO } from "@/engine/classificacao";
import { formatarDuracao } from "@/engine/datas";
import { contar, formatarNumero, formatarPercentual, percentualBruto, percentualLiquido, projetarProva, type PremissasGrupo } from "@/engine/pontuacao";
import { textoDoEnunciado } from "@/engine/variantes";
import { BarraSegmentada, LegendaSegmentos, Metrica, Painel, Selo } from "@/components/ui";
import { TabelaSimples } from "@/components/graficos";

const TOM = { ACERTO_SOLIDO: "salvia", ACERTO_FRAGIL: "ambar", ERRO: "terracota", ERRO_CONVICTO: "terracota" } as const;

export function ResultadoSimulado({ questaoIds, tentativas, questoes, premissas, provaReal }: { questaoIds: string[]; tentativas: Tentativa[]; questoes: Map<string, QuestaoRegistro>; premissas?: PremissasGrupo; provaReal?: boolean }) {
  const porQuestao = new Map(tentativas.map((t) => [t.questaoId, t]));
  const resultados = [...porQuestao.values()].map((t) => t.resultado);
  const c = contar(resultados);
  const emBranco = questaoIds.length - porQuestao.size;
  const tempoTotal = tentativas.reduce((s, t) => s + t.tempoMs, 0);

  const porMateria = new Map<MateriaSlug, { total: number; acertos: number; solidos: number }>();
  for (const id of questaoIds) {
    const q = questoes.get(id);
    if (!q) continue;
    const t = porQuestao.get(id);
    const atual = porMateria.get(q.materiaSlug) ?? { total: 0, acertos: 0, solidos: 0 };
    atual.total++;
    if (t?.acertou) atual.acertos++;
    if (t?.resultado === "ACERTO_SOLIDO") atual.solidos++;
    porMateria.set(q.materiaSlug, atual);
  }
  const taxas = new Map([...porMateria].map(([slug, v]) => [slug, v.total ? v.acertos / v.total : 0]));
  const projecao = provaReal && premissas ? projetarProva(taxas, premissas) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <Painel titulo="Resultado">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Metrica rotulo="Acerto bruto" valor={formatarPercentual(percentualBruto({ ...c, total: questaoIds.length }))} detalhe={`${c.solidos + c.frageis} de ${questaoIds.length}`} />
          <Metrica rotulo="Acerto líquido" valor={formatarPercentual(percentualLiquido({ ...c, total: questaoIds.length }))} detalhe="só certeza consciente" />
          <Metrica rotulo="Em branco" valor={emBranco} detalhe="contam como erro na FCC" />
          <Metrica rotulo="Tempo médio" valor={porQuestao.size ? formatarDuracao(tempoTotal / porQuestao.size) : "—"} detalhe="por questão respondida" />
        </div>
        <BarraSegmentada s={{ ...c, total: questaoIds.length }} className="mt-4" altura={8} />
        <LegendaSegmentos s={{ ...c, total: questaoIds.length }} className="mt-2" />
        {projecao && (
          <p className="mt-4 text-[13px] text-ink-2">
            Nota padronizada estimada: <strong className="text-ink">{formatarNumero(projecao.notaObjetiva, 0)}</strong> (corte 150). Gerais {formatarNumero(projecao.acertosGerais, 0)}/25 → NP {formatarNumero(projecao.npGerais, 0)} · Específicos {formatarNumero(projecao.acertosEspecificos, 0)}/45 → NP {formatarNumero(projecao.npEspecificos, 0)}. Média e σ do grupo são premissas.
          </p>
        )}
      </Painel>

      {porMateria.size > 1 && (
        <Painel titulo="Por matéria">
          <TabelaSimples
            cabecalho={["Matéria", "Acertos", "Sólidos", "Questões"]}
            linhas={MATERIAS.filter((m) => porMateria.has(m.slug)).map((m) => {
              const v = porMateria.get(m.slug)!;
              return [m.nomeCurto, String(v.acertos), String(v.solidos), String(v.total)];
            })}
          />
        </Painel>
      )}

      <Painel titulo="Correção questão a questão">
        <ol className="flex flex-col divide-y divide-line">
          {questaoIds.map((id, i) => {
            const q = questoes.get(id);
            return q ? <ItemCorrecao key={id} numero={i + 1} questao={q} tentativa={porQuestao.get(id)} /> : null;
          })}
        </ol>
      </Painel>
    </div>
  );
}

function ItemCorrecao({ numero, questao, tentativa }: { numero: number; questao: QuestaoRegistro; tentativa?: Tentativa }) {
  const [aberto, setAberto] = useState(false);
  const correta = questao.alternativas.find((a) => a.correta)!;
  const escolhida = tentativa?.escolhidaId ? questao.alternativas.find((a) => a.id === tentativa.escolhidaId) : undefined;
  return (
    <li className="py-2">
      <button type="button" onClick={() => setAberto((a) => !a)} className="flex w-full items-center gap-2 text-left" aria-expanded={aberto}>
        {aberto ? <ChevronDown size={14} className="shrink-0 text-ink-3" /> : <ChevronRight size={14} className="shrink-0 text-ink-3" />}
        <span className="tabular w-7 shrink-0 text-[12px] text-ink-2">{numero}.</span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-ink">
          {getMateria(questao.materiaSlug).nomeCurto} · {questao.subtopico}
        </span>
        {tentativa ? <Selo tom={TOM[tentativa.resultado]}>{ROTULO_RESULTADO[tentativa.resultado]}</Selo> : <Selo tom="neutro">em branco</Selo>}
      </button>
      {aberto && (
        <div className="mt-2 ml-11 flex flex-col gap-2 pb-2">
          <p className="font-serif text-[15px] leading-[1.6] text-ink">{textoDoEnunciado(questao, tentativa?.varianteIdx ?? -1)}</p>
          {escolhida && !escolhida.correta && (
            <p className="text-[13px] text-ink-2">
              <span className="text-danger-text">Sua resposta:</span> {escolhida.texto} — {escolhida.explicacaoDetalhada}
            </p>
          )}
          <p className="text-[13px] text-ink-2">
            <span className="text-accent-text">Correta:</span> {correta.texto} — {correta.explicacaoDetalhada}
          </p>
          <p className="text-[13px] text-ink-2">
            <span className="text-warning-text">Pegadinha:</span> {questao.pegadinhaFCC}
          </p>
        </div>
      )}
    </li>
  );
}
