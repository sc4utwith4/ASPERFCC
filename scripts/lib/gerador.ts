/**
 * Pipeline do CLI gerador (npm run gerar).
 *
 * planejarLote → montarPedido → cliente.gerar → avaliarRascunho → (reparo) → gravarResultado
 *
 * O cliente da API é injetado (ver cliente-anthropic.ts). Assim o pipeline
 * inteiro roda nos testes com um cliente simulado, sem rede e sem custo.
 * A avaliação usa as mesmas regras do bank:validate, mais as checagens que
 * só fazem sentido para um lote gerado (ids planejados, textos novos, viés
 * de tamanho dentro do lote).
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";
import { getMateria, type MateriaSlug } from "../../src/data/edital";
import {
  LoteSchema,
  QuestaoBaseSchema,
  TextoApoioSchema,
  TextosArquivoSchema,
  type Formato,
  type Lote,
  type Nivel,
  type Questao,
  type TextoApoio,
} from "../../src/data/schema";
import { corretaEhAMaisLonga, formatarCaminho, validarLotes, type EntradaLote, type Problema } from "../../src/data/validacao";

export const QUESTOES_POR_LOTE = 10;
export const NIVEIS_POR_LOTE: Readonly<Record<Nivel, number>> = { "Básico": 2, "Intermediário": 5, "Avançado": 3 };
export const FORMATOS_POR_LOTE: Readonly<Record<Formato, number>> = { "caso-pratico": 4, direta: 3, assertivas: 2, lacunas: 1 };
/** Gerais têm outro perfil na FCC: Português e Inglês são quase só diretas sobre texto; Matemática, problemas. */
const FORMATOS_POR_MATERIA: Partial<Record<MateriaSlug, Readonly<Record<Formato, number>>>> = {
  "lingua-portuguesa": { "caso-pratico": 0, direta: 6, assertivas: 2, lacunas: 2 },
  "lingua-inglesa-tecnica": { "caso-pratico": 0, direta: 8, assertivas: 1, lacunas: 1 },
  "matematica-raciocinio-logico": { "caso-pratico": 4, direta: 5, assertivas: 1, lacunas: 0 },
};
const MAX_CORRETA_MAIS_LONGA = 4;

/** Matérias cujas questões se apoiam em textos-base próprios. */
const TEXTOS_DA_MATERIA: Partial<Record<MateriaSlug, { idioma: "pt" | "en"; novosPorLote: number; todasUsam: boolean }>> = {
  "lingua-portuguesa": { idioma: "pt", novosPorLote: 2, todasUsam: false },
  "lingua-inglesa-tecnica": { idioma: "en", novosPorLote: 2, todasUsam: true },
};

// ------------------------------------------------------------------ contexto

export interface ContextoMateria {
  materiaSlug: MateriaSlug;
  /** Lotes já gravados (entram na validação cruzada: ids, duplicatas, viés). */
  entradas: EntradaLote[];
  questoes: Questao[];
  textos: TextoApoio[];
}

export function contextoDeEntradas(materiaSlug: MateriaSlug, entradas: EntradaLote[], textos: TextoApoio[] = []): ContextoMateria {
  const questoes: Questao[] = [];
  for (const e of entradas) {
    const r = LoteSchema.safeParse(e.conteudo);
    if (r.success && r.data.materiaSlug === materiaSlug) questoes.push(...r.data.questoes);
  }
  return { materiaSlug, entradas, questoes, textos };
}

/** Lê os lotes e os textos de apoio gravados de uma matéria. */
export function carregarContexto(raiz: string, materiaSlug: MateriaSlug, entradas: EntradaLote[]): ContextoMateria {
  const arquivoTextos = join(raiz, "src", "data", "textos", `${materiaSlug}.json`);
  let textos: TextoApoio[] = [];
  if (existsSync(arquivoTextos)) {
    const r = TextosArquivoSchema.safeParse(JSON.parse(readFileSync(arquivoTextos, "utf8")));
    if (r.success) textos = r.data.textos;
  }
  return contextoDeEntradas(materiaSlug, entradas, textos);
}

// ------------------------------------------------------------------- plano

