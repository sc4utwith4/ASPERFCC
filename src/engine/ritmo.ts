import { PROVA } from "@/data/edital";
import { diferencaDias, somarDias, type Dia } from "./datas";
import { DIAS_ANTES_DA_PROVA, ESCADA_PADRAO } from "./srs";

export type StatusRitmo = "em-dia" | "apertado" | "inviavel" | "concluido";

export interface Ritmo {
  diasAteProva: number;
  /** Último dia para fechar uma bateria e ainda cumprir a escada inteira até D-3. */
  limiteEscadaCompleta: Dia;
  diasAteLimite: number;
  questoesRestantes: number;
  questoesPorDia: number;
  status: StatusRitmo;
}

/**
 * Quantas questões por dia são necessárias para fechar o 1º ciclo a tempo de
 * a etapa +30 acontecer até D-3 (15/12/2026 para a prova de 17/01/2027).
 */
export function calcularRitmo(diaAtual: Dia, questoesRestantes: number, dataProva: Dia = PROVA.dataProva, metaDiaria = 25): Ritmo {
  const ultimaEtapa = ESCADA_PADRAO.at(-1) ?? 30;
  const limiteEscadaCompleta = somarDias(dataProva, -(DIAS_ANTES_DA_PROVA + ultimaEtapa));
  const diasAteProva = Math.max(0, diferencaDias(diaAtual, dataProva));
  const diasAteLimite = Math.max(0, diferencaDias(diaAtual, limiteEscadaCompleta) + 1);
  if (questoesRestantes <= 0) {
    return { diasAteProva, limiteEscadaCompleta, diasAteLimite, questoesRestantes: 0, questoesPorDia: 0, status: "concluido" };
  }
  const base = diasAteLimite > 0 ? diasAteLimite : Math.max(1, diasAteProva - DIAS_ANTES_DA_PROVA);
  const questoesPorDia = Math.ceil(questoesRestantes / base);
  let status: StatusRitmo = "em-dia";
  if (diasAteLimite === 0 || questoesPorDia > metaDiaria * 2) status = "inviavel";
  else if (questoesPorDia > metaDiaria) status = "apertado";
  return { diasAteProva, limiteEscadaCompleta, diasAteLimite, questoesRestantes, questoesPorDia, status };
}
