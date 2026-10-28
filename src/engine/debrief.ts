import type { Questao } from "@/data/schema";
import { ehAcerto, pesoDominio, prioridadeRevisao, type Resultado } from "./classificacao";

export const LIMIAR_DOMINADO = 0.85;
export const LIMIAR_CRITICO = 0.7;
export const AMOSTRA_MINIMA = 3;

export type ClasseSubtopico = "dominado" | "intermediario" | "critico" | "insuficiente";

export interface TentativaParaAnalise {
  questaoId: string;
  resultado: Resultado;
}

export interface EstatisticaSubtopico {
  subtopico: string;
  n: number;
  acertos: number;
  /** (sólidos + 0,5 × frágeis) ÷ n */
  dominio: number;
  classe: ClasseSubtopico;
}

/** Domínio por subtópico com a última tentativa de cada questão. Só classifica com n ≥ 3. */
export function estatisticasPorSubtopico(questoes: ReadonlyMap<string, Questao>, tentativas: readonly TentativaParaAnalise[], subtopicosDaMateria: readonly string[]): EstatisticaSubtopico[] {
  const ultima = new Map<string, Resultado>();
  for (const t of tentativas) ultima.set(t.questaoId, t.resultado);
  const grupos = new Map<string, Resultado[]>();
  for (const [questaoId, resultado] of ultima) {
    const q = questoes.get(questaoId);
    if (!q) continue;
    const lista = grupos.get(q.subtopico) ?? [];
    lista.push(resultado);
    grupos.set(q.subtopico, lista);
  }
  return subtopicosDaMateria.map((subtopico) => {
    const lista = grupos.get(subtopico) ?? [];
    const n = lista.length;
    const dominio = n ? lista.reduce((s, r) => s + pesoDominio(r), 0) / n : 0;
    let classe: ClasseSubtopico = "insuficiente";
    if (n >= AMOSTRA_MINIMA) classe = dominio > LIMIAR_DOMINADO ? "dominado" : dominio < LIMIAR_CRITICO ? "critico" : "intermediario";
    return { subtopico, n, acertos: lista.filter(ehAcerto).length, dominio, classe };
  });
}

export interface ItemDossie {
  questaoId: string;
  subtopico: string;
  resultado: Resultado;
  pegadinha: string;
}

/** Pegadinhas FCC das questões erradas ou com dúvida, da mais grave para a menos grave. */
export function dossieDePegadinhas(questoes: ReadonlyMap<string, Questao>, tentativas: readonly TentativaParaAnalise[]): ItemDossie[] {
  const vistos = new Set<string>();
  const itens: ItemDossie[] = [];
  for (const t of [...tentativas].reverse()) {
    if (t.resultado === "ACERTO_SOLIDO" || vistos.has(t.questaoId)) continue;
    const q = questoes.get(t.questaoId);
    if (!q) continue;
    vistos.add(t.questaoId);
    itens.push({ questaoId: q.id, subtopico: q.subtopico, resultado: t.resultado, pegadinha: q.pegadinhaFCC });
  }
  return itens.sort((a, b) => prioridadeRevisao(b.resultado) - prioridadeRevisao(a.resultado));
}

export interface BulletOuro {
  conceito: string;
  texto: string;
  ocorrencias: number;
  questoes: string[];
  pior: Resultado;
}

/**
 * Resumo de Ouro: agrupa as questões erradas/frágeis pelos conceitos-chave e
 * usa a resposta do flashcard como bullet. Conceitos mais recorrentes e com
 * erros mais graves vêm primeiro.
 */
export function resumoDeOuro(questoes: ReadonlyMap<string, Questao>, tentativas: readonly TentativaParaAnalise[], limite = 8): BulletOuro[] {
  const porConceito = new Map<string, BulletOuro>();
  for (const item of dossieDePegadinhas(questoes, tentativas)) {
    const q = questoes.get(item.questaoId);
    if (!q) continue;
    for (const conceito of q.conceitosChave) {
      const atual = porConceito.get(conceito);
      if (atual) {
        atual.ocorrencias++;
        atual.questoes.push(q.id);
        if (prioridadeRevisao(item.resultado) > prioridadeRevisao(atual.pior)) atual.pior = item.resultado;
      } else {
        porConceito.set(conceito, { conceito, texto: q.resumoFlashcard.resposta, ocorrencias: 1, questoes: [q.id], pior: item.resultado });
      }
    }
  }
  return [...porConceito.values()]
    .sort((a, b) => b.ocorrencias - a.ocorrencias || prioridadeRevisao(b.pior) - prioridadeRevisao(a.pior))
    .slice(0, limite);
}

export function textoResumoDeOuro(bullets: readonly BulletOuro[]): string {
  return bullets.map((b) => `• ${b.conceito}: ${b.texto}`).join("\n");
}