export interface PlanoLote {
  materiaSlug: MateriaSlug;
  lote: number;
  /** Caminho relativo à raiz do repositório. */
  arquivo: string;
  ids: string[];
  subtopicos: { subtopico: string; quantidade: number }[];
  niveis: Record<Nivel, number>;
  formatos: Record<Formato, number>;
  idsTextosNovos: string[];
  idiomaTextos?: "pt" | "en";
  todasUsamTexto: boolean;
}

export interface OpcoesPlano {
  /** Lotes já reservados nesta execução (ainda não gravados), para não repetir número nem subtópicos. */
  reservados?: readonly PlanoLote[];
  /** Restringe a estes subtópicos (texto exato da taxonomia). */
  subtopicos?: readonly string[];
}

export function numeroDoLote(e: EntradaLote): number | undefined {
  const m = /lote-(\d{2})\.json$/.exec(e.arquivo);
  return m ? Number(m[1]) : undefined;
}

export function planejarLote(ctx: ContextoMateria, opcoes: OpcoesPlano = {}): PlanoLote {
  const materia = getMateria(ctx.materiaSlug);
  const reservados = (opcoes.reservados ?? []).filter((p) => p.materiaSlug === ctx.materiaSlug);
  const usados = [...ctx.entradas.map(numeroDoLote), ...reservados.map((p) => p.lote)].filter((n): n is number => n !== undefined);
  const lote = Math.max(0, ...usados) + 1;
  if (lote > 99) throw new Error(`${materia.slug} já tem 99 lotes`);

  const invalidos = (opcoes.subtopicos ?? []).filter((s) => !materia.subtopicos.includes(s));
  if (invalidos.length) throw new Error(`subtópico(s) fora da taxonomia de ${materia.slug}: ${invalidos.join("; ")}`);

  const contagem = new Map(materia.subtopicos.map((s) => [s, 0]));
  for (const q of ctx.questoes) if (contagem.has(q.subtopico)) contagem.set(q.subtopico, contagem.get(q.subtopico)! + 1);
  for (const p of reservados) for (const s of p.subtopicos) contagem.set(s.subtopico, (contagem.get(s.subtopico) ?? 0) + s.quantidade);
  const candidatos = opcoes.subtopicos?.length ? [...opcoes.subtopicos] : [...materia.subtopicos];
  const escolhidos = new Map<string, number>();
  for (let i = 0; i < QUESTOES_POR_LOTE; i++) {
    // Menos coberto primeiro; empate pela ordem da taxonomia (estável e previsível).
    let melhor = candidatos[0]!;
    let menor = Number.POSITIVE_INFINITY;
    for (const s of candidatos) {
      const c = (contagem.get(s) ?? 0) + (escolhidos.get(s) ?? 0);
      if (c < menor) {
        menor = c;
        melhor = s;
      }
    }
    escolhidos.set(melhor, (escolhidos.get(melhor) ?? 0) + 1);
  }

  const inicio = (lote - 1) * QUESTOES_POR_LOTE + 1;
  const ids = Array.from({ length: QUESTOES_POR_LOTE }, (_, k) => `${materia.prefixoId}-${String(inicio + k).padStart(3, "0")}`);

  const cfgTexto = TEXTOS_DA_MATERIA[ctx.materiaSlug];
  const idsTextosNovos: string[] = [];
  if (cfgTexto) {
    const numeros = [...ctx.textos.map((t) => t.id), ...reservados.flatMap((p) => p.idsTextosNovos)]
      .map((id) => Number(/-t(\d{2})$/.exec(id)?.[1] ?? 0));
    const proximo = Math.max(0, ...numeros) + 1;
    for (let k = 0; k < cfgTexto.novosPorLote; k++) idsTextosNovos.push(`${materia.prefixoId}-t${String(proximo + k).padStart(2, "0")}`);
  }

  return {
    materiaSlug: ctx.materiaSlug,
    lote,
    arquivo: `src/data/questions/${ctx.materiaSlug}/lote-${String(lote).padStart(2, "0")}.json`,
    ids,
    subtopicos: [...escolhidos].map(([subtopico, quantidade]) => ({ subtopico, quantidade })),
    niveis: { ...NIVEIS_POR_LOTE },
    formatos: { ...(FORMATOS_POR_MATERIA[ctx.materiaSlug] ?? FORMATOS_POR_LOTE) },
    idsTextosNovos,
    idiomaTextos: cfgTexto?.idioma,
    todasUsamTexto: cfgTexto?.todasUsam ?? false,
  };
}

