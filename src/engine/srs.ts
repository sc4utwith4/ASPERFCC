import type { Resultado } from "./classificacao";
import { diferencaDias, somarDias, type Dia } from "./datas";

/**
 * Pacote de Revisão Inteligente.
 *
 * O calendário segue a escada do spec (+1, +3, +7, +15, +30 dias a partir da
 * consolidação), mas os itens são adaptativos:
 *  - 2 acertos sólidos seguidos em revisão → item graduado (sai das próximas etapas);
 *  - 2 ou mais erros em revisão → item "crítico" (continua e ganha destaque);
 *  - etapa feita com atraso → as seguintes são reancoradas na data real, preservando os intervalos;
 *  - etapa que cairia depois de D-3 da prova vira a revisão final em D-3 e as demais são descartadas.
 */
export const ESCADA_PADRAO: readonly number[] = [1, 3, 7, 15, 30];
export const DIAS_ANTES_DA_PROVA = 3;
export const SOLIDOS_PARA_GRADUAR = 2;
export const REINCIDENCIAS_PARA_CRITICO = 2;

export type ModoRevisao = "erros-frageis" | "flashcards" | "simulado";
export type EstadoItem = "ativo" | "graduado" | "critico";

export interface RegistroRevisao {
  dia: Dia;
  etapa: number;
  resultado: Resultado;
}

export interface ItemPacote {
  questaoId: string;
  /** Resultado que colocou o item no pacote (no dia da consolidação). */
  origem: Resultado;
  estado: EstadoItem;
  solidosSeguidos: number;
  reincidencias: number;
  historico: RegistroRevisao[];
}

export interface EtapaPacote {
  indice: number;
  offsetDias: number;
  dataPrevista: Dia;
  concluidaEm?: Dia;
  modo?: ModoRevisao;
  /** Etapa antecipada para D-3 (revisão final antes da prova). */
  final?: boolean;
}

export interface PacoteRevisao {
  id: string;
  materiaSlug: string;
  bateriaId: string;
  debriefId: string;
  criadoEm: Dia;
  dataProva: Dia;
  escada: number[];
  /** Todas as questões da bateria encerrada (para o modo Simulado). */
  questoesDaBateria: string[];
  itens: ItemPacote[];
  etapas: EtapaPacote[];
}

export interface NovoPacote {
  id: string;
  materiaSlug: string;
  bateriaId: string;
  debriefId: string;
  dia: Dia;
  dataProva: Dia;
  questoesDaBateria: string[];
  itens: { questaoId: string; resultado: Resultado }[];
  escada?: readonly number[];
}

export function criarPacote(p: NovoPacote): PacoteRevisao {
  const escada = [...(p.escada ?? ESCADA_PADRAO)];
  const pendentes = escada.map((offsetDias, indice) => ({ indice, offsetDias, dataPrevista: somarDias(p.dia, offsetDias) }));
  let etapas = ajustarAProva(pendentes, p.dataProva, p.dia);
  if (etapas.length === 0) {
    // Pacote criado na reta final: uma única revisão no dia seguinte, se ainda antes da prova.
    const amanha = somarDias(p.dia, 1);
    if (amanha < p.dataProva) etapas = [{ indice: 0, offsetDias: 1, dataPrevista: amanha, final: true }];
  }
  return {
    id: p.id,
    materiaSlug: p.materiaSlug,
    bateriaId: p.bateriaId,
    debriefId: p.debriefId,
    criadoEm: p.dia,
    dataProva: p.dataProva,
    escada,
    questoesDaBateria: p.questoesDaBateria,
    itens: p.itens.map((i) => ({ questaoId: i.questaoId, origem: i.resultado, estado: "ativo", solidosSeguidos: 0, reincidencias: 0, historico: [] })),
    etapas,
  };
}

/**
 * Mantém as etapas pendentes que caem até D-3. A primeira que passaria disso
 * vira a revisão final em D-3 (se ainda houver espaço depois da âncora); as
 * demais são descartadas.
 */
