import { somarDias, type Dia } from "./datas";

/**
 * Repetição espaçada dos flashcards (SM-2 simplificado, 3 botões).
 * Como não há botão "Errei", "Difícil" é tratado como reaprendizado:
 * o card volta para amanhã e a facilidade cai.
 */
export type Avaliacao = "dificil" | "bom" | "facil";

export interface EstadoCard {
  facilidade: number;
  intervaloDias: number;
  vencimento: Dia;
  repeticoes: number;
  lapsos: number;
}

export const FACILIDADE_INICIAL = 2.5;
export const FACILIDADE_MINIMA = 1.3;
export const INTERVALO_MAXIMO = 60;

export function cardNovo(dia: Dia): EstadoCard {
  return { facilidade: FACILIDADE_INICIAL, intervaloDias: 0, vencimento: dia, repeticoes: 0, lapsos: 0 };
}

export function avaliarCard(estado: EstadoCard, avaliacao: Avaliacao, dia: Dia): EstadoCard {
  if (avaliacao === "dificil") {
    return {
      facilidade: Math.max(FACILIDADE_MINIMA, round2(estado.facilidade - 0.2)),
      intervaloDias: 1,
      vencimento: somarDias(dia, 1),
      repeticoes: 0,
      lapsos: estado.lapsos + 1,
    };
  }
  const repeticoes = estado.repeticoes + 1;
  let intervalo: number;
  let facilidade = estado.facilidade;
  if (avaliacao === "bom") {
    intervalo = repeticoes === 1 ? 1 : repeticoes === 2 ? 3 : Math.round(Math.max(1, estado.intervaloDias) * facilidade);
  } else {
    facilidade = round2(facilidade + 0.15);
    intervalo = repeticoes === 1 ? 3 : Math.round(Math.max(1, estado.intervaloDias) * facilidade * 1.3);
  }
  intervalo = Math.min(INTERVALO_MAXIMO, Math.max(1, intervalo));
  return { facilidade, intervaloDias: intervalo, vencimento: somarDias(dia, intervalo), repeticoes, lapsos: estado.lapsos };
}

export function proximosIntervalos(estado: EstadoCard, dia: Dia): Record<Avaliacao, number> {
  return {
    dificil: avaliarCard(estado, "dificil", dia).intervaloDias,
    bom: avaliarCard(estado, "bom", dia).intervaloDias,
    facil: avaliarCard(estado, "facil", dia).intervaloDias,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