// ------------------------------------------------------------------ pedido

export interface BlocoSistema {
  texto: string;
  /** Marca o fim de um trecho estável (cache_control com TTL de 1 h). */
  cache: boolean;
}

export interface PedidoGeracao {
  sistema: BlocoSistema[];
  mensagem: string;
  /** JSON Schema da saída estruturada (output_config.format). */
  schema: Record<string, unknown>;
}

export interface DocumentosBase {
  autoria: string;
  exemplo: string;
  /** Ficha docs/pesquisa/<slug>.md, se existir. */
  pesquisa?: string;
  /** docs/pesquisa/_normativos-tce-go.md, para as matérias que tratam do TCE-GO. */
  normativos?: string;
}

const PREAMBULO = `Você é autor(a) de questões inéditas no padrão da Fundação Carlos Chagas (FCC) para a plataforma de estudos do concurso TCE-GO 2026: cargo Técnico de Controle Externo, especialidade Tecnologia da Informação (nível médio), prova em 17/01/2027.

Sua saída é um único objeto JSON no formato imposto pela API. Siga à risca o guia de autoria abaixo: é o mesmo dos autores humanos, e um validador automático confere cada questão antes de ela entrar no banco.

Regras de segurança factual:
- Não invente número de artigo, resolução, prazo, versão ou percentual. Se não tiver certeza, construa a questão sobre o conceito, não sobre o número.
- Fato sobre normativo do TCE-GO que não esteja na ficha de pesquisa não pode decidir o gabarito; se for indispensável, marque revisarFonteOficial: true.
- Não preencha o campo procedencia (o pipeline faz isso).
- Nada copiado de provas reais, livros ou normas: escreva sempre com suas palavras.`;

export function montarSistema(materiaSlug: MateriaSlug, docs: DocumentosBase): BlocoSistema[] {
  const materia = getMateria(materiaSlug);
  const geral = `${PREAMBULO}

<guia_de_autoria>
${docs.autoria.trim()}
</guia_de_autoria>

<exemplo_validado>
${docs.exemplo.trim()}
</exemplo_validado>`;
  const partes = [
    `<materia>
Nome: ${materia.nome} (slug ${materia.slug}, prefixo de id ${materia.prefixoId})
Bloco: ${materia.bloco === "gerais" ? "Conhecimentos Gerais" : "Conhecimentos Específicos"}; na prova: ${materia.questoesNaProva} questões × peso ${materia.peso}
Subtópicos oficiais (copie o texto exato no campo subtopico):
${materia.subtopicos.map((s) => `- ${s}`).join("\n")}
</materia>`,
    `<ficha_de_pesquisa>
${docs.pesquisa?.trim() || "(Ficha ausente: use apenas conhecimento consolidado, evite fatos voláteis e explicite dúvidas na fundamentação.)"}
</ficha_de_pesquisa>`,
  ];
  if (docs.normativos) partes.push(`<normativos_tce_go>\n${docs.normativos.trim()}\n</normativos_tce_go>`);
  return [
    { texto: geral, cache: true },
    { texto: partes.join("\n\n"), cache: true },
  ];
}

function rotuloFormato(f: Formato): string {
  return f === "caso-pratico" ? "caso-prático" : f;
}

