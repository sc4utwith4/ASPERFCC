import { MATERIAS, PROVA, getMateria, type MateriaSlug } from "@/data/edital";
import type { Resultado } from "./classificacao";

/**
 * Pontuação no modelo FCC (Edital 01/2026, Capítulo 9):
 *   NP = 50 + 10 × (acertos − média do grupo) / σ do grupo, por prova;
 *   nota objetiva = NP_gerais × 1 + NP_específicos × 2; habilita com ≥ 150.
 * Média e σ do grupo só são conhecidos depois da prova, então a projeção usa
 * premissas configuráveis (e diz isso na interface).
 */
export interface Contagem {
  total: number;
  solidos: number;
  frageis: number;
  erros: number;
  errosConvictos: number;
}

export function contar(resultados: readonly Resultado[]): Contagem {
  const c: Contagem = { total: resultados.length, solidos: 0, frageis: 0, erros: 0, errosConvictos: 0 };
  for (const r of resultados) {
    if (r === "ACERTO_SOLIDO") c.solidos++;
    else if (r === "ACERTO_FRAGIL") c.frageis++;
    else if (r === "ERRO_CONVICTO") c.errosConvictos++;
    else c.erros++;
  }
  return c;
}

/** Acertos (sólidos + frágeis) ÷ total. */
export function percentualBruto(c: Contagem): number {
  return c.total ? (c.solidos + c.frageis) / c.total : 0;
}

/** Só acertos sólidos ÷ total: desconta o que veio de chute ou dúvida. */
export function percentualLiquido(c: Contagem): number {
  return c.total ? c.solidos / c.total : 0;
}

export interface PremissasGrupo {
  mediaGerais: number;
  sigmaGerais: number;
  mediaEspecificos: number;
  sigmaEspecificos: number;
}

/** Premissas ilustrativas (≈56% e ≈53% de acerto médio do grupo). Editáveis em Configurações. */
export const PREMISSAS_PADRAO: PremissasGrupo = {
  mediaGerais: 14,
  sigmaGerais: 3.5,
  mediaEspecificos: 24,
  sigmaEspecificos: 6.5,
};

export function notaPadronizada(acertos: number, media: number, sigma: number): number {
  return 50 + (10 * (acertos - media)) / (sigma > 0 ? sigma : 1);
}

export interface ProjecaoMateria {
  materiaSlug: MateriaSlug;
  questoesNaProva: number;
  peso: number;
  acertosEsperados: number;
  pontosBrutos: number;
  pontosBrutosMaximos: number;
  /** Quanto 1 acerto a mais nesta matéria vale na nota padronizada ponderada. */
  valorPorAcerto: number;
}

export function projetarMateria(slug: MateriaSlug, taxa: number, premissas: PremissasGrupo = PREMISSAS_PADRAO): ProjecaoMateria {
  const m = getMateria(slug);
  const acertosEsperados = m.questoesNaProva * clamp01(taxa);
  const sigma = m.bloco === "gerais" ? premissas.sigmaGerais : premissas.sigmaEspecificos;
  return {
    materiaSlug: slug,
    questoesNaProva: m.questoesNaProva,
    peso: m.peso,
    acertosEsperados,
    pontosBrutos: acertosEsperados * m.peso,
    pontosBrutosMaximos: m.questoesNaProva * m.peso,
    valorPorAcerto: (10 * m.peso) / (sigma > 0 ? sigma : 1),
  };
}

export interface ProjecaoProva {
  acertosGerais: number;
  acertosEspecificos: number;
  npGerais: number;
  npEspecificos: number;
  notaObjetiva: number;
  habilitado: boolean;
  pontosBrutos: number;
  pontosBrutosMaximos: number;
  materiasSemDados: MateriaSlug[];
}

/**
 * Projeta a prova inteira a partir da taxa de acerto por matéria. Matérias sem
 * dados usam `taxaPadrao` (por padrão, a média ponderada das que têm dados).
 */
export function projetarProva(taxas: ReadonlyMap<MateriaSlug, number>, premissas: PremissasGrupo = PREMISSAS_PADRAO, taxaPadrao?: number): ProjecaoProva {
  const conhecidas = MATERIAS.filter((m) => taxas.has(m.slug));
  const pesoConhecido = conhecidas.reduce((s, m) => s + m.questoesNaProva, 0);
  const media = pesoConhecido ? conhecidas.reduce((s, m) => s + (taxas.get(m.slug) ?? 0) * m.questoesNaProva, 0) / pesoConhecido : 0;
  const padrao = taxaPadrao ?? media;
  let acertosGerais = 0;
  let acertosEspecificos = 0;
  let pontosBrutos = 0;
  const materiasSemDados: MateriaSlug[] = [];
  for (const m of MATERIAS) {
    const taxa = taxas.get(m.slug);
    if (taxa === undefined) materiasSemDados.push(m.slug);
    const acertos = m.questoesNaProva * clamp01(taxa ?? padrao);
    if (m.bloco === "gerais") acertosGerais += acertos;
    else acertosEspecificos += acertos;
    pontosBrutos += acertos * m.peso;
  }
  const npGerais = notaPadronizada(acertosGerais, premissas.mediaGerais, premissas.sigmaGerais);
  const npEspecificos = notaPadronizada(acertosEspecificos, premissas.mediaEspecificos, premissas.sigmaEspecificos);
  const notaObjetiva = npGerais * PROVA.pesoGerais + npEspecificos * PROVA.pesoEspecificos;
  return {
    acertosGerais,
    acertosEspecificos,
    npGerais,
    npEspecificos,
    notaObjetiva,
    habilitado: notaObjetiva >= PROVA.corteObjetiva,
    pontosBrutos,
    pontosBrutosMaximos: MATERIAS.reduce((s, m) => s + m.questoesNaProva * m.peso, 0),
    materiasSemDados,
  };
}

/** Valor de 1 acerto em cada prova na nota final ponderada e a razão específica/geral. */
export function valorMarginal(premissas: PremissasGrupo = PREMISSAS_PADRAO): { geral: number; especifica: number; razao: number } {
  const geral = (10 * PROVA.pesoGerais) / premissas.sigmaGerais;
  const especifica = (10 * PROVA.pesoEspecificos) / premissas.sigmaEspecificos;
  return { geral, especifica, razao: especifica / geral };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function formatarPercentual(fracao: number, casas = 0): string {
  return `${(fracao * 100).toFixed(casas).replace(".", ",")}%`;
}

export function formatarNumero(n: number, casas = 1): string {
  return n.toFixed(casas).replace(".", ",");
}
