import { useEffect, useState } from "react";
import { Flag, SkipForward } from "lucide-react";
import { db, type QuestaoRegistro } from "@/db/db";
import { exposicoesAnteriores, ultimaLetraCorreta } from "@/db/servicos";
import type { AlternativaId } from "@/data/schema";
import { getMateria } from "@/data/edital";
import { letraDaCorreta, permutarAlternativas, type Letra } from "@/engine/alternativas";
import { formatarDuracao } from "@/engine/datas";
import { escolherEnunciado } from "@/engine/variantes";
import { Botao, cx } from "@/components/ui";
import { Dialogo } from "@/components/Dialogo";
import { useAgora } from "@/features/workspace/Timer";
import { Resolvedor, type RespostaRegistrada } from "@/features/questao/Resolvedor";

export interface PreparoSimulado {
  questao: QuestaoRegistro;
  ordem: AlternativaId[];
  varianteIdx: number;
  letraCorreta: Letra;
}

interface Props {
  titulo: string;
  questaoIds: string[];
  limiteMs: number;
  iniciadaEm: number;
  seed: string;
  respondidas: ReadonlySet<string>;
  onRegistrar: (p: PreparoSimulado, r: RespostaRegistrada) => Promise<void>;
  onFinalizar: () => void;
}

/** Simulado cronometrado: sem gabarito até o fim, com navegação entre questões e pular. */
export function SimuladoRunner({ titulo, questaoIds, limiteMs, iniciadaEm, seed, respondidas, onRegistrar, onFinalizar }: Props) {
  const agora = useAgora(1000);
  const [feitas, setFeitas] = useState<Set<string>>(() => new Set(respondidas));
  const [atual, setAtual] = useState(() => questaoIds.findIndex((id) => !respondidas.has(id)));
  const [preparo, setPreparo] = useState<PreparoSimulado>();
  const [confirmarFim, setConfirmarFim] = useState(false);
  const restante = Math.max(0, limiteMs - (agora - iniciadaEm));
  const id = questaoIds[atual];

  useEffect(() => {
    if (restante === 0) onFinalizar();
  }, [restante, onFinalizar]);

  useEffect(() => {
    if (!id) return;
    let ativo = true;
    setPreparo(undefined);
    void (async () => {
      const [questao, exposicoes, ultima] = await Promise.all([db.questoes.get(id), exposicoesAnteriores(id), ultimaLetraCorreta(id)]);
      if (!questao || !ativo) return;
      const ordem = permutarAlternativas(questao, seed, ultima);
      setPreparo({ questao, ordem, varianteIdx: escolherEnunciado(questao, exposicoes).varianteIdx, letraCorreta: letraDaCorreta(questao, ordem) });
    })();
    return () => {
      ativo = false;
    };
  }, [id, seed]);

  function proximaPendente(depoisDe: number, conjunto: Set<string>) {
    for (let k = 1; k <= questaoIds.length; k++) {
      const i = (depoisDe + k) % questaoIds.length;
      if (!conjunto.has(questaoIds[i]!)) return i;
    }
    return -1;
  }

  async function registrar(r: RespostaRegistrada) {
    if (!preparo) return;
    await onRegistrar(preparo, r);
    setFeitas((f) => new Set(f).add(preparo.questao.id));
  }

  function avancar() {
    const conjunto = new Set(feitas);
    if (id) conjunto.add(id);
    const prox = proximaPendente(atual, conjunto);
    if (prox < 0) onFinalizar();
    else setAtual(prox);
  }

  const alerta = restante < 10 * 60_000;

  return (
    <div className="mx-auto max-w-[820px]">
      <header className="sticky top-12 z-10 -mx-4 mb-5 border-b border-line bg-canvas px-4 py-2.5 sm:-mx-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-ink">{titulo}</p>
          <div className="flex items-center gap-3">
            <span className={cx("dado rounded-md px-2 py-0.5 text-[13px]", alerta ? "bg-warning-soft text-warning-text" : "text-ink")} aria-label="Tempo restante">
              {formatarDuracao(restante)}
            </span>
            <span className="tabular text-[12.5px] text-ink-2">
              {feitas.size}/{questaoIds.length} respondidas
            </span>
            <Botao variante="fantasma" tamanho="sm" icone={<Flag size={13} strokeWidth={1.7} />} onClick={() => setConfirmarFim(true)}>
              Encerrar
            </Botao>
          </div>
        </div>
        <nav aria-label="Navegação entre questões" className="mt-2 flex flex-wrap gap-1">
          {questaoIds.map((qid, i) => (
            <button
              key={qid}
              type="button"
              onClick={() => !feitas.has(qid) && setAtual(i)}
              aria-current={i === atual}
              aria-label={`Questão ${i + 1}${feitas.has(qid) ? " (respondida)" : ""}`}
              disabled={feitas.has(qid)}
              className={cx("tabular h-6 min-w-6 rounded px-1 text-[11px] quiet-transition", i === atual ? "bg-ink text-canvas" : feitas.has(qid) ? "bg-accent-2-soft text-accent-2-text" : "bg-surface text-ink-2 hover:text-ink")}
            >
              {i + 1}
            </button>
          ))}
        </nav>
      </header>

      {preparo && id ? (
        <Resolvedor
          key={id}
          questao={preparo.questao}
          ordem={preparo.ordem}
          varianteIdx={preparo.varianteIdx}
          letraCorreta={preparo.letraCorreta}
          modo="padrao"
          seed={seed}
          semFeedback
          onRegistrar={registrar}
          onProxima={avancar}
          cabecalho={
            <div className="mb-4 flex items-center justify-between gap-2 text-[12px] text-ink-2">
              <span>
                Questão {atual + 1} · {getMateria(preparo.questao.materiaSlug).nomeCurto}
              </span>
              <Botao variante="fantasma" tamanho="sm" icone={<SkipForward size={13} strokeWidth={1.7} />} onClick={avancar}>
                Pular
              </Botao>
            </div>
          }
        />
      ) : (
        <p className="text-[13px] text-ink-2" role="status">
          Carregando questão…
        </p>
      )}

      <Dialogo
        aberto={confirmarFim}
        onFechar={() => setConfirmarFim(false)}
        titulo="Encerrar o simulado?"
        largura="sm"
        rodape={
          <>
            <Botao variante="fantasma" onClick={() => setConfirmarFim(false)}>
              Continuar
            </Botao>
            <Botao variante="primario" onClick={onFinalizar}>
              Encerrar e ver resultado
            </Botao>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">{questaoIds.length - feitas.size} questões ficarão em branco. Na FCC não há desconto por erro, então na prova real vale responder todas.</p>
      </Dialogo>
    </div>
  );
}