export function montarMensagem(plano: PlanoLote, ctx: ContextoMateria): string {
  const materia = getMateria(plano.materiaSlug);
  const linhas: string[] = [];
  linhas.push(`Escreva o lote ${plano.lote} de ${materia.nome}: exatamente ${plano.ids.length} questões, com os ids ${plano.ids.join(", ")}, nesta ordem.`);
  linhas.push("");
  linhas.push("Distribuição obrigatória:");
  linhas.push(`- Subtópicos: ${plano.subtopicos.map((s) => `"${s.subtopico}" × ${s.quantidade}`).join("; ")}.`);
  linhas.push(`- Níveis: ${Object.entries(plano.niveis).map(([n, q]) => `${n} ${q}`).join(", ")}.`);
  linhas.push(`- Formatos: ${Object.entries(plano.formatos).filter(([, q]) => q > 0).map(([f, q]) => `${rotuloFormato(f as Formato)} ${q}`).join(", ")}.`);
  linhas.push(`- Gabarito: varie a posição da correta entre opt-1 e opt-5; a correta não pode ser a alternativa mais longa em mais de ${MAX_CORRETA_MAIS_LONGA - 1} das ${plano.ids.length} questões.`);
  linhas.push("");
  if (plano.idsTextosNovos.length) {
    const idioma = plano.idiomaTextos === "en" ? "em inglês técnico" : "em português";
    linhas.push(
      `Crie ${plano.idsTextosNovos.length} textos de apoio novos em textosNovos, com os ids ${plano.idsTextosNovos.join(" e ")}: ${idioma}, de 3 a 8 parágrafos, autoria original e fonte "Texto elaborado para fins didáticos". ` +
        (plano.todasUsamTexto
          ? "Todas as questões do lote devem usar um desses textos via textoApoioId."
          : "Use-os via textoApoioId nas questões de interpretação, coesão e reescrita; questões de gramática podem ser avulsas.") +
        " Cada texto novo precisa ser usado por pelo menos uma questão, e todo trecho citado no enunciado precisa existir no texto.",
    );
  } else {
    linhas.push("Esta matéria não usa textos de apoio: devolva textosNovos como lista vazia e não preencha textoApoioId.");
  }
  const existentes = ctx.questoes.slice(-200);
  if (existentes.length) {
    linhas.push("");
    linhas.push("Enunciados que já existem no banco. Não repita o caso, o cenário nem o ângulo de cobrança:");
    existentes.forEach((q, i) => linhas.push(`${i + 1}. [${q.subtopico}] ${q.enunciadoBase.replace(/\s+/g, " ").slice(0, 170)}`));
  }
  linhas.push("");
  linhas.push('Responda apenas com o objeto JSON { "questoes": [...], "textosNovos": [...] }.');
  return linhas.join("\n");
}

export function montarMensagemReparo(mensagemOriginal: string, rascunho: string, problemas: readonly Problema[], truncado: boolean): string {
  const lista = problemas.slice(0, 60).map((p) => `- ${p.local}: ${p.mensagem}`).join("\n");
  const extra = problemas.length > 60 ? `\n- (+${problemas.length - 60} problemas semelhantes)` : "";
  if (truncado) {
    return `${mensagemOriginal}

---
A tentativa anterior foi interrompida pelo limite de tokens e o JSON veio incompleto. Gere o lote de novo, completo, com explicações objetivas (sem perder a qualidade exigida pelo guia).`;
  }
  return `${mensagemOriginal}

---
Uma versão anterior deste lote foi reprovada pelo validador automático. Corrija TODOS os problemas abaixo e devolva o lote COMPLETO (as ${QUESTOES_POR_LOTE} questões e os textos novos), mantendo o que já estava correto.

Problemas:
${lista}${extra}

Versão anterior:
${rascunho}`;
}

/**
 * Schema da saída estruturada: os campos da questão (sem procedencia), com o
 * slug fixo e os subtópicos da matéria como enum. Fica estável por matéria,
 * para não invalidar o cache do prompt entre lotes.
 */
export function schemaDeSaida(materiaSlug: MateriaSlug) {
  const materia = getMateria(materiaSlug);
  const Questao = QuestaoBaseSchema.omit({ procedencia: true }).extend({
    materiaSlug: z.literal(materiaSlug),
    subtopico: z.enum(materia.subtopicos as unknown as [string, ...string[]]),
  });
  return z.strictObject({
    questoes: z.array(Questao).min(1).max(QUESTOES_POR_LOTE),
    textosNovos: z.array(TextoApoioSchema),
  });
}

const FORMATOS_SUPORTADOS = new Set(["date-time", "time", "date", "duration", "email", "hostname", "uri", "ipv4", "ipv6", "uuid"]);
const CHAVES_SUPORTADAS = new Set(["type", "properties", "required", "items", "enum", "const", "anyOf", "allOf", "$ref", "$defs", "description", "title", "additionalProperties", "default"]);

/**
 * Converte o JSON Schema do Zod para o subconjunto aceito pelas saídas
 * estruturadas: mantém enum/const (suportados pela API), move para a
 * descrição as restrições não suportadas (minLength, pattern, maxItems...)
 * e fecha todo objeto com additionalProperties: false. Com `simples`, enum e
 * const também viram descrição (mesmo comportamento do helper do SDK).
 * As restrições movidas continuam valendo: o pipeline valida tudo depois.
 */
