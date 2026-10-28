import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

type VarianteBotao = "primario" | "secundario" | "fantasma" | "perigo";

const VARIANTES: Record<VarianteBotao, string> = {
  primario: "bg-accent text-on-accent hover:bg-accent/90 border border-transparent",
  secundario: "bg-elevated text-ink border border-line-control hover:bg-surface",
  fantasma: "bg-transparent text-ink-2 border border-transparent hover:bg-surface hover:text-ink",
  perigo: "bg-transparent text-danger-text border border-transparent hover:bg-danger-soft",
};

export interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  tamanho?: "sm" | "md";
  icone?: ReactNode;
  atalho?: string;
}

export const Botao = forwardRef<HTMLButtonElement, BotaoProps>(function Botao({ variante = "secundario", tamanho = "md", icone, atalho, className, children, type = "button", ...props }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      className={cx(
        "quiet-transition inline-flex select-none items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap disabled:opacity-45",
        tamanho === "sm" ? "h-7 px-2.5 text-[12.5px]" : "h-8 px-3 text-[13px]",
        VARIANTES[variante],
        className,
      )}
      {...props}
    >
      {icone}
      {children}
      {atalho ? <Kbd className="ml-1">{atalho}</Kbd> : null}
    </button>
  );
});

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cx("kbd", className)}>{children}</kbd>;
}

type TomSelo = "neutro" | "salvia" | "ardosia" | "ambar" | "terracota";
const TONS: Record<TomSelo, string> = {
  neutro: "bg-surface text-ink-2 border-line",
  salvia: "bg-accent-soft text-accent-text border-transparent",
  ardosia: "bg-accent-2-soft text-accent-2-text border-transparent",
  ambar: "bg-warning-soft text-warning-text border-transparent",
  terracota: "bg-danger-soft text-danger-text border-transparent",
};

export function Selo({ tom = "neutro", children, className, title }: { tom?: TomSelo; children: ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cx("inline-flex items-center gap-1 rounded-[5px] border px-1.5 py-px text-[11.5px] leading-[1.5] font-medium whitespace-nowrap", TONS[tom], className)}>
      {children}
    </span>
  );
}

export function Painel({ titulo, acao, children, className, descricao }: { titulo?: ReactNode; acao?: ReactNode; descricao?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cx("surface-panel p-4", className)}>
      {(titulo || acao) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {titulo && <h2 className="text-[13px] font-semibold tracking-[0.01em] text-ink">{titulo}</h2>}
            {descricao && <p className="mt-0.5 text-[12.5px] text-ink-2">{descricao}</p>}
          </div>
          {acao}
        </header>
      )}
      {children}
    </section>
  );
}

export function Cartao({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("surface-card", className)} {...props} />;
}

