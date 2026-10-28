import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Check, NotebookPen } from "lucide-react";
import type { AlternativaId, Questao } from "@/data/schema";
import { indiceDaLetra, letraDoIndice, type Letra } from "@/engine/alternativas";
import { classificar, type Confianca, type Resultado } from "@/engine/classificacao";
import { avaliarCacaAoErro, itensFalsos, parVersaoInvertida, resultadoJustificativa, ROTULO_SUBMODO, type AutoAvaliacaoJustificativa, type SubModoMutacao } from "@/engine/mutacao";
import { NUMERAIS_ROMANOS, textoDoEnunciado } from "@/engine/variantes";
import { useTeclas, digitando } from "@/app/atalhos";
import { Botao, Kbd, Selo, cx } from "@/components/ui";
import { Alternativas, Enunciado, TextoApoio } from "./QuestaoView";
import { Feedback, Rascunho, SeletorConfianca } from "./Controles";

export interface RespostaRegistrada {
  escolhidaId?: AlternativaId;
  riscadas: AlternativaId[];
  confianca: Confianca;
  acertou: boolean;
  resultado: Resultado;
  tempoMs: number;
  justificativa?: string;
}

export interface ResolvedorProps {
  questao: Questao;
  ordem: AlternativaId[];
  varianteIdx: number;
  letraCorreta: Letra;
  modo: "padrao" | SubModoMutacao;
  seed: string;
  semFeedback?: boolean;
  cabecalho?: ReactNode;
  rotuloProxima?: string;
  onRegistrar: (r: RespostaRegistrada) => Promise<void> | void;
  onProxima: () => void;
}

function letraDoEvento(e: KeyboardEvent): string | undefined {
  const m = /^Key([A-E])$/.exec(e.code);
  return m?.[1];
}

function confiancaDoEvento(e: KeyboardEvent): Confianca | undefined {
  const m = /^(?:Digit|Numpad)([1-3])$/.exec(e.code);
  return m ? (Number(m[1]) as Confianca) : undefined;
}

export function Resolvedor(props: ResolvedorProps) {
  const { questao, varianteIdx, modo } = props;
  const enunciado = textoDoEnunciado(questao, varianteIdx);
  return (
    <article aria-label={`Questão ${questao.id}`}>
      {props.cabecalho}
      {modo !== "padrao" && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Selo tom="ardosia">Modo Mutação · {ROTULO_SUBMODO[modo]}</Selo>
          <span className="text-[12.5px] text-ink-2">{INSTRUCAO_MUTACAO[modo]}</span>
        </div>
      )}
      <TextoApoio id={questao.textoApoioId} />
      <Enunciado questao={questao} texto={enunciado} />
      {modo === "caca-ao-erro" ? <CacaAoErro {...props} /> : modo === "versao-invertida" ? <VersaoInvertida {...props} /> : <Padrao {...props} justificativa={modo === "justificativa"} />}
    </article>
  );
}

const INSTRUCAO_MUTACAO: Record<SubModoMutacao, string> = {
  "caca-ao-erro": "Marque exatamente os itens INCORRETOS.",
  "versao-invertida": "Uma das afirmações abaixo é fiel ao conteúdo; a outra foi invertida. Aponte a fiel.",
  justificativa: "Escolha a alternativa e justifique por escrito antes de ver o gabarito.",
};

function useCronometroDaQuestao() {
  const [inicio] = useState(() => Date.now());
  return () => Date.now() - inicio;
}

function BarraAcoes({ children }: { children: ReactNode }) {
  return <div className="mt-5 flex flex-wrap items-center justify-between gap-3">{children}</div>;
}

function BotaoProxima({ onClick, rotulo }: { onClick: () => void; rotulo?: string }) {
  return (
    <Botao variante="primario" onClick={onClick} icone={<ArrowRight size={15} strokeWidth={1.8} />} atalho="Enter" autoFocus>
      {rotulo ?? "Próxima"}
    </Botao>
  );
}

// ------------------------------------------------------------------- padrão / justificativa