export function paraSchemaEstruturado(no: unknown, opcoes: { simples?: boolean } = {}): unknown {
  if (Array.isArray(no)) return no.map((v) => paraSchemaEstruturado(v, opcoes));
  if (!no || typeof no !== "object") return no;
  const saida: Record<string, unknown> = {};
  const movidas: string[] = [];
  for (const [chave, valor] of Object.entries(no as Record<string, unknown>)) {
    if (chave === "$schema") continue;
    if (chave === "properties" || chave === "$defs") {
      saida[chave] = Object.fromEntries(Object.entries(valor as Record<string, unknown>).map(([k, v]) => [k, paraSchemaEstruturado(v, opcoes)]));
    } else if (chave === "items" || chave === "anyOf" || chave === "allOf") {
      saida[chave] = paraSchemaEstruturado(valor, opcoes);
    } else if (chave === "oneOf") {
      saida.anyOf = paraSchemaEstruturado(valor, opcoes);
    } else if (chave === "minItems" && (valor === 0 || valor === 1)) {
      saida[chave] = valor;
    } else if (chave === "format" && typeof valor === "string" && FORMATOS_SUPORTADOS.has(valor)) {
      saida[chave] = valor;
    } else if ((chave === "enum" || chave === "const") && opcoes.simples) {
      movidas.push(`${chave}: ${JSON.stringify(valor)}`);
    } else if (CHAVES_SUPORTADAS.has(chave)) {
      saida[chave] = valor;
    } else {
      movidas.push(`${chave}: ${JSON.stringify(valor)}`);
    }
  }
  if (saida.type === "object") saida.additionalProperties = false;
  if (movidas.length) saida.description = [saida.description, `{${movidas.join(", ")}}`].filter(Boolean).join("\n\n");
  return saida;
}

export function jsonSchemaDeSaida(materiaSlug: MateriaSlug, opcoes: { simples?: boolean } = {}): Record<string, unknown> {
  return paraSchemaEstruturado(z.toJSONSchema(schemaDeSaida(materiaSlug)), opcoes) as Record<string, unknown>;
}

export function montarPedido(plano: PlanoLote, ctx: ContextoMateria, docs: DocumentosBase, opcoes: { simples?: boolean } = {}): PedidoGeracao {
  return { sistema: montarSistema(plano.materiaSlug, docs), mensagem: montarMensagem(plano, ctx), schema: jsonSchemaDeSaida(plano.materiaSlug, opcoes) };
}

// --------------------------------------------------------------- avaliação

export interface AvaliacaoRascunho {
  lote?: Lote;
  textosNovos: TextoApoio[];
  erros: Problema[];
  avisos: Problema[];
}

const RespostaSoltaSchema = z.object({ questoes: z.array(z.unknown()), textosNovos: z.array(z.unknown()).default([]) });

function extrairJson(texto: string): unknown {
  const limpo = texto.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(limpo);
}

function chaveProblema(p: Problema): string {
  return `${p.severidade}|${p.local}|${p.mensagem}`;
}

