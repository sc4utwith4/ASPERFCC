import type { Questao } from "@/data/schema";

export interface EnunciadoEscolhido {
  texto: string;
  /** -1 = enunciado base; 0..n = índice em variantesEnunciado. */
  varianteIdx: number;
}

/**
 * Rotação de contexto: a primeira exposição usa o enunciado base; cada nova
 * exposição (revisão, nova bateria) usa a próxima variante, em rodízio.
 */
export function escolherEnunciado(q: Questao, exposicoesAnteriores: number): EnunciadoEscolhido {
  if (exposicoesAnteriores <= 0 || q.variantesEnunciado.length === 0) {
    return { texto: q.enunciadoBase, varianteIdx: -1 };
  }
  const idx = (exposicoesAnteriores - 1) % q.variantesEnunciado.length;
  return { texto: q.variantesEnunciado[idx]!, varianteIdx: idx };
}

export function textoDoEnunciado(q: Questao, varianteIdx: number): string {
  return varianteIdx < 0 ? q.enunciadoBase : (q.variantesEnunciado[varianteIdx] ?? q.enunciadoBase);
}

export const NUMERAIS_ROMANOS = ["I", "II", "III", "IV", "V"] as const;