function Padrao({ questao, ordem, letraCorreta, semFeedback, onRegistrar, onProxima, rotuloProxima, justificativa }: ResolvedorProps & { justificativa: boolean }) {
  const tempo = useCronometroDaQuestao();
  const [selecionada, setSelecionada] = useState<AlternativaId>();
  const [riscadas, setRiscadas] = useState<Set<AlternativaId>>(new Set());
  const [confianca, setConfianca] = useState<Confianca>();
  const [resultado, setResultado] = useState<Resultado>();
  const [revelada, setRevelada] = useState(false);
  const [destacar, setDestacar] = useState(false);
  const [rascunho, setRascunho] = useState({ aberto: false, texto: "" });
  const [texto, setTexto] = useState("");
  const [salvando, setSalvando] = useState(false);
  const correta = questao.alternativas.find((a) => a.correta)!;

  const riscar = (id: AlternativaId) =>
    setRiscadas((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const selecionar = (id: AlternativaId) => {
    setSelecionada(id);
    setRiscadas((s) => {
      if (!s.has(id)) return s;
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  };

  async function registrar(conf: Confianca, acertou: boolean, extra?: Partial<RespostaRegistrada>) {
    setSalvando(true);
    const r: RespostaRegistrada = { escolhidaId: selecionada, riscadas: [...riscadas], confianca: conf, acertou, resultado: classificar(acertou, conf), tempoMs: tempo(), ...extra };
    await onRegistrar(r);
    setResultado(r.resultado);
    setSalvando(false);
    if (semFeedback) onProxima();
  }

  async function confirmar() {
    if (!selecionada || salvando) return;
    if (justificativa) {
      if (!texto.trim()) return;
      setRevelada(true);
      return;
    }
    if (!confianca) {
      setDestacar(true);
      return;
    }
    setRevelada(true);
    await registrar(confianca, selecionada === correta.id);
  }

  async function autoAvaliar(a: AutoAvaliacaoJustificativa) {
    const r = resultadoJustificativa(selecionada === correta.id, a);
    await registrar(r.confianca, r.acertou, { justificativa: texto.trim() });
  }

  const concluida = resultado !== undefined;

  useTeclas((e) => {
    if (digitando(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (concluida) onProxima();
      else void confirmar();
      return;
    }
    if (e.code === "KeyR" && !e.shiftKey) {
      e.preventDefault();
      setRascunho((r) => ({ ...r, aberto: !r.aberto }));
      return;
    }
    if (revelada) return;
    const letra = letraDoEvento(e);
    if (letra) {
      const id = ordem[indiceDaLetra(letra)];
      if (!id) return;
      e.preventDefault();
      if (e.shiftKey) riscar(id);
      else selecionar(id);
      return;
    }
    const c = confiancaDoEvento(e);
    if (c && !justificativa) {
      e.preventDefault();
      setConfianca(c);
      setDestacar(false);
    }
  });

  return (
    <>
      <Alternativas questao={questao} ordem={ordem} selecionada={selecionada} riscadas={riscadas} revelada={revelada} semFeedback={semFeedback} onSelecionar={selecionar} onRiscar={riscar} />
      <Rascunho aberto={rascunho.aberto} valor={rascunho.texto} onChange={(t) => setRascunho((r) => ({ ...r, texto: t }))} />
      {justificativa && !revelada && (
        <div className="mt-4">
          <label htmlFor="justificativa" className="text-[12.5px] text-ink-2">
            Por que a alternativa escolhida é a correta? (1 ou 2 frases)
          </label>
          <textarea id="justificativa" value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} className="field mt-1 font-serif text-[15px]" />
        </div>
      )}
      {!revelada && (
        <BarraAcoes>
          {!justificativa ? (
            <SeletorConfianca
              valor={confianca}
              onChange={(c) => {
                setConfianca(c);
                setDestacar(false);
              }}
              destacar={destacar}
            />
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Botao variante="fantasma" tamanho="sm" icone={<NotebookPen size={14} strokeWidth={1.7} />} onClick={() => setRascunho((r) => ({ ...r, aberto: !r.aberto }))} atalho="R">
              Rascunho
            </Botao>
            <Botao variante="primario" onClick={() => void confirmar()} disabled={!selecionada || (justificativa && !texto.trim()) || salvando} icone={<Check size={15} strokeWidth={1.8} />} atalho="Enter">
              {semFeedback ? "Confirmar e seguir" : "Confirmar"}
            </Botao>
          </div>
        </BarraAcoes>
      )}
      {justificativa && revelada && !concluida && (
        <div className="mt-5 rounded-xl border border-line bg-surface p-4">
          <p className="text-[12.5px] text-ink-2">Sua justificativa</p>
          <p className="mt-1 font-serif text-[15px] text-ink">{texto}</p>
          <p className="mt-3 text-[12.5px] text-ink-2">Gabarito: {letraCorreta}. Compare com a explicação da alternativa correta acima. Sua justificativa estava:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Botao onClick={() => void autoAvaliar("correta")}>Correta e completa</Botao>
            <Botao onClick={() => void autoAvaliar("parcial")}>Parcial</Botao>
            <Botao onClick={() => void autoAvaliar("errada")}>Errada</Botao>
          </div>
        </div>
      )}
      {concluida && !semFeedback && (
        <>
          <Feedback questao={questao} resultado={resultado} letraCorreta={letraCorreta} />
          <BarraAcoes>
            <span />
            <BotaoProxima onClick={onProxima} rotulo={rotuloProxima} />
          </BarraAcoes>
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------- caça ao erro

function CacaAoErro({ questao, ordem, letraCorreta, onRegistrar, onProxima, rotuloProxima }: ResolvedorProps) {
  const tempo = useCronometroDaQuestao();
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [confianca, setConfianca] = useState<Confianca>();
  const [destacar, setDestacar] = useState(false);
  const [resultado, setResultado] = useState<Resultado>();
  const falsos = useMemo(() => new Set(itensFalsos(questao)), [questao]);
  const emAssertivas = questao.formato === "assertivas" && !!questao.assertivas;
  const revelada = resultado !== undefined;
  const alternar = (k: string) =>
    setMarcados((s) => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });

  async function confirmar() {
    if (revelada) return;
    if (!confianca) {
      setDestacar(true);
      return;
    }
    const av = avaliarCacaAoErro(questao, marcados);
    const r = classificar(av.acertou, confianca);
    await onRegistrar({ riscadas: [], confianca, acertou: av.acertou, resultado: r, tempoMs: tempo() });
    setResultado(r);
  }

  useTeclas((e) => {
    if (digitando(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (revelada) onProxima();
      else void confirmar();
      return;
    }
    if (revelada) return;
    const letra = letraDoEvento(e);
    if (letra && !emAssertivas) {
      const id = ordem[indiceDaLetra(letra)];
      if (id) {
        e.preventDefault();
        alternar(id);
      }
      return;
    }
    const c = confiancaDoEvento(e);
    if (c) {
      e.preventDefault();
      setConfianca(c);
      setDestacar(false);
    }
  });

  const itens = emAssertivas
    ? questao.assertivas!.map((a, i) => ({ chave: `assertiva-${i}`, rotulo: NUMERAIS_ROMANOS[i]!, texto: a.texto, explicacao: a.explicacao }))
    : ordem.map((id, i) => {
        const alt = questao.alternativas.find((a) => a.id === id)!;
        return { chave: id as string, rotulo: letraDoIndice(i), texto: alt.texto, explicacao: alt.explicacaoDetalhada };
      });

  return (
    <>
      {emAssertivas && <p className="mt-4 text-[12.5px] text-ink-2">Marque as afirmativas falsas (as alternativas de combinação ficam ocultas neste modo).</p>}
      <ul className="mt-4 flex flex-col gap-2" aria-label="Itens para marcar como incorretos">
        {itens.map((it) => {
          const marcado = marcados.has(it.chave);
          const ehFalso = falsos.has(it.chave);
          const acertouItem = marcado === ehFalso;
          return (
            <li key={it.chave} className={cx("rounded-xl border quiet-transition", !revelada ? (marcado ? "border-danger bg-danger-soft" : "border-line bg-elevated") : acertouItem ? "border-accent bg-accent-soft" : "border-danger bg-danger-soft")}>
              <button type="button" role="checkbox" aria-checked={marcado} disabled={revelada} onClick={() => alternar(it.chave)} className="flex w-full items-start gap-3 px-3.5 py-3 text-left">
                <span className={cx("mt-[3px] flex size-6 shrink-0 items-center justify-center rounded-md border text-[12px] font-semibold", marcado ? "border-transparent bg-danger text-on-accent" : "border-line-control text-ink-2")}>{it.rotulo}</span>
                <span className="min-w-0 flex-1 font-serif text-[17px] leading-[1.6] text-ink">{it.texto}</span>
                {revelada && <Selo tom={ehFalso ? "terracota" : "salvia"}>{ehFalso ? "incorreto" : "correto"}</Selo>}
              </button>
              {revelada && <p className="px-3.5 pb-3 pl-[3.25rem] text-[13px] leading-[1.6] text-ink-2">{it.explicacao}</p>}
            </li>
          );
        })}
      </ul>
      {!revelada ? (
        <BarraAcoes>
          <SeletorConfianca valor={confianca} onChange={(c) => { setConfianca(c); setDestacar(false); }} destacar={destacar} />
          <Botao variante="primario" onClick={() => void confirmar()} icone={<Check size={15} strokeWidth={1.8} />} atalho="Enter">
            Confirmar marcação
          </Botao>
        </BarraAcoes>
      ) : (
        <>
          <Feedback questao={questao} resultado={resultado} letraCorreta={letraCorreta} />
          <BarraAcoes>
            <span className="text-[12.5px] text-ink-2">{marcados.size} marcado(s) · {falsos.size} incorreto(s) no total</span>
            <BotaoProxima onClick={onProxima} rotulo={rotuloProxima} />
          </BarraAcoes>
        </>
      )}
    </>
  );
}

// ------------------------------------------------------------------- versão invertida

function VersaoInvertida({ questao, seed, letraCorreta, onRegistrar, onProxima, rotuloProxima }: ResolvedorProps) {
  const tempo = useCronometroDaQuestao();
  const par = useMemo(() => parVersaoInvertida(questao, seed), [questao, seed]);
  const [escolha, setEscolha] = useState<number>();
  const [confianca, setConfianca] = useState<Confianca>();
  const [destacar, setDestacar] = useState(false);
  const [resultado, setResultado] = useState<Resultado>();
  const revelada = resultado !== undefined;
  const correta = questao.alternativas.find((a) => a.correta)!;

  async function confirmar() {
    if (revelada || escolha === undefined) return;
    if (!confianca) {
      setDestacar(true);
      return;
    }
    const acertou = par[escolha]?.chave === "fiel";
    const r = classificar(acertou, confianca);
    await onRegistrar({ riscadas: [], confianca, acertou, resultado: r, tempoMs: tempo() });
    setResultado(r);
  }

  useTeclas((e) => {
    if (digitando(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Enter") {
      e.preventDefault();
      if (revelada) onProxima();
      else void confirmar();
      return;
    }
    if (revelada) return;
    if (e.code === "KeyA" || e.code === "KeyB") {
      e.preventDefault();
      setEscolha(e.code === "KeyA" ? 0 : 1);
      return;
    }
    const c = confiancaDoEvento(e);
    if (c) {
      e.preventDefault();
      setConfianca(c);
      setDestacar(false);
    }
  });

  return (
    <>
      <div role="radiogroup" aria-label="Qual afirmação é fiel?" className="mt-5 flex flex-col gap-2">
        {par.map((op, i) => {
          const marcada = escolha === i;
          const estilo = !revelada ? (marcada ? "border-accent-2 bg-accent-2-soft" : "border-line bg-elevated") : op.chave === "fiel" ? "border-accent bg-accent-soft" : marcada ? "border-danger bg-danger-soft" : "border-line bg-elevated";
          return (
            <button key={op.chave} type="button" role="radio" aria-checked={marcada} disabled={revelada} onClick={() => setEscolha(i)} className={cx("quiet-transition flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left", estilo)}>
              <span className={cx("mt-[3px] flex size-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold", marcada ? "border-transparent bg-ink text-canvas" : "border-line-control text-ink-2")}>{i === 0 ? "A" : "B"}</span>
              <span className="min-w-0 flex-1 font-serif text-[17px] leading-[1.6] text-ink">{op.texto}</span>
              {revelada && <Selo tom={op.chave === "fiel" ? "salvia" : "terracota"}>{op.chave === "fiel" ? "fiel" : "invertida"}</Selo>}
            </button>
          );
        })}
      </div>
      {!revelada ? (
        <BarraAcoes>
          <SeletorConfianca valor={confianca} onChange={(c) => { setConfianca(c); setDestacar(false); }} destacar={destacar} />
          <Botao variante="primario" onClick={() => void confirmar()} disabled={escolha === undefined} icone={<Check size={15} strokeWidth={1.8} />} atalho="Enter">
            Confirmar
          </Botao>
        </BarraAcoes>
      ) : (
        <>
          <div className="mt-4 rounded-xl border border-line bg-surface px-4 py-3">
            <p className="text-[12px] font-semibold text-ink-2">Explicação da alternativa correta da questão original</p>
            <p className="mt-1 text-[13.5px] leading-[1.6] text-ink">{correta.explicacaoDetalhada}</p>
          </div>
          <Feedback questao={questao} resultado={resultado} letraCorreta={letraCorreta} />
          <BarraAcoes>
            <span className="text-[12.5px] text-ink-2">
              Teclas <Kbd>A</Kbd> <Kbd>B</Kbd> escolhem; <Kbd>1</Kbd>–<Kbd>3</Kbd> confiança
            </span>
            <BotaoProxima onClick={onProxima} rotulo={rotuloProxima} />
          </BarraAcoes>
        </>
      )}
    </>
  );
}
