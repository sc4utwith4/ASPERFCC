import { MATERIAS, type MateriaSlug } from "@/data/edital";
import type { Questao } from "@/data/schema";
import { pesoDominio, type Resultado } from "./classificacao";
import { embaralhar, geradorDe } from "./rng";

/**
 * Ordem do 1º ciclo: embaralha e intercala subtópicos, para que qualquer
 * bloco diário (10, 15, 25) cubra temas variados.
 */
export function ordemInicial(questoes: readonly Questao[], seed: string): string[] {
  const aleatorio = geradorDe(`ordem:${seed}`);
  const grupos = new Map<string, Questao[]>();
  for (const q of embaralhar(questoes, aleatorio)) {
    const lista = grupos.get(q.subtopico) ?? [];
    lista.push(q);
    grupos.set(q.subtopico, lista);
  }
  const filas = embaralhar([...grupos.values()], aleatorio);
  const ordem: string[] = [];
  while (filas.some((f) => f.length)) {
    for (const fila of filas) {
      const q = fila.shift();
      if (q) ordem.push(q.id);
    }
  }
  return ordem;
}

/** Domínio médio por questão (todas as tentativas): erro = 0, frágil = 0,5, sólido = 1. Sem tentativa = 0,5. */
export function dominioPorQuestao(tentativas: readonly { questaoId: string; resultado: Resultado }[]): Map<string, number> {
  const soma = new Map<string, { s: number; n: number }>();
  for (const t of tentativas) {
    const atual = soma.get(t.questaoId) ?? { s: 0, n: 0 };
    atual.s += pesoDominio(t.resultado);
    atual.n++;
    soma.set(t.questaoId, atual);
  }
  return new Map([...soma].map(([id, { s, n }]) => [id, s / n]));
}

/**
 * Nova Bateria de Variantes: mesmo pool, ordem pelos itens de menor domínio
 * (desempate pelo seed). O app aplica enunciados rotacionados e, em parte das
 * questões, o Modo Mutação.
 */
export function ordemVariantes(questoes: readonly Questao[], dominio: ReadonlyMap<string, number>, seed: string): string[] {
  const aleatorio = geradorDe(`variantes:${seed}`);
  const desempate = new Map(questoes.map((q) => [q.id, aleatorio()]));
  return [...questoes]
    .sort((a, b) => (dominio.get(a.id) ?? 0.5) - (dominio.get(b.id) ?? 0.5) || desempate.get(a.id)! - desempate.get(b.id)!)
    .map((q) => q.id);
}

/** Proporção de questões que vão em Modo Mutação numa bateria de variantes. */
export const FRACAO_MUTACAO_VARIANTES = 0.3;

export function questoesEmMutacao(ordem: readonly string[], seed: string, fracao = FRACAO_MUTACAO_VARIANTES): Set<string> {
  const n = Math.round(ordem.length * fracao);
  return new Set(embaralhar(ordem, geradorDe(`mutacao:${seed}`)).slice(0, n));
}

/**
 * Simulado Prova Real: 70 questões na distribuição exata do edital, priorizando
 * as menos vistas. Retorna a ordem da prova (Gerais e depois Específicos).
 */
export function selecionarSimuladoProvaReal(questoesPorMateria: ReadonlyMap<MateriaSlug, readonly Questao[]>, exposicoes: ReadonlyMap<string, number>, seed: string): string[] {
  const ordem: string[] = [];
  for (const m of MATERIAS) {
    const pool = questoesPorMateria.get(m.slug) ?? [];
    const aleatorio = geradorDe(`simulado:${seed}:${m.slug}`);
    const escolhidas = embaralhar(pool, aleatorio)
      .sort((a, b) => (exposicoes.get(a.id) ?? 0) - (exposicoes.get(b.id) ?? 0))
      .slice(0, m.questoesNaProva);
    ordem.push(...escolhidas.map((q) => q.id));
  }
  return ordem;
}
