import { useRef, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, ShieldAlert } from "lucide-react";
import { textoDeApoio } from "@/data/banco";
import type { AlternativaId, Questao } from "@/data/schema";
import { letraDoIndice } from "@/engine/alternativas";
import { NUMERAIS_ROMANOS } from "@/engine/variantes";
import { Selo, cx } from "@/components/ui";

export function SeloFonteOficial({ questao }: { questao: Questao }) {
  if (!questao.revisarFonteOficial) return null;
  return (
    <Selo tom="ambar" title="Fato baseado em fonte secundária: o texto integral do normativo não pôde ser lido. Confira no GNOI/TCE-GO antes de memorizar.">
      <ShieldAlert size={12} strokeWidth={1.8} /> conferir no texto oficial
    </Selo>
  );
}

export function TextoApoio({ id }: { id?: string }) {
  const texto = textoDeApoio(id);
  const [aberto, setAberto] = useState(true);
  if (!texto) return null;
  return (
    <section className="mb-5 rounded-xl border border-line bg-surface" aria-label={`Texto de apoio: ${texto.titulo}`}>
      <button type="button" onClick={() => setAberto((a) => !a)} className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12.5px] text-ink-2" aria-expanded={aberto}>
        {aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="font-medium text-ink">{texto.titulo}</span>
        <span>· {texto.genero}</span>
        {texto.idioma === "en" && <Selo tom="ardosia">inglês</Selo>}
      </button>
      {aberto && (
        <div className="reading px-4 pb-4" lang={texto.idioma === "en" ? "en" : "pt-BR"}>
          {texto.paragrafos.map((p, i) => (
            <p key={i} className="relative">
              <span aria-hidden className="tabular absolute top-[0.35em] -left-1 -translate-x-full pr-1 text-[10.5px] text-ink-3 select-none">
                {i + 1}
              </span>
              {p}
            </p>
          ))}
          <p className="mt-3 text-[11.5px] font-sans text-ink-2">{texto.fonte}</p>
        </div>
      )}
    </section>
  );
}

export function Enunciado({ questao, texto }: { questao: Questao; texto: string }) {
  return (
    <div className="reading">
      {texto.split(/\n+/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {questao.formato === "assertivas" && questao.assertivas && (
        <ol className="my-4 flex flex-col gap-2" aria-label="Afirmativas">
          {questao.assertivas.map((a, i) => (
            <li key={i} className="grid grid-cols-[2.2em_1fr] gap-1">
              <span className="font-sans text-[14px] font-semibold text-ink-2">{NUMERAIS_ROMANOS[i]}.</span>
              <span>{a.texto}</span>
            </li>
          ))}
        </ol>
      )}
      {questao.comandoFinal && <p>{questao.comandoFinal}</p>}
    </div>
  );
}

export type EstadoAlternativa = "neutra" | "correta" | "escolhida-errada" | "escolhida-certa";

interface AlternativasProps {
  questao: Questao;
  ordem: readonly AlternativaId[];
  selecionada?: AlternativaId;
  riscadas: ReadonlySet<AlternativaId>;
  revelada: boolean;
  /** Em simulado não há feedback: só marca a escolha. */
  semFeedback?: boolean;
  onSelecionar?: (id: AlternativaId) => void;
  onRiscar?: (id: AlternativaId) => void;
}

/** Lista de alternativas A–E (radiogroup). Botão direito ou toque longo risca. */
export function Alternativas({ questao, ordem, selecionada, riscadas, revelada, semFeedback, onSelecionar, onRiscar }: AlternativasProps) {
  const porId = new Map(questao.alternativas.map((a) => [a.id, a]));
  return (
    <div role="radiogroup" aria-label="Alternativas" className="mt-5 flex flex-col gap-2">
      {ordem.map((id, i) => {
        const alt = porId.get(id);
        if (!alt) return null;
        const letra = letraDoIndice(i);
        const escolhida = selecionada === id;
        let estado: EstadoAlternativa = "neutra";
        if (revelada && !semFeedback) {
          if (alt.correta) estado = escolhida ? "escolhida-certa" : "correta";
          else if (escolhida) estado = "escolhida-errada";
        }
        return (
          <AlternativaItem
            key={id}
            letra={letra}
            texto={alt.texto}
            explicacao={revelada && !semFeedback ? alt.explicacaoDetalhada : undefined}
            escolhida={escolhida}
            riscada={riscadas.has(id)}
            estado={estado}
            desabilitada={revelada && !semFeedback}
            onSelecionar={() => onSelecionar?.(id)}
            onRiscar={() => onRiscar?.(id)}
          />
        );
      })}
    </div>
  );
}

function AlternativaItem({ letra, texto, explicacao, escolhida, riscada, estado, desabilitada, onSelecionar, onRiscar }: { letra: string; texto: string; explicacao?: string; escolhida: boolean; riscada: boolean; estado: EstadoAlternativa; desabilitada: boolean; onSelecionar: () => void; onRiscar: () => void }) {
  const toque = useRef<number | undefined>(undefined);
  const borda =
    estado === "escolhida-certa" || estado === "correta"
      ? "border-accent bg-accent-soft"
      : estado === "escolhida-errada"
        ? "border-danger bg-danger-soft"
        : escolhida
          ? "border-accent-2 bg-accent-2-soft"
          : "border-line bg-elevated hover:border-line-control";
  const rotuloEstado = estado === "correta" ? " (gabarito)" : estado === "escolhida-certa" ? " (sua resposta, correta)" : estado === "escolhida-errada" ? " (sua resposta, incorreta)" : "";
  return (
    <div className={cx("quiet-transition rounded-xl border", borda)}>
      <button
        type="button"
        role="radio"
        aria-checked={escolhida}
        aria-disabled={desabilitada}
        aria-label={`Alternativa ${letra}${riscada ? " (riscada)" : ""}${rotuloEstado}: ${texto}`}
        onClick={() => !desabilitada && onSelecionar()}
        onContextMenu={(e) => {
          e.preventDefault();
          if (!desabilitada) onRiscar();
        }}
        onPointerDown={(e) => {
          if (e.pointerType !== "touch" || desabilitada) return;
          toque.current = window.setTimeout(() => {
            onRiscar();
            toque.current = undefined;
          }, 520);
        }}
        onPointerUp={() => window.clearTimeout(toque.current)}
        onPointerLeave={() => window.clearTimeout(toque.current)}
        className="flex w-full items-start gap-3 px-3.5 py-3 text-left"
      >
        <span
          className={cx(
            "quiet-transition mt-[3px] flex size-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold",
            estado === "correta" || estado === "escolhida-certa"
              ? "border-transparent bg-accent text-on-accent"
              : estado === "escolhida-errada"
                ? "border-transparent bg-danger text-on-accent"
                : escolhida
                  ? "border-transparent bg-ink text-canvas"
                  : "border-line-control text-ink-2",
          )}
          aria-hidden
        >
          {letra}
        </span>
        <span className={cx("min-w-0 flex-1 font-serif text-[17px] leading-[1.6]", riscada ? "strike" : "text-ink")}>{texto}</span>
      </button>
      {explicacao && <p className="px-3.5 pb-3 pl-[3.25rem] text-[13px] leading-[1.6] text-ink-2">{explicacao}</p>}
    </div>
  );
}

export function LinhaMeta({ children }: { children: ReactNode }) {
  return <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">{children}</div>;
}