export function avaliarRascunho(texto: string, plano: PlanoLote, ctx: ContextoMateria): AvaliacaoRascunho {
  const erros: Problema[] = [];
  const avisos: Problema[] = [];
  const erro = (local: string, mensagem: string) => erros.push({ severidade: "erro", local, mensagem });
  const aviso = (local: string, mensagem: string) => avisos.push({ severidade: "aviso", local, mensagem });

  let bruto: unknown;
  try {
    bruto = extrairJson(texto);
  } catch (e) {
    erro("resposta", `não é JSON válido (${(e as Error).message.slice(0, 120)})`);
    return { textosNovos: [], erros, avisos };
  }
  const solta = RespostaSoltaSchema.safeParse(bruto);
  if (!solta.success) {
    erro("resposta", 'o objeto precisa ter as listas "questoes" e "textosNovos"');
    return { textosNovos: [], erros, avisos };
  }

  // Textos de apoio novos.
  const textosNovos: TextoApoio[] = [];
  const idsExistentes = new Set(ctx.textos.map((t) => t.id));
  solta.data.textosNovos.forEach((t, i) => {
    const r = TextoApoioSchema.safeParse(t);
    const local = `textosNovos[${i}]`;
    if (!r.success) {
      for (const issue of r.error.issues) erro(`${local} → ${formatarCaminho(issue.path)}`, issue.message);
      return;
    }
    if (!plano.idsTextosNovos.includes(r.data.id)) erro(local, `id de texto "${r.data.id}" fora do planejado (${plano.idsTextosNovos.join(", ") || "nenhum texto novo"})`);
    if (idsExistentes.has(r.data.id) || textosNovos.some((x) => x.id === r.data.id)) erro(local, `id de texto repetido: ${r.data.id}`);
    if (plano.idiomaTextos && r.data.idioma !== plano.idiomaTextos) erro(local, `idioma deve ser "${plano.idiomaTextos}"`);
    textosNovos.push(r.data);
  });
  if (!plano.idsTextosNovos.length && solta.data.textosNovos.length) erro("textosNovos", "esta matéria não usa textos de apoio: a lista deve vir vazia");

  // Ids planejados.
  const questoesBrutas = solta.data.questoes.map((q) => (q && typeof q === "object" ? { ...(q as Record<string, unknown>), procedencia: "gerador-ia" } : q));
  const idsRecebidos = questoesBrutas.map((q) => (q && typeof q === "object" ? String((q as Record<string, unknown>).id ?? "") : ""));
  const faltando = plano.ids.filter((id) => !idsRecebidos.includes(id));
  const sobrando = idsRecebidos.filter((id) => !plano.ids.includes(id));
  if (faltando.length) erro("questoes", `faltam os ids ${faltando.join(", ")}`);
  if (sobrando.length) erro("questoes", `ids fora do planejado: ${sobrando.join(", ")}`);

  // Regras do bank:validate, contando só o que a nova entrada acrescenta.
  const textosPorMateria = new Map([[plano.materiaSlug, new Set([...idsExistentes, ...textosNovos.map((t) => t.id)])]]);
  const nova: EntradaLote = { arquivo: plano.arquivo, materiaEsperada: plano.materiaSlug, conteudo: { materiaSlug: plano.materiaSlug, lote: plano.lote, questoes: questoesBrutas } };
  const opcoes = { exigirCompleto: false, textosPorMateria, materias: [plano.materiaSlug] };
  const antes = new Set(validarLotes(ctx.entradas, opcoes).problemas.map(chaveProblema));
  const depois = validarLotes([...ctx.entradas, nova], opcoes);
  for (const p of depois.problemas) {
    if (antes.has(chaveProblema(p))) continue;
    (p.severidade === "erro" ? erros : avisos).push(p);
  }

  const lote = LoteSchema.safeParse(nova.conteudo);
  if (lote.success) {
    const qs = lote.data.questoes;
    const longas = qs.filter(corretaEhAMaisLonga).length;
    if (longas > MAX_CORRETA_MAIS_LONGA) erro(plano.arquivo, `a correta é a alternativa mais longa em ${longas} de ${qs.length} questões (máx. ${MAX_CORRETA_MAIS_LONGA}): viés explorável`);
    else if (longas === MAX_CORRETA_MAIS_LONGA) aviso(plano.arquivo, `a correta é a mais longa em ${longas} de ${qs.length} questões`);
    const usados = new Set(qs.map((q) => q.textoApoioId).filter(Boolean));
    for (const t of textosNovos) if (!usados.has(t.id)) erro(`textosNovos (${t.id})`, "texto novo não é usado por nenhuma questão");
    for (const s of plano.subtopicos) {
      const n = qs.filter((q) => q.subtopico === s.subtopico).length;
      if (n < s.quantidade) aviso(plano.arquivo, `subtópico "${s.subtopico}" com ${n} questão(ões); o plano pedia ${s.quantidade}`);
    }
    for (const [nivel, alvo] of Object.entries(plano.niveis)) {
      const n = qs.filter((q) => q.nivel === nivel).length;
      if (n !== alvo) aviso(plano.arquivo, `nível ${nivel}: ${n} (plano: ${alvo})`);
    }
  }
  return { lote: erros.length === 0 && lote.success ? lote.data : undefined, textosNovos, erros, avisos };
}

// ---------------------------------------------------------------- execução

