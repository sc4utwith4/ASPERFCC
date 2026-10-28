import Dexie, { type EntityTable } from "dexie";
import type { JSONContent } from "@tiptap/react";
import type { MateriaSlug } from "@/data/edital";
import type { AlternativaId, Procedencia, Questao } from "@/data/schema";
import type { Letra } from "@/engine/alternativas";
import type { Confianca, Resultado } from "@/engine/classificacao";
import type { Dia } from "@/engine/datas";
import type { EstadoCard } from "@/engine/flashcardSrs";
import type { SubModoMutacao } from "@/engine/mutacao";
import type { PacoteRevisao } from "@/engine/srs";

export type QuestaoRegistro = Questao & {
  procedencia: Procedencia;
  loteChave: string;
};

export interface LoteRegistro {
  chave: string;
  materiaSlug: MateriaSlug;
  lote: number;
  origem: "embutido" | "importado";
  hash: string;
  quantidade: number;
  atualizadoEm: number;
  nomeArquivo?: string;
}

export type TipoBateria = "ciclo" | "variantes" | "simulado-materia" | "simulado-prova-real";

export interface Bateria {
  id: string;
  tipo: TipoBateria;
  /** Matéria da bateria; "prova-real" no simulado completo. */
  materiaSlug: MateriaSlug | "prova-real";
  ciclo: number;
  questaoIds: string[];
  /** Questões exibidas em Modo Mutação (baterias de variantes). */
  mutacao: string[];
  seed: string;
  tamanhoBloco: number;
  criadaEm: number;
  dia: Dia;
  concluidaEm?: number;
  diaConclusao?: Dia;
  /** Simulado: limite de tempo e controle do relógio. */
  limiteMs?: number;
  iniciadaEm?: number;
  encerradaEm?: number;
}

export type ContextoTentativa = "estudo" | "variantes" | "revisao" | "simulado";

export interface Tentativa {
  id?: number;
  questaoId: string;
  materiaSlug: MateriaSlug;
  bateriaId?: string;
  pacoteId?: string;
  contexto: ContextoTentativa;
  modo: "padrao" | SubModoMutacao;
  sessaoId: string;
  varianteIdx: number;
  ordem: AlternativaId[];
  letraCorreta: Letra;
  escolhidaId?: AlternativaId;
  riscadas: AlternativaId[];
  confianca: Confianca;
  acertou: boolean;
  resultado: Resultado;
  tempoMs: number;
  dia: Dia;
  respondidaEm: number;
  justificativa?: string;
}

export interface Debrief {
  id: string;
  materiaSlug: MateriaSlug;
  bateriaId: string;
  dia: Dia;
  criadoEm: number;
  tentativaIds: number[];
  resumoOuro: string;
  conclusaoCornell: string;
  consolidadoEm?: number;
  pacoteId?: string;
}

export type PacoteRegistro = PacoteRevisao;

export interface Flashcard {
  id: string;
  origem: "questao" | "nota";
  refId: string;
  materiaSlug: MateriaSlug;
  frente: string;
  verso: string;
  estado: EstadoCard;
  criadoEm: number;
}

export interface Nota {
  id: string;
  materiaSlug: MateriaSlug;
  titulo: string;
  subtopico?: string;
  pistas: { pergunta: string; resposta: string }[];
  conteudo: JSONContent;
  sintese: string;
  exemplo: boolean;
  criadoEm: number;
  atualizadoEm: number;
}

export interface NotasLingua {
  estrutura: number;
  coesao: number;
  norma: number;
}

export interface RespostaDiscursiva {
  id: string;
  casoId: string;
  texto: string;
  iniciadaEm: number;
  finalizadaEm?: number;
  tempoMs: number;
  caracteresPorLinha: number;
  itensMarcados: string[];
  lingua?: NotasLingua;
  notaConteudo?: number;
  notaTotal?: number;
  status: "rascunho" | "corrigida";
}

export interface TarefaBacklog {
  id: string;
  titulo: string;
  feita: boolean;
  ordem: number;
  subtarefas: { id: string; titulo: string; feita: boolean }[];
  criadoEm: number;
  exemplo?: boolean;
}

export interface CapturaBrainDump {
  id: string;
  texto: string;
  criadoEm: number;
  resolvida: boolean;
  exemplo?: boolean;
}

export interface SessaoFoco {
  id?: number;
  dia: Dia;
  inicio: number;
  fim: number;
  duracaoMs: number;
  modo: "pomodoro" | "flowtime";
  materiaSlug?: MateriaSlug;
}

export interface ReporteErro {
  id: string;
  questaoId: string;
  texto: string;
  criadoEm: number;
}

export interface ConfigItem {
  chave: string;
  valor: unknown;
}

export class BancoLocal extends Dexie {
  questoes!: EntityTable<QuestaoRegistro, "id">;
  lotes!: EntityTable<LoteRegistro, "chave">;
  baterias!: EntityTable<Bateria, "id">;
  tentativas!: EntityTable<Tentativa, "id">;
  debriefs!: EntityTable<Debrief, "id">;
  pacotes!: EntityTable<PacoteRegistro, "id">;
  flashcards!: EntityTable<Flashcard, "id">;
  notas!: EntityTable<Nota, "id">;
  discursivas!: EntityTable<RespostaDiscursiva, "id">;
  backlog!: EntityTable<TarefaBacklog, "id">;
  brainDump!: EntityTable<CapturaBrainDump, "id">;
  sessoesFoco!: EntityTable<SessaoFoco, "id">;
  reportes!: EntityTable<ReporteErro, "id">;
  config!: EntityTable<ConfigItem, "chave">;

  constructor(nome = "asperfcc") {
    super(nome);
    this.version(1).stores({
      questoes: "id, materiaSlug, subtopico, loteChave, procedencia",
      lotes: "chave, materiaSlug, origem",
      baterias: "id, materiaSlug, tipo, dia, concluidaEm",
      tentativas: "++id, questaoId, materiaSlug, bateriaId, pacoteId, dia, resultado, contexto, [materiaSlug+dia]",
      debriefs: "id, materiaSlug, dia, bateriaId",
      pacotes: "id, materiaSlug, criadoEm",
      flashcards: "id, materiaSlug, origem, refId, estado.vencimento",
      notas: "id, materiaSlug, atualizadoEm",
      discursivas: "id, casoId, status, iniciadaEm",
      backlog: "id, ordem",
      brainDump: "id, criadoEm",
      sessoesFoco: "++id, dia, inicio",
      reportes: "id, questaoId",
      config: "chave",
    });
    this.version(2).stores({
      tentativas: "++id, questaoId, materiaSlug, bateriaId, pacoteId, dia, resultado, contexto, respondidaEm, [materiaSlug+dia]",
      reportes: "id, questaoId, criadoEm",
    });
  }
}

export const db = new BancoLocal();

export async function lerConfig<T>(chave: string, padrao: T): Promise<T> {
  const item = await db.config.get(chave);
  return item === undefined ? padrao : (item.valor as T);
}

export async function gravarConfig(chave: string, valor: unknown): Promise<void> {
  await db.config.put({ chave, valor });
}
