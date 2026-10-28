import type { CasoDiscursivo } from "@/data/schema";
import type { AnaliseFolha } from "./linhas";
import { detectarPalavrasChave } from "./palavrasChave";

/**
 * Espelho de correção do estudo de caso (convenção de treino 70 + 30):
 *  - conteúdo: itens esperados em 3 pilares (fundamento, aplicação ao TCE-GO,
 *    conclusão), cada um "não abordado", "parcial" ou "completo";
 *  - língua: estrutura/adequação, coesão/progressão e norma-padrão, 0 a 10 cada.
 * A detecção de palavras-chave roda só no texto que cabe na folha, porque o
 * que passa do limite de linhas não é corrigido (item 11.14 do edital).
 */
export type NivelItem = 0 | 0.5 | 1;
export type Marcacoes = Record<string, NivelItem>;

export interface CriteriosLingua {
  estrutura: number;
  coesao: number;
  norma: number;
}

export function codificarMarcacoes(m: Marcacoes): string[] {
  return Object.entries(m).filter(([, n]) => n > 0).map(([id, n]) => `${id}:${n}`);
}

export function decodificarMarcacoes(lista: readonly string[]): Marcacoes {
  const m: Marcacoes = {};
  for (const s of lista) {
    const [id, n] = s.split(":");
    if (id && (n === "1" || n === "0.5")) m[id] = Number(n) as NivelItem;
  }
  return m;
}

export function notaConteudo(caso: CasoDiscursivo, marcacoes: Marcacoes): number {
  let total = 0;
  for (const pilar of caso.espelho.pilares) for (const item of pilar.itens) total += item.pontos * (marcacoes[item.id] ?? 0);
  return Math.round(total * 10) / 10;
}

export function notaPorPilar(caso: CasoDiscursivo, marcacoes: Marcacoes): { id: string; titulo: string; nota: number; maximo: number }[] {
  return caso.espelho.pilares.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    nota: Math.round(p.itens.reduce((s, it) => s + it.pontos * (marcacoes[it.id] ?? 0), 0) * 10) / 10,
    maximo: p.pontos,
  }));
}

export function notaLingua(c: CriteriosLingua): number {
  const lim = (n: number) => Math.min(10, Math.max(0, n));
  return lim(c.estrutura) + lim(c.coesao) + lim(c.norma);
}

export interface SugestaoItem {
  itemId: string;
  encontradas: string[];
  sugestao: NivelItem;
}

/** Sugestão por item: todas as palavras-chave → completo; alguma → parcial; nenhuma → não abordado. */
export function sugerirMarcacoes(caso: CasoDiscursivo, textoCorrigivel: string): SugestaoItem[] {
  return caso.espelho.pilares.flatMap((p) =>
    p.itens.map((item) => {
      const { encontradas } = detectarPalavrasChave(textoCorrigivel, item.palavrasChave);
      const fracao = encontradas.length / item.palavrasChave.length;
      const sugestao: NivelItem = encontradas.length === 0 ? 0 : fracao >= 0.6 ? 1 : 0.5;
      return { itemId: item.id, encontradas, sugestao };
    }),
  );
}

export interface Alerta {
  tom: "aviso" | "grave";
  texto: string;
}

export function alertasAutomaticos(analise: AnaliseFolha): Alerta[] {
  const alertas: Alerta[] = [];
  if (analise.palavras === 0) return [{ tom: "grave", texto: "Resposta em branco recebe nota zero (item 11.12, d)." }];
  if (analise.excedentes > 0) alertas.push({ tom: "grave", texto: `${analise.excedentes} linha(s) passam do limite de ${analise.limite}. Esse trecho é desconsiderado na correção (item 11.14).` });
  if (analise.total < Math.ceil(analise.limite * 0.5)) alertas.push({ tom: "aviso", texto: `Só ${analise.total} de ${analise.limite} linhas usadas: risco de abordagem parcial (item 11.10).` });
  if (analise.paragrafos < 3) alertas.push({ tom: "aviso", texto: "Menos de 3 parágrafos: a estrutura (introdução, desenvolvimento, conclusão) fica frágil." });
  return alertas;
}

export function notaFinal(conteudo: number, lingua: number, analise: AnaliseFolha): number {
  if (analise.palavras === 0) return 0;
  return Math.round(Math.min(100, conteudo + lingua) * 10) / 10;
}
