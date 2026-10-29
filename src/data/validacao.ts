import { getMateria, MATERIAS, PROVA, type MateriaSlug } from "./edital";
import {
  CasoDiscursivoSchema,
  LoteSchema,
  NotaExemploSchema,
  TextosArquivoSchema,
  chaveExata,
  normalizar,
  type Lote,
  type Questao,
} from "./schema";

export type Severidade = "erro" | "aviso";

export interface Problema {
  severidade: Severidade;
  local: string;
  mensagem: string;
}

export interface ResumoMateria {
  materiaSlug: MateriaSlug;
  total: number;
  porSubtopico: Record<string, number>;
  porNivel: Record<string, number>;
  porFormato: Record<string, number>;
  /** Questões em que o tamanho da alternativa é escolha do autor (ver `entraNaMetricaDeTamanho`). */
  elegiveisTamanho: number;
  corretaMaisLonga: number;
  comSelo: number;
}

export interface EntradaLote {
  arquivo: string;
  /** Pasta de origem (slug esperado), quando conhecida. */
  materiaEsperada?: MateriaSlug;
  conteudo: unknown;
}

export interface OpcoesValidacao {
  /** Exige ao menos 50 questões por matéria e cobertura mínima de subtópicos. */
  exigirCompleto: boolean;
  /** Ids de textos de apoio existentes, por matéria. */
  textosPorMateria?: Map<MateriaSlug, Set<string>>;
  /** Restringe o relatório a estas matérias. */
  materias?: readonly MateriaSlug[];
}

const POSICIONAL_CI = /(todas as (alternativas|anteriores|op[cç][oõ]es)|nenhuma das (alternativas|anteriores|op[cç][oõ]es)|as duas anteriores|item anterior|op[cç][aã]o anterior)/i;
const POSICIONAL_LETRA = /\b(?:[Aa]lternativas?|[Ll]etras?|[Oo]p[cç][aã]o)\s+\(?[A-E]\)?(?![A-Za-zÀ-ú])/;
const ROMANOS = /\b(I|II|III|IV|V)\b/;
const ROMANOS_GLOBAL = /\b(IV|V|I{1,3})\b/g;
const INDICE_ROMANO: Record<string, number> = { I: 0, II: 1, III: 2, IV: 3, V: 4 };
/** Comandos que pedem as afirmativas erradas ("Está incorreto o que se afirma em"). */
const PEDE_FALSAS = /\b(incorret|fals|errad)/i;

const ALVO_NIVEL: Record<string, number> = { "Básico": 0.2, "Intermediário": 0.5, "Avançado": 0.3 };

export function validarLotes(entradas: readonly EntradaLote[], opcoes: OpcoesValidacao): { problemas: Problema[]; resumos: ResumoMateria[]; questoes: Questao[] } {
  const problemas: Problema[] = [];
  const questoes: Questao[] = [];
  const idsVistos = new Map<string, string>();
  const materiasFiltro = opcoes.materias ? new Set(opcoes.materias) : null;

  for (const entrada of entradas) {
    const parsed = LoteSchema.safeParse(entrada.conteudo);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        problemas.push({ severidade: "erro", local: `${entrada.arquivo} → ${formatarCaminho(issue.path)}`, mensagem: issue.message });
      }
      continue;
    }
    const lote: Lote = parsed.data;
    if (materiasFiltro && !materiasFiltro.has(lote.materiaSlug)) continue;
    if (entrada.materiaEsperada && entrada.materiaEsperada !== lote.materiaSlug) {
      problemas.push({ severidade: "erro", local: entrada.arquivo, mensagem: `materiaSlug do lote (${lote.materiaSlug}) difere da pasta (${entrada.materiaEsperada})` });
    }
    lote.questoes.forEach((q, i) => {
      const local = `${entrada.arquivo} → questoes[${i}] (${q.id})`;
      problemas.push(...validarQuestaoNoContexto(q, lote, local, opcoes));
      const anterior = idsVistos.get(q.id);
      if (anterior) {
        problemas.push({ severidade: "erro", local, mensagem: `id duplicado (também em ${anterior})` });
      } else {
        idsVistos.set(q.id, entrada.arquivo);
      }
      questoes.push(q);
    });
  }

  const resumos: ResumoMateria[] = [];
  for (const materia of MATERIAS) {
    if (materiasFiltro && !materiasFiltro.has(materia.slug)) continue;
    const doMateria = questoes.filter((q) => q.materiaSlug === materia.slug);
    const resumo = resumir(materia.slug, doMateria);
    resumos.push(resumo);
    problemas.push(...validarConjuntoMateria(materia.slug, doMateria, resumo, opcoes));
  }

  return { problemas, resumos, questoes };
}

