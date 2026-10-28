import { useState } from "react";
import { Flag } from "lucide-react";
import type { Questao } from "@/data/schema";
import type { Confianca, Resultado } from "@/engine/classificacao";
import { ROTULO_CONFIANCA, ROTULO_RESULTADO } from "@/engine/classificacao";
import type { Letra } from "@/engine/alternativas";
import { db } from "@/db/db";
import { novoId } from "@/engine/rng";
import { Botao, Kbd, Selo, cx } from "@/components/ui";
import { Dialogo } from "@/components/Dialogo";
import { SeloFonteOficial } from "./QuestaoView";

export function SeletorConfianca({ valor, onChange, desabilitado, destacar }: { valor?: Confianca; onChange: (c: Confianca) => void; desabilitado?: boolean; destacar?: boolean }) {
  const opcoes: Confianca[] = [1, 2, 3];
  return (
    <fieldset className={cx("rounded-xl border px-3 py-2.5 quiet-transition", destacar ? "border-warning bg-warning-soft" : "border-line bg-surface")} disabled={desabilitado}>
      <legend className="sr-only">Nível de confiança antes de ver o gabarito</legend>
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[12px] text-ink-2">Confiança</span>
        {opcoes.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={valor === c}
            onClick={() => onChange(c)}
            className={cx("quiet-transition flex h-8 items-center gap-2 rounded-lg border px-2.5 text-[12.5px]", valor === c ? "border-accent-2 bg-accent-2-soft text-ink" : "border-line bg-elevated text-ink-2 hover:text-ink")}
          >
            <Kbd>{c}</Kbd>
            {ROTULO_CONFIANCA[c]}
          </button>
        ))}
      </div>
      {destacar && <p className="mt-1.5 text-[12px] text-warning-text">Escolha a confiança antes de confirmar: acerto com dúvida ou chute volta para revisão.</p>}
    </fieldset>
  );
}

const TOM_RESULTADO: Record<Resultado, "salvia" | "ambar" | "terracota"> = {
  ACERTO_SOLIDO: "salvia",
  ACERTO_FRAGIL: "ambar",
  ERRO: "terracota",
  ERRO_CONVICTO: "terracota",
};

const EXPLICA_RESULTADO: Record<Resultado, string> = {
  ACERTO_SOLIDO: "Você acertou com certeza consciente.",
  ACERTO_FRAGIL: "Acertou, mas com dúvida ou chute: a questão entra no Caderno de Revisão.",
  ERRO: "A questão entra no Caderno de Revisão.",
  ERRO_CONVICTO: "Você errou com certeza: há um equívoco conceitual aqui. Prioridade máxima na revisão.",
};

export function Feedback({ questao, resultado, letraCorreta }: { questao: Questao; resultado: Resultado; letraCorreta: Letra }) {
  return (
    <section aria-live="polite" className="mt-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Selo tom={TOM_RESULTADO[resultado]}>{ROTULO_RESULTADO[resultado]}</Selo>
        <span className="text-[13px] text-ink-2">
          Gabarito: <strong className="text-ink">{letraCorreta}</strong>. {EXPLICA_RESULTADO[resultado]}
        </span>
      </div>
      <div className="rounded-xl border border-line bg-surface px-4 py-3">
        <p className="text-[12px] font-semibold tracking-[0.04em] text-warning-text uppercase">Pegadinha FCC</p>
        <p className="mt-1 text-[13.5px] leading-[1.6] text-ink">{questao.pegadinhaFCC}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
        <span>Fundamentação: {questao.fundamentacao}</span>
        <SeloFonteOficial questao={questao} />
        <ReportarErro questaoId={questao.id} />
      </div>
    </section>
  );
}

export function ReportarErro({ questaoId }: { questaoId: string }) {
  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviado, setEnviado] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setAberto(true)} className="quiet-transition inline-flex items-center gap-1 rounded px-1 text-[12px] text-ink-2 underline-offset-2 hover:text-ink hover:underline">
        <Flag size={12} strokeWidth={1.7} /> {enviado ? "Erro reportado" : "Reportar erro"}
      </button>
      <Dialogo
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo={`Reportar erro na questão ${questaoId}`}
        rodape={
          <>
            <Botao variante="fantasma" onClick={() => setAberto(false)}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              disabled={!texto.trim()}
              onClick={async () => {
                await db.reportes.add({ id: novoId("reporte"), questaoId, texto: texto.trim(), criadoEm: Date.now() });
                setEnviado(true);
                setAberto(false);
                setTexto("");
              }}
            >
              Salvar reporte
            </Botao>
          </>
        }
      >
        <p className="mb-2 text-[13px] text-ink-2">O reporte fica salvo neste navegador e sai junto no backup (Banco e backup → Exportar). Diga o que está errado e, se souber, a fonte correta.</p>
        <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={5} className="field" aria-label="Descrição do erro" />
      </Dialogo>
    </>
  );
}

export function Rascunho({ aberto, valor, onChange }: { aberto: boolean; valor: string; onChange: (v: string) => void }) {
  if (!aberto) return null;
  return (
    <div className="mt-4">
      <label htmlFor="rascunho" className="text-[12px] text-ink-2">
        Rascunho (não é salvo; sem calculadora, como na prova)
      </label>
      <textarea id="rascunho" value={valor} onChange={(e) => onChange(e.target.value)} rows={4} className="field mt-1 font-mono text-[13px]" />
    </div>
  );
}
