import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { isMateriaSlug, type MateriaSlug } from "../../src/data/edital";
import type { EntradaLote } from "../../src/data/validacao";

export const RAIZ = process.cwd();
export const DIR_DADOS = join(RAIZ, "src", "data");
export const DIR_QUESTOES = join(DIR_DADOS, "questions");
export const DIR_TEXTOS = join(DIR_DADOS, "textos");
export const DIR_NOTAS = join(DIR_DADOS, "notas-exemplo");
export const DIR_CASOS = join(DIR_DADOS, "casos");

export function lerJson(arquivo: string): unknown {
  const bruto = readFileSync(arquivo, "utf8");
  try {
    return JSON.parse(bruto);
  } catch (e) {
    throw new Error(`JSON inválido em ${relativo(arquivo)}: ${(e as Error).message}`);
  }
}

export function relativo(arquivo: string): string {
  return arquivo.startsWith(RAIZ) ? arquivo.slice(RAIZ.length + 1) : arquivo;
}

export function listarJson(dir: string, filtro: RegExp = /\.json$/): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => filtro.test(f))
    .sort()
    .map((f) => join(dir, f));
}

export function pastasDeMaterias(): MateriaSlug[] {
  if (!existsSync(DIR_QUESTOES)) return [];
  return readdirSync(DIR_QUESTOES)
    .filter((d) => statSync(join(DIR_QUESTOES, d)).isDirectory())
    .filter(isMateriaSlug)
    .sort();
}

export function carregarEntradasLotes(materias?: readonly MateriaSlug[]): EntradaLote[] {
  const alvo = materias ?? pastasDeMaterias();
  const entradas: EntradaLote[] = [];
  for (const slug of alvo) {
    for (const arquivo of listarJson(join(DIR_QUESTOES, slug), /^lote-\d{2}\.json$/)) {
      entradas.push({ arquivo: relativo(arquivo), materiaEsperada: slug, conteudo: lerJson(arquivo) });
    }
  }
  return entradas;
}