export function validarQuestaoNoContexto(q: Questao, lote: Pick<Lote, "materiaSlug" | "lote">, local: string, opcoes: Pick<OpcoesValidacao, "textosPorMateria">): Problema[] {
  const problemas: Problema[] = [];
  const erro = (mensagem: string) => problemas.push({ severidade: "erro", local, mensagem });
  const aviso = (mensagem: string) => problemas.push({ severidade: "aviso", local, mensagem });
  const materia = getMateria(lote.materiaSlug);

  if (q.materiaSlug !== lote.materiaSlug) erro(`materiaSlug (${q.materiaSlug}) difere do lote (${lote.materiaSlug})`);
  if (!q.id.startsWith(`${materia.prefixoId}-`) || !/^\d{3}$/.test(q.id.slice(materia.prefixoId.length + 1))) {
    erro(`id deve ser "${materia.prefixoId}-NNN"`);
  } else {
    const numero = Number(q.id.slice(-3));
    const min = (lote.lote - 1) * 10 + 1;
    const max = lote.lote * 10;
    if (numero < min || numero > max) erro(`id fora da faixa do lote ${lote.lote} (${min}–${max})`);
  }
  if (!materia.subtopicos.includes(q.subtopico)) erro(`subtópico "${q.subtopico}" não existe na taxonomia de ${materia.slug}`);

  if (q.textoApoioId) {
    const ids = opcoes.textosPorMateria?.get(lote.materiaSlug);
    if (ids && !ids.has(q.textoApoioId)) erro(`textoApoioId "${q.textoApoioId}" não encontrado em src/data/textos/${lote.materiaSlug}.json`);
  } else if (lote.materiaSlug === "lingua-inglesa-tecnica") {
    erro("questões de Inglês Técnico precisam de textoApoioId");
  }

  q.alternativas.forEach((a, i) => {
    if (POSICIONAL_CI.test(a.texto) || POSICIONAL_LETRA.test(a.texto)) {
      erro(`alternativa ${i + 1} faz referência posicional (quebra com o embaralhamento): "${a.texto.slice(0, 60)}"`);
    }
    if (a.explicacaoDetalhada.length < 120) aviso(`explicação da alternativa ${i + 1} curta (${a.explicacaoDetalhada.length} caracteres)`);
    if (!a.correta && a.versaoInvertidaFalsa) aviso(`alternativa ${i + 1} é incorreta e tem versaoInvertidaFalsa (campo ignorado)`);
  });

  if (q.formato === "assertivas") {
    if (!q.alternativas.some((a) => ROMANOS.test(a.texto))) aviso("formato assertivas, mas nenhuma alternativa cita I, II, III...");
    if (q.assertivas && !q.assertivas.some((s) => s.verdadeira)) aviso("nenhuma assertiva verdadeira: confira o gabarito");
    if (q.assertivas) problemas.push(...conferirGabaritoAssertivas(q, local));
  }

  const correta = q.alternativas.find((a) => a.correta);
  if (correta && correta.versaoInvertidaFalsa && chaveExata(correta.versaoInvertidaFalsa) === chaveExata(correta.texto)) {
    erro("versaoInvertidaFalsa é igual ao texto da alternativa correta");
  }
  return problemas;
}

/** Conjunto de afirmativas citadas numa alternativa ("I e III, apenas" → {0, 2}); undefined se não citar nenhuma. */
export function afirmativasCitadas(texto: string): Set<number> | undefined {
  const indices = [...texto.matchAll(ROMANOS_GLOBAL)].map((m) => INDICE_ROMANO[m[1]!]!);
  return indices.length ? new Set(indices) : undefined;
}

function mesmoConjunto(a: ReadonlySet<number>, b: ReadonlySet<number>): boolean {
  return a.size === b.size && [...a].every((x) => b.has(x));
}

function romanos(conjunto: ReadonlySet<number>): string {
  const nomes = ["I", "II", "III", "IV", "V"];
  return conjunto.size ? [...conjunto].sort().map((i) => nomes[i]).join(", ") : "nenhuma";
}

/**
 * Nas questões de assertivas, a alternativa correta precisa listar exatamente
 * as afirmativas verdadeiras (ou as falsas, se o comando pedir as incorretas),
 * e nenhuma alternativa errada pode listar o mesmo conjunto.
 */