export function ajustarAProva(pendentes: readonly EtapaPacote[], dataProva: Dia, ancora: Dia): EtapaPacote[] {
  const limite = somarDias(dataProva, -DIAS_ANTES_DA_PROVA);
  const resultado: EtapaPacote[] = [];
  for (const etapa of pendentes) {
    if (etapa.dataPrevista <= limite) {
      resultado.push(etapa);
      continue;
    }
    const ultima = resultado.at(-1)?.dataPrevista ?? ancora;
    if (ultima < limite) resultado.push({ ...etapa, dataPrevista: limite, final: true });
    break;
  }
  return resultado;
}

export function etapaAtual(p: PacoteRevisao): EtapaPacote | undefined {
  return p.etapas.find((e) => !e.concluidaEm);
}

export function itensParaRevisar(p: PacoteRevisao): ItemPacote[] {
  return p.itens.filter((i) => i.estado !== "graduado");
}

export function pacoteConcluido(p: PacoteRevisao): boolean {
  return !etapaAtual(p) || itensParaRevisar(p).length === 0;
}

export function pacoteVencido(p: PacoteRevisao, dia: Dia): boolean {
  const etapa = etapaAtual(p);
  return !!etapa && itensParaRevisar(p).length > 0 && etapa.dataPrevista <= dia;
}

export function diasDeAtraso(p: PacoteRevisao, dia: Dia): number {
  const etapa = etapaAtual(p);
  if (!etapa) return 0;
  return Math.max(0, diferencaDias(etapa.dataPrevista, dia));
}

export function registrarResultadoItem(p: PacoteRevisao, questaoId: string, resultado: Resultado, dia: Dia): PacoteRevisao {
  const indice = etapaAtual(p)?.indice ?? p.escada.length;
  return {
    ...p,
    itens: p.itens.map((item) => (item.questaoId === questaoId ? atualizarItem(item, resultado, dia, indice) : item)),
  };
}

export function atualizarItem(item: ItemPacote, resultado: Resultado, dia: Dia, etapa: number): ItemPacote {
  const historico = [...item.historico, { dia, etapa, resultado }];
  if (resultado === "ACERTO_SOLIDO") {
    const solidosSeguidos = item.solidosSeguidos + 1;
    return { ...item, historico, solidosSeguidos, estado: solidosSeguidos >= SOLIDOS_PARA_GRADUAR ? "graduado" : item.estado };
  }
  if (resultado === "ACERTO_FRAGIL") return { ...item, historico, solidosSeguidos: 0 };
  const reincidencias = item.reincidencias + 1;
  return {
    ...item,
    historico,
    solidosSeguidos: 0,
    reincidencias,
    estado: reincidencias >= REINCIDENCIAS_PARA_CRITICO ? "critico" : item.estado === "graduado" ? "ativo" : item.estado,
  };
}

/**
 * Conclui a etapa atual em `dia`. As etapas seguintes são recalculadas a partir
 * da data real (mesmos intervalos da escada) e ajustadas à data da prova.
 */
export function concluirEtapa(p: PacoteRevisao, dia: Dia, modo: ModoRevisao): PacoteRevisao {
  const atual = etapaAtual(p);
  if (!atual) return p;
  const concluidas = [...p.etapas.filter((e) => e.concluidaEm), { ...atual, concluidaEm: dia, modo }];
  if (atual.final) return { ...p, etapas: concluidas };
  const pendentes = p.escada.slice(atual.indice + 1).map((offsetDias, k) => ({
    indice: atual.indice + 1 + k,
    offsetDias,
    dataPrevista: somarDias(dia, offsetDias - atual.offsetDias),
  }));
  return { ...p, etapas: [...concluidas, ...ajustarAProva(pendentes, p.dataProva, dia)] };
}

export function retencao(p: PacoteRevisao): { revisados: number; solidos: number } {
  let revisados = 0;
  let solidos = 0;
  for (const item of p.itens) {
    for (const r of item.historico) {
      revisados++;
      if (r.resultado === "ACERTO_SOLIDO") solidos++;
    }
  }
  return { revisados, solidos };
}