/** Barra de progresso de 2px (indicador discreto). */
export function BarraFina({ valor, className, tom = "accent", rotulo }: { valor: number; className?: string; tom?: "accent" | "warning"; rotulo: string }) {
  const pct = Math.round(Math.min(1, Math.max(0, valor)) * 100);
  return (
    <div role="progressbar" aria-label={rotulo} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className={cx("h-[2px] w-full overflow-hidden bg-line", className)}>
      <div className={cx("h-full quiet-transition", tom === "accent" ? "bg-accent" : "bg-warning")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export interface Segmentos {
  solidos: number;
  frageis: number;
  erros: number;
  errosConvictos?: number;
  total: number;
}

/** Barra segmentada: sólidos · frágeis · erros · restante, com 2px de respiro entre segmentos. */
export function BarraSegmentada({ s, className, altura = 6 }: { s: Segmentos; className?: string; altura?: number }) {
  const total = Math.max(1, s.total);
  const erros = s.erros + (s.errosConvictos ?? 0);
  const restante = Math.max(0, s.total - s.solidos - s.frageis - erros);
  const partes = [
    { n: s.solidos, cor: "bg-chart-solido", nome: "acertos sólidos" },
    { n: s.frageis, cor: "bg-chart-fragil", nome: "acertos frágeis" },
    { n: erros, cor: "bg-chart-erro", nome: "erros" },
    { n: restante, cor: "bg-chart-neutro", nome: "não resolvidas" },
  ];
  const resumo = partes.map((p) => `${p.n} ${p.nome}`).join(", ");
  return (
    <div className={cx("flex w-full gap-[2px] overflow-hidden rounded-full", className)} style={{ height: altura }} role="img" aria-label={`${resumo}, de ${s.total}`}>
      {partes.map((p) => (p.n > 0 ? <div key={p.nome} className={cx("h-full quiet-transition", p.cor)} style={{ width: `${(p.n / total) * 100}%` }} /> : null))}
    </div>
  );
}

export function LegendaSegmentos({ s, className }: { s: Segmentos; className?: string }) {
  const respondidas = s.solidos + s.frageis + s.erros + (s.errosConvictos ?? 0);
  return (
    <dl className={cx("flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-2", className)}>
      <Item rotulo="Resolvidas" valor={`${respondidas}/${s.total}`} />
      <Item rotulo="Sólidos" valor={s.solidos} cor="bg-chart-solido" />
      <Item rotulo="Frágeis" valor={s.frageis} cor="bg-chart-fragil" />
      <Item rotulo="Erros" valor={s.erros + (s.errosConvictos ?? 0)} cor="bg-chart-erro" />
    </dl>
  );
}

function Item({ rotulo, valor, cor }: { rotulo: string; valor: ReactNode; cor?: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {cor && <span aria-hidden className={cx("inline-block size-2 rounded-full", cor)} />}
      <dt>{rotulo}</dt>
      <dd className="tabular text-ink">{valor}</dd>
    </div>
  );
}

export function Vazio({ titulo, children, acao }: { titulo: string; children?: ReactNode; acao?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-control px-5 py-8 text-center">
      <p className="text-[13.5px] font-medium text-ink">{titulo}</p>
      {children && <div className="mx-auto mt-1.5 max-w-[52ch] text-[13px] text-ink-2">{children}</div>}
      {acao && <div className="mt-4 flex justify-center">{acao}</div>}
    </div>
  );
}

export function TituloPagina({ titulo, subtitulo, acoes }: { titulo: ReactNode; subtitulo?: ReactNode; acoes?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-ink">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-[13px] text-ink-2">{subtitulo}</p>}
      </div>
      {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
    </header>
  );
}

export function Numero({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx("tabular", className)}>{children}</span>;
}

export function Metrica({ rotulo, valor, detalhe, className }: { rotulo: string; valor: ReactNode; detalhe?: ReactNode; className?: string }) {
  return (
    <div className={cx("min-w-0", className)}>
      <div className="text-[12px] text-ink-2">{rotulo}</div>
      <div className="dado mt-0.5 text-[22px] leading-tight font-medium text-ink">{valor}</div>
      {detalhe && <div className="mt-0.5 text-[12px] text-ink-2">{detalhe}</div>}
    </div>
  );
}

export function Alternador({ ativo, onChange, rotulo, descricao }: { ativo: boolean; onChange: (v: boolean) => void; rotulo: string; descricao?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={ativo}
        onClick={() => onChange(!ativo)}
        className={cx("quiet-transition relative mt-0.5 h-[18px] w-8 shrink-0 rounded-full border", ativo ? "border-accent bg-accent" : "border-line-field bg-surface")}
      >
        <span className={cx("quiet-transition absolute top-[2px] size-3 rounded-full", ativo ? "left-[16px] bg-on-accent" : "left-[2px] bg-ink-3")} />
      </button>
      <span className="min-w-0">
        <span className="block text-[13px] text-ink">{rotulo}</span>
        {descricao && <span className="block text-[12px] text-ink-2">{descricao}</span>}
      </span>
    </label>
  );
}

export function Abas<T extends string>({ abas, ativa, onChange, rotulo }: { abas: { id: T; rotulo: ReactNode }[]; ativa: T; onChange: (id: T) => void; rotulo: string }) {
  return (
    <div role="tablist" aria-label={rotulo} className="inline-flex rounded-lg border border-line bg-surface p-0.5">
      {abas.map((a) => (
        <button
          key={a.id}
          role="tab"
          type="button"
          aria-selected={ativa === a.id}
          onClick={() => onChange(a.id)}
          className={cx("quiet-transition h-7 rounded-md px-2.5 text-[12.5px] font-medium", ativa === a.id ? "bg-elevated text-ink shadow-[0_0_0_1px_var(--border-subtle)]" : "text-ink-2 hover:text-ink")}
        >
          {a.rotulo}
        </button>
      ))}
    </div>
  );
}