function conferirGabaritoAssertivas(q: Questao, local: string): Problema[] {
  const problemas: Problema[] = [];
  const assertivas = q.assertivas ?? [];
  const pedeFalsas = PEDE_FALSAS.test(q.comandoFinal ?? "");
  const alvo = new Set(assertivas.flatMap((s, i) => (s.verdadeira !== pedeFalsas ? [i] : [])));
  for (const a of q.alternativas) {
    const citadas = afirmativasCitadas(a.texto);
    if (!citadas) continue;
    if ([...citadas].some((i) => i >= assertivas.length)) {
      problemas.push({ severidade: "erro", local, mensagem: `alternativa "${a.texto.slice(0, 50)}" cita afirmativa inexistente (há ${assertivas.length})` });
    } else if (a.correta && !mesmoConjunto(citadas, alvo)) {
      problemas.push({ severidade: "erro", local, mensagem: `a alternativa correta cita ${romanos(citadas)}, mas as afirmativas ${pedeFalsas ? "falsas" : "verdadeiras"} são ${romanos(alvo)}` });
    } else if (!a.correta && mesmoConjunto(citadas, alvo)) {
      problemas.push({ severidade: "erro", local, mensagem: `a alternativa incorreta "${a.texto.slice(0, 50)}" também lista exatamente o gabarito (${romanos(alvo)})` });
    }
  }
  return problemas;
}

function resumir(materiaSlug: MateriaSlug, questoes: readonly Questao[]): ResumoMateria {
  const contar = (chave: (q: Questao) => string) => {
    const r: Record<string, number> = {};
    for (const q of questoes) r[chave(q)] = (r[chave(q)] ?? 0) + 1;
    return r;
  };
  return {
    materiaSlug,
    total: questoes.length,
    porSubtopico: contar((q) => q.subtopico),
    porNivel: contar((q) => q.nivel),
    porFormato: contar((q) => q.formato),
    elegiveisTamanho: questoes.filter(entraNaMetricaDeTamanho).length,
    corretaMaisLonga: questoes.filter((q) => entraNaMetricaDeTamanho(q) && corretaEhAMaisLonga(q)).length,
    comSelo: questoes.filter((q) => q.revisarFonteOficial).length,
  };
}

/**
 * Nas assertivas, o tamanho da alternativa só reflete quantos itens ela lista
 * ("II, III e IV, apenas"), então essas questões ficam fora da métrica de
 * "correta é a mais longa": contá-las só diluiria a proporção.
 */
export function entraNaMetricaDeTamanho(q: Questao): boolean {
  return q.formato !== "assertivas";
}

export function corretaEhAMaisLonga(q: Questao): boolean {
  const correta = q.alternativas.find((a) => a.correta);
  if (!correta) return false;
  return q.alternativas.every((a) => a === correta || a.texto.length < correta.texto.length);
}

function validarConjuntoMateria(slug: MateriaSlug, questoes: readonly Questao[], resumo: ResumoMateria, opcoes: OpcoesValidacao): Problema[] {
  const problemas: Problema[] = [];
  const local = `matéria ${slug}`;
  const materia = getMateria(slug);
  const sevCompleto: Severidade = opcoes.exigirCompleto ? "erro" : "aviso";

  // Lotes além do 5º (gerador, importação) são bem-vindos; o mínimo é uma bateria completa.
  if (resumo.total < PROVA.questoesPorBateria) {
    problemas.push({ severidade: sevCompleto, local, mensagem: `${resumo.total} questões (mínimo ${PROVA.questoesPorBateria})` });
  }
  for (const sub of materia.subtopicos) {
    const n = resumo.porSubtopico[sub] ?? 0;
    if (n < 2) problemas.push({ severidade: sevCompleto, local, mensagem: `subtópico "${sub}" com ${n} questão(ões) (mínimo 2)` });
  }
  if (resumo.elegiveisTamanho >= 10) {
    const proporcao = resumo.corretaMaisLonga / resumo.elegiveisTamanho;
    const base = `das ${resumo.elegiveisTamanho} questões sem assertivas`;
    if (proporcao > 0.45) {
      problemas.push({ severidade: "erro", local, mensagem: `alternativa correta é a mais longa em ${(proporcao * 100).toFixed(0)}% ${base} (máx. 35%): viés explorável` });
    } else if (proporcao > 0.35) {
      problemas.push({ severidade: "aviso", local, mensagem: `alternativa correta é a mais longa em ${(proporcao * 100).toFixed(0)}% ${base} (alvo ≤ 35%)` });
    } else if (resumo.elegiveisTamanho >= 30 && proporcao < 0.1) {
      problemas.push({ severidade: "aviso", local, mensagem: `alternativa correta é a mais longa em só ${(proporcao * 100).toFixed(0)}% ${base}: viés inverso ("nunca é a mais longa"); alvo entre 10% e 35%` });
    }
  }
  if (resumo.total >= 10) {
    for (const [nivel, alvo] of Object.entries(ALVO_NIVEL)) {
      const real = (resumo.porNivel[nivel] ?? 0) / resumo.total;
      if (Math.abs(real - alvo) > 0.12) {
        problemas.push({ severidade: "aviso", local, mensagem: `nível ${nivel}: ${(real * 100).toFixed(0)}% (alvo ${(alvo * 100).toFixed(0)}%)` });
      }
    }
  }

  const trigramas = questoes.map((q) => ({ id: q.id, t: trigramasDe(q.enunciadoBase) }));
  for (let i = 0; i < trigramas.length; i++) {
    for (let j = i + 1; j < trigramas.length; j++) {
      const a = trigramas[i]!;
      const b = trigramas[j]!;
      const sim = jaccard(a.t, b.t);
      if (sim > 0.75) {
        problemas.push({ severidade: "erro", local, mensagem: `enunciados quase idênticos: ${a.id} e ${b.id} (similaridade ${sim.toFixed(2)})` });
      } else if (sim > 0.55) {
        problemas.push({ severidade: "aviso", local, mensagem: `enunciados parecidos: ${a.id} e ${b.id} (similaridade ${sim.toFixed(2)})` });
      }
    }
  }
  return problemas;
}

