import { useState } from "react";
import { RotateCw } from "lucide-react";
import type { Avaliacao } from "@/engine/flashcardSrs";
import { useTeclas, digitando } from "@/app/atalhos";
import { BarraFina, Botao, Kbd, cx } from "@/components/ui";

export interface CartaoSessao {
  id: string;
  frente: string;
  verso: string;
  contexto?: string;
}

const BOTOES: { avaliacao: Avaliacao; rotulo: string; tecla: string }[] = [
  { avaliacao: "dificil", rotulo: "Difícil", tecla: "1" },
  { avaliacao: "bom", rotulo: "Bom", tecla: "2" },
  { avaliacao: "facil", rotulo: "Fácil", tecla: "3" },
];

/** Sessão de active recall: Espaço vira o cartão; 1/2/3 avaliam (Difícil/Bom/Fácil). */
export function SessaoFlashcards({ cartoes, onAvaliar, onFim, intervalos }: { cartoes: CartaoSessao[]; onAvaliar: (id: string, a: Avaliacao) => Promise<void> | void; onFim: (contagem: Record<Avaliacao, number>) => void; intervalos?: (id: string) => Record<Avaliacao, number> | undefined }) {
  const [indice, setIndice] = useState(0);
  const [virado, setVirado] = useState(false);
  const [contagem, setContagem] = useState<Record<Avaliacao, number>>({ dificil: 0, bom: 0, facil: 0 });
  const atual = cartoes[indice];

  async function avaliar(a: Avaliacao) {
    if (!atual || !virado) return;
    await onAvaliar(atual.id, a);
    const nova = { ...contagem, [a]: contagem[a] + 1 };
    setContagem(nova);
    if (indice + 1 >= cartoes.length) {
      onFim(nova);
      return;
    }
    setIndice((i) => i + 1);
    setVirado(false);
  }

  useTeclas((e) => {
    if (digitando(e) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.code === "Space") {
      e.preventDefault();
      setVirado((v) => !v);
      return;
    }
    const m = /^(?:Digit|Numpad)([1-3])$/.exec(e.code);
    if (m && virado) {
      e.preventDefault();
      void avaliar(BOTOES[Number(m[1]) - 1]!.avaliacao);
    }
  });

  if (!atual) return null;
  const proximos = intervalos?.(atual.id);

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-3 flex items-center justify-between text-[12px] text-ink-2">
        <span className="tabular">
          Cartão {indice + 1} de {cartoes.length}
        </span>
        {atual.contexto && <span className="truncate pl-3">{atual.contexto}</span>}
      </div>
      <BarraFina valor={indice / cartoes.length} rotulo="Progresso da sessão de flashcards" className="mb-4" />
      <div className="flashcard-cena">
        <button type="button" onClick={() => setVirado((v) => !v)} className={cx("flashcard", virado && "virado")} aria-label={virado ? "Resposta exibida. Clique para ver a pergunta." : "Clique ou aperte Espaço para ver a resposta."} aria-live="polite">
          <span className="flashcard-face surface-card">
            <span className="text-[11.5px] font-semibold tracking-[0.06em] text-ink-2 uppercase">Pergunta</span>
            <span className="reading mt-3 block">{atual.frente}</span>
          </span>
          <span className="flashcard-face flashcard-verso surface-card">
            <span className="text-[11.5px] font-semibold tracking-[0.06em] text-accent-text uppercase">Resposta</span>
            <span className="reading mt-3 block">{atual.verso}</span>
          </span>
        </button>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {!virado ? (
          <Botao variante="primario" onClick={() => setVirado(true)} icone={<RotateCw size={14} strokeWidth={1.8} />} atalho="Espaço">
            Mostrar resposta
          </Botao>
        ) : (
          BOTOES.map((b) => (
            <Botao key={b.avaliacao} variante={b.avaliacao === "bom" ? "primario" : "secundario"} onClick={() => void avaliar(b.avaliacao)} atalho={b.tecla}>
              {b.rotulo}
              {proximos && <span className="tabular text-[11.5px] opacity-75">· {proximos[b.avaliacao]}d</span>}
            </Botao>
          ))
        )}
      </div>
      <p className="mt-3 text-center text-[12px] text-ink-2">
        <Kbd>Espaço</Kbd> vira · <Kbd>1</Kbd> Difícil (volta amanhã) · <Kbd>2</Kbd> Bom · <Kbd>3</Kbd> Fácil
      </p>
    </div>
  );
}
