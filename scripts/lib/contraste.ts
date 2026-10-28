/**
 * Razões de contraste WCAG 2.x calculadas a partir de src/design/tokens.css.
 * Usado por `npm run contraste` (gera docs/contraste.md) e pelo teste que
 * impede regressões de legibilidade nos tokens.
 */

export type Tema = "claro" | "escuro";
export type Tokens = Map<string, string>;

export interface ParContraste {
  rotulo: string;
  frente: string;
  fundo: string;
  /** Fundo translúcido aplicado sobre `fundo` antes da medição (ex.: marca-texto). */
  sobre?: string;
  alvo: number;
  uso: string;
}

export interface Medicao extends ParContraste {
  claro: number;
  escuro: number;
}

/** Extrai as variáveis `--nome: valor;` do primeiro bloco aberto por `seletor {`. */
export function blocoDeTokens(css: string, seletor: string): Tokens {
  const inicio = css.indexOf(`${seletor} {`);
  if (inicio < 0) throw new Error(`bloco "${seletor}" não encontrado em tokens.css`);
  const fim = css.indexOf("}", inicio);
  const tokens: Tokens = new Map();
  for (const m of css.slice(inicio, fim).matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)) tokens.set(m[1]!, m[2]!.trim());
  return tokens;
}

export function tokensDosTemas(css: string): Record<Tema, Tokens> {
  return { claro: blocoDeTokens(css, ":root"), escuro: blocoDeTokens(css, ':root[data-theme="dark"]') };
}

type Rgb = [number, number, number];

export function corParaRgb(valor: string, fundo?: Rgb): Rgb {
  const hex = /^#([0-9a-f]{6})$/i.exec(valor);
  if (hex) {
    const n = Number.parseInt(hex[1]!, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const rgba = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/i.exec(valor);
  if (rgba) {
    const cor: Rgb = [Number(rgba[1]), Number(rgba[2]), Number(rgba[3])];
    const alfa = rgba[4] === undefined ? 1 : Number(rgba[4]);
    if (alfa >= 1) return cor;
    if (!fundo) throw new Error(`cor translúcida sem fundo: ${valor}`);
    return cor.map((c, i) => c * alfa + fundo[i]! * (1 - alfa)) as Rgb;
  }
  throw new Error(`cor não suportada: ${valor}`);
}

export function luminancia([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function razaoContraste(a: Rgb, b: Rgb): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

const FUNDOS = [
  ["bg-canvas", "canvas"],
  ["bg-surface", "surface"],
  ["bg-elevated", "elevated"],
] as const;

const TEXTOS: { token: string; nome: string; alvo: number; uso: string }[] = [
  { token: "text-primary", nome: "Texto principal", alvo: 7, uso: "leitura longa (AAA)" },
  { token: "text-secondary", nome: "Texto secundário", alvo: 4.5, uso: "rótulos e metadados (AA)" },
  { token: "accent-primary-text", nome: "Sálvia (texto)", alvo: 4.5, uso: "links e destaques (AA)" },
  { token: "accent-secondary-text", nome: "Ardósia (texto)", alvo: 4.5, uso: "selos informativos (AA)" },
  { token: "status-warning-text", nome: "Âmbar (texto)", alvo: 4.5, uso: "alertas (AA)" },
  { token: "status-danger-text", nome: "Terracota (texto)", alvo: 4.5, uso: "erros (AA)" },
];

/** Pares medidos: textos em cada superfície, texto sobre cor de destaque, marca-texto e contornos de controles. */
export const PARES: ParContraste[] = [
  ...TEXTOS.flatMap((t) => FUNDOS.map(([fundo, nomeFundo]) => ({ rotulo: `${t.nome} / ${nomeFundo}`, frente: t.token, fundo, alvo: t.alvo, uso: t.uso }))),
  { rotulo: "Texto principal / marca-texto ocre", frente: "text-primary", fundo: "bg-canvas", sobre: "highlight-note", alvo: 7, uso: "trecho destacado no caderno (AAA)" },
  { rotulo: "Texto sobre sálvia (botão primário)", frente: "on-accent", fundo: "accent-primary", alvo: 4.5, uso: "rótulo de botão (AA)" },
  { rotulo: "Texto sobre terracota (marca de erro)", frente: "on-accent", fundo: "status-danger", alvo: 3, uso: "letra em círculo, negrito (AA texto grande)" },
  { rotulo: "Contorno de campo / canvas", frente: "border-field", fundo: "bg-canvas", alvo: 3, uso: "limite de campo, interruptor e checkbox (1.4.11)" },
  { rotulo: "Contorno de campo / surface", frente: "border-field", fundo: "bg-surface", alvo: 3, uso: "limite de campo, interruptor e checkbox (1.4.11)" },
  { rotulo: "Anel de foco sálvia / canvas", frente: "accent-primary", fundo: "bg-canvas", alvo: 3, uso: "indicador de foco (1.4.11)" },
];

/** Informativos (sem alvo obrigatório): o texto apagado é só para placeholder e estado desabilitado. */
export const PARES_INFORMATIVOS: ParContraste[] = FUNDOS.map(([fundo, nomeFundo]) => ({ rotulo: `Texto apagado / ${nomeFundo}`, frente: "text-muted", fundo, alvo: 0, uso: "placeholder e desabilitado (isento pela WCAG)" }));

function medirNoTema(par: ParContraste, tokens: Tokens): number {
  const valor = (nome: string) => {
    const v = tokens.get(nome);
    if (!v) throw new Error(`token --${nome} ausente`);
    return v;
  };
  let fundo = corParaRgb(valor(par.fundo));
  if (par.sobre) fundo = corParaRgb(valor(par.sobre), fundo);
  return razaoContraste(corParaRgb(valor(par.frente), fundo), fundo);
}

export function medir(css: string, pares: readonly ParContraste[] = PARES): Medicao[] {
  const temas = tokensDosTemas(css);
  return pares.map((p) => ({ ...p, claro: medirNoTema(p, temas.claro), escuro: medirNoTema(p, temas.escuro) }));
}

export function reprovados(medicoes: readonly Medicao[]): Medicao[] {
  return medicoes.filter((m) => m.alvo > 0 && (m.claro < m.alvo || m.escuro < m.alvo));
}