function trigramasDe(texto: string): Set<string> {
  const palavras = normalizar(texto).split(" ").filter(Boolean);
  const r = new Set<string>();
  for (let i = 0; i + 2 < palavras.length; i++) r.add(`${palavras[i]} ${palavras[i + 1]} ${palavras[i + 2]}`);
  return r;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export function validarArquivoTextos(arquivo: string, conteudo: unknown): { problemas: Problema[]; ids: Set<string>; materiaSlug?: MateriaSlug } {
  const parsed = TextosArquivoSchema.safeParse(conteudo);
  if (!parsed.success) {
    return { problemas: parsed.error.issues.map((i) => ({ severidade: "erro", local: `${arquivo} → ${formatarCaminho(i.path)}`, mensagem: i.message })), ids: new Set() };
  }
  const problemas: Problema[] = [];
  const ids = new Set<string>();
  const prefixo = getMateria(parsed.data.materiaSlug).prefixoId;
  for (const t of parsed.data.textos) {
    if (ids.has(t.id)) problemas.push({ severidade: "erro", local: arquivo, mensagem: `texto com id duplicado: ${t.id}` });
    if (!t.id.startsWith(`${prefixo}-t`)) problemas.push({ severidade: "erro", local: arquivo, mensagem: `id de texto deve começar com "${prefixo}-t": ${t.id}` });
    ids.add(t.id);
  }
  return { problemas, ids, materiaSlug: parsed.data.materiaSlug };
}

export function validarNotaExemplo(arquivo: string, conteudo: unknown): Problema[] {
  const parsed = NotaExemploSchema.safeParse(conteudo);
  if (!parsed.success) return parsed.error.issues.map((i) => ({ severidade: "erro", local: `${arquivo} → ${formatarCaminho(i.path)}`, mensagem: i.message }));
  const materia = getMateria(parsed.data.materiaSlug);
  if (!materia.subtopicos.includes(parsed.data.subtopico)) {
    return [{ severidade: "erro", local: arquivo, mensagem: `subtópico "${parsed.data.subtopico}" não existe em ${materia.slug}` }];
  }
  return [];
}

export function validarCaso(arquivo: string, conteudo: unknown): Problema[] {
  const parsed = CasoDiscursivoSchema.safeParse(conteudo);
  if (!parsed.success) return parsed.error.issues.map((i) => ({ severidade: "erro", local: `${arquivo} → ${formatarCaminho(i.path)}`, mensagem: i.message }));
  const especificas = parsed.data.materiasRelacionadas.filter((s) => getMateria(s).bloco === "especificos");
  if (especificas.length < 2) {
    return [{ severidade: "erro", local: arquivo, mensagem: "o caso deve cruzar ao menos 2 matérias de Conhecimentos Específicos (item 11.6)" }];
  }
  return [];
}

export function formatarCaminho(path: readonly PropertyKey[]): string {
  return path.length ? path.map((p) => (typeof p === "number" ? `[${p}]` : String(p))).join(".").replace(/\.\[/g, "[") : "(raiz)";
}
