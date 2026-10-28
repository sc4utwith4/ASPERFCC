import { useLiveQuery } from "dexie-react-hooks";
import { MATERIAS, PROVA, type MateriaSlug } from "@/data/edital";
import { db } from "@/db/db";
import { dataDaProva, premissasGrupo, resumoDaMateria, type ResumoMateriaProgresso } from "@/db/servicos";
import { pesoDominio, type Resultado } from "@/engine/classificacao";
import { contar, PREMISSAS_PADRAO, type Contagem, type PremissasGrupo } from "@/engine/pontuacao";

export function useDataProva(): string {
  return useLiveQuery(() => dataDaProva(), []) ?? PROVA.dataProva;
}

export function usePremissas(): PremissasGrupo {
  return useLiveQuery(() => premissasGrupo(), []) ?? PREMISSAS_PADRAO;
}

export function useResumos(): Map<MateriaSlug, ResumoMateriaProgresso> | undefined {
  return useLiveQuery(async () => {
    const lista = await Promise.all(MATERIAS.map((m) => resumoDaMateria(m.slug)));
    return new Map(lista.map((r) => [r.materiaSlug, r]));
  }, []);
}

/** Tamanho do 1º ciclo da matéria: uma bateria de 50, ou mais se lotes extras entraram no banco. */
export function tamanhoCiclo1(r: ResumoMateriaProgresso | undefined): number {
  return Math.max(PROVA.questoesPorBateria, r?.totalQuestoes ?? 0);
}

/** Soma dos 1ºs ciclos das 14 matérias (700 com o banco padrão). */
export function totalCiclo1(resumos: Map<MateriaSlug, ResumoMateriaProgresso> | undefined): number {
  return MATERIAS.reduce((s, m) => s + tamanhoCiclo1(resumos?.get(m.slug)), 0);
}

/** Questões já respondidas no 1º ciclo, somadas nas 14 matérias. */
export function respondidasCiclo1(resumos: Map<MateriaSlug, ResumoMateriaProgresso> | undefined): number {
  return [...(resumos?.values() ?? [])].reduce((s, r) => s + Math.min(tamanhoCiclo1(r), r.respondidasCiclo1), 0);
}

export function contagemDoResumo(r: ResumoMateriaProgresso | undefined): Contagem {
  return contar([...(r?.ultimaPorQuestao.values() ?? [])]);
}

/** Taxa "líquida" por matéria (sólidos ÷ respondidas), só para matérias com ≥ 5 respondidas. */
export function taxasLiquidas(resumos: Map<MateriaSlug, ResumoMateriaProgresso> | undefined, minimo = 5): Map<MateriaSlug, number> {
  const taxas = new Map<MateriaSlug, number>();
  for (const [slug, r] of resumos ?? []) {
    const resultados: Resultado[] = [...r.ultimaPorQuestao.values()];
    if (resultados.length < minimo) continue;
    taxas.set(slug, resultados.filter((x) => x === "ACERTO_SOLIDO").length / resultados.length);
  }
  return taxas;
}

export function dominioMedio(resultados: readonly Resultado[]): number {
  return resultados.length ? resultados.reduce((s, r) => s + pesoDominio(r), 0) / resultados.length : 0;
}

export function useContagemQuestoes(): Map<MateriaSlug, number> | undefined {
  return useLiveQuery(async () => {
    const mapa = new Map<MateriaSlug, number>();
    for (const m of MATERIAS) mapa.set(m.slug, await db.questoes.where("materiaSlug").equals(m.slug).count());
    return mapa;
  }, []);
}