export interface Uso {
  entrada: number;
  saida: number;
  cacheEscrita5m: number;
  cacheEscrita1h: number;
  cacheLeitura: number;
}

export interface RespostaGeracao {
  texto: string;
  stopReason: string | null;
  recusa?: { categoria?: string | null; explicacao?: string | null };
  /** Modelo que respondeu (pode ser o de fallback). */
  modelo: string;
  fallbackUsado: boolean;
  uso: Uso;
}

export interface ClienteGerador {
  gerar(pedido: PedidoGeracao, opcoes?: { onProgresso?: (caracteres: number) => void }): Promise<RespostaGeracao>;
}

export type StatusLote = "aprovado" | "reprovado" | "recusado";

export interface ResultadoLote {
  plano: PlanoLote;
  status: StatusLote;
  lote?: Lote;
  textosNovos: TextoApoio[];
  erros: Problema[];
  avisos: Problema[];
  /** Última resposta do modelo (vai para rascunhos/ quando o lote não passa). */
  ultimoTexto?: string;
  respostas: RespostaGeracao[];
}

export interface OpcoesExecucao {
  maxReparos: number;
  /** Resposta já obtida (modo batch): pula a primeira chamada. */
  primeiraResposta?: RespostaGeracao;
  onTentativa?: (tentativa: number) => void;
  onProgresso?: (caracteres: number) => void;
}

export async function executarLote(cliente: ClienteGerador, plano: PlanoLote, ctx: ContextoMateria, pedidoBase: PedidoGeracao, opcoes: OpcoesExecucao): Promise<ResultadoLote> {
  const respostas: RespostaGeracao[] = [];
  let ultimo: { texto: string; problemas: Problema[]; truncado: boolean } | undefined;
  for (let tentativa = 0; tentativa <= opcoes.maxReparos; tentativa++) {
    let resposta: RespostaGeracao;
    if (tentativa === 0 && opcoes.primeiraResposta) {
      resposta = opcoes.primeiraResposta;
    } else {
      opcoes.onTentativa?.(tentativa);
      const mensagem = ultimo ? montarMensagemReparo(pedidoBase.mensagem, ultimo.texto, ultimo.problemas, ultimo.truncado) : pedidoBase.mensagem;
      resposta = await cliente.gerar({ ...pedidoBase, mensagem }, { onProgresso: opcoes.onProgresso });
    }
    respostas.push(resposta);

    if (resposta.stopReason === "refusal") {
      const motivo = [resposta.recusa?.categoria, resposta.recusa?.explicacao].filter(Boolean).join(": ");
      return { plano, status: "recusado", textosNovos: [], erros: [{ severidade: "erro", local: "resposta", mensagem: `recusa do modelo${motivo ? ` (${motivo})` : ""}` }], avisos: [], ultimoTexto: resposta.texto, respostas };
    }
    if (resposta.stopReason === "max_tokens") {
      ultimo = { texto: resposta.texto, problemas: [{ severidade: "erro", local: "resposta", mensagem: "resposta truncada pelo limite de max_tokens" }], truncado: true };
      continue;
    }
    const avaliacao = avaliarRascunho(resposta.texto, plano, ctx);
    if (avaliacao.lote) {
      return { plano, status: "aprovado", lote: avaliacao.lote, textosNovos: avaliacao.textosNovos, erros: [], avisos: avaliacao.avisos, respostas };
    }
    ultimo = { texto: resposta.texto, problemas: avaliacao.erros, truncado: false };
  }
  return { plano, status: "reprovado", textosNovos: [], erros: ultimo?.problemas ?? [], avisos: [], ultimoTexto: ultimo?.texto, respostas };
}

// ---------------------------------------------------------------- gravação

function escrever(arquivo: string, conteudo: string): void {
  mkdirSync(dirname(arquivo), { recursive: true });
  writeFileSync(arquivo, conteudo);
}

function jsonBonito(texto: string): { json: boolean; conteudo: string } {
  try {
    return { json: true, conteudo: `${JSON.stringify(extrairJson(texto), null, 2)}\n` };
  } catch {
    return { json: false, conteudo: texto };
  }
}

/** Grava o lote aprovado (e os textos novos) ou o rascunho com o relatório. Devolve os caminhos relativos gravados. */
export function gravarResultado(raiz: string, r: ResultadoLote, custoUsd?: number): string[] {
  const gravados: string[] = [];
  const nn = String(r.plano.lote).padStart(2, "0");
  if (r.status === "aprovado" && r.lote) {
    escrever(join(raiz, r.plano.arquivo), `${JSON.stringify(r.lote, null, 2)}\n`);
    gravados.push(r.plano.arquivo);
    if (r.textosNovos.length) {
      const rel = `src/data/textos/${r.plano.materiaSlug}.json`;
      const arquivo = join(raiz, rel);
      const atual = existsSync(arquivo) ? TextosArquivoSchema.parse(JSON.parse(readFileSync(arquivo, "utf8"))) : { materiaSlug: r.plano.materiaSlug, textos: [] };
      escrever(arquivo, `${JSON.stringify({ ...atual, textos: [...atual.textos, ...r.textosNovos] }, null, 2)}\n`);
      gravados.push(rel);
    }
    return gravados;
  }
  const pasta = `src/data/questions/${r.plano.materiaSlug}/rascunhos`;
  if (r.ultimoTexto) {
    const { json, conteudo } = jsonBonito(r.ultimoTexto);
    const rel = `${pasta}/lote-${nn}.${json ? "json" : "txt"}`;
    escrever(join(raiz, rel), conteudo);
    gravados.push(rel);
  }
  const relRelatorio = `${pasta}/lote-${nn}.relatorio.md`;
  escrever(join(raiz, relRelatorio), relatorio(r, custoUsd));
  gravados.push(relRelatorio);
  return gravados;
}

export function relatorio(r: ResultadoLote, custoUsd?: number): string {
  const linhas = [
    `# Lote ${r.plano.lote} de ${getMateria(r.plano.materiaSlug).nome}: ${r.status}`,
    "",
    `- Ids planejados: ${r.plano.ids[0]} a ${r.plano.ids.at(-1)}`,
    `- Tentativas: ${r.respostas.length}${r.respostas.some((x) => x.fallbackUsado) ? " (parte servida por modelo de fallback)" : ""}`,
    ...(custoUsd !== undefined ? [`- Custo estimado: US$ ${custoUsd.toFixed(2)}`] : []),
    "",
    "## Problemas da última tentativa",
    "",
    ...(r.erros.length ? r.erros.map((p) => `- ${p.local}: ${p.mensagem}`) : ["- (nenhum)"]),
    "",
    "Corrija o rascunho à mão e mova-o para a pasta da matéria como lote-NN.json, ou rode o gerador de novo.",
    "",
  ];
  return linhas.join("\n");
}

// ------------------------------------------------------------------- custo

/** Preços por milhão de tokens do Claude Opus 5.5 (US$). Batch: 50% de desconto em tudo. */
export const PRECOS_OPUS_5_5 = { entrada: 4, saida: 20, cacheEscrita5m: 5, cacheEscrita1h: 8, cacheLeitura: 0.2 } as const;

export function somarUso(usos: readonly Uso[]): Uso {
  return usos.reduce<Uso>(
    (s, u) => ({
      entrada: s.entrada + u.entrada,
      saida: s.saida + u.saida,
      cacheEscrita5m: s.cacheEscrita5m + u.cacheEscrita5m,
      cacheEscrita1h: s.cacheEscrita1h + u.cacheEscrita1h,
      cacheLeitura: s.cacheLeitura + u.cacheLeitura,
    }),
    { entrada: 0, saida: 0, cacheEscrita5m: 0, cacheEscrita1h: 0, cacheLeitura: 0 },
  );
}

export function custoEstimado(uso: Uso, opcoes: { batch?: boolean } = {}): number {
  const p = PRECOS_OPUS_5_5;
  const bruto = (uso.entrada * p.entrada + uso.saida * p.saida + uso.cacheEscrita5m * p.cacheEscrita5m + uso.cacheEscrita1h * p.cacheEscrita1h + uso.cacheLeitura * p.cacheLeitura) / 1_000_000;
  return opcoes.batch ? bruto / 2 : bruto;
}

/** Estimativa grosseira para o --dry-run (português tokeniza a ~3,2 caracteres por token). */
export function estimarTokens(texto: string): number {
  return Math.ceil(texto.length / 3.2);
}
