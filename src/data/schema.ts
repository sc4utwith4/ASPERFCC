import { z } from "zod";
import { MATERIA_SLUGS } from "./edital";

/**
 * Schema único do banco de questões. Usado pelo validador (scripts/), pela
 * importação de lotes no app e pelo CLI gerador. Regras de qualidade que
 * dependem do banco inteiro (cobertura, duplicatas, viés de tamanho) ficam
 * em validacao.ts.
 */

export const MateriaSlugSchema = z.enum(MATERIA_SLUGS);
export const NivelSchema = z.enum(["Básico", "Intermediário", "Avançado"]);
export const FormatoSchema = z.enum(["direta", "caso-pratico", "assertivas", "lacunas"]);
export const ProcedenciaSchema = z.enum(["banco-inicial", "gerador-ia", "importado"]);
export const ALTERNATIVA_IDS = ["opt-1", "opt-2", "opt-3", "opt-4", "opt-5"] as const;
export const AlternativaIdSchema = z.enum(ALTERNATIVA_IDS);

export const AlternativaSchema = z.strictObject({
  id: AlternativaIdSchema,
  texto: z.string().trim().min(1),
  correta: z.boolean(),
  explicacaoDetalhada: z.string().trim().min(60),
  /** Obrigatória na alternativa correta: afirmação falsa que inverte o ponto-chave (Modo Mutação). */
  versaoInvertidaFalsa: z.string().trim().min(20).optional(),
});

export const AssertivaSchema = z.strictObject({
  texto: z.string().trim().min(10),
  verdadeira: z.boolean(),
  explicacao: z.string().trim().min(30),
});

export const FlashcardSchema = z.strictObject({
  pergunta: z.string().trim().min(10),
  resposta: z.string().trim().min(20),
});

export const QuestaoSchema = z
  .strictObject({
    id: z.string().regex(/^[a-z]+(?:-[a-z]+)*-\d{3}$/, "id no formato prefixo-000"),
    materiaSlug: MateriaSlugSchema,
    subtopico: z.string().trim().min(3),
    origem: z.literal("Inédita padrão FCC"),
    procedencia: ProcedenciaSchema.optional(),
    nivel: NivelSchema,
    formato: FormatoSchema,
    textoApoioId: z.string().trim().min(3).optional(),
    enunciadoBase: z.string().trim().min(40),
    variantesEnunciado: z.array(z.string().trim().min(40)).min(2).max(4),
    assertivas: z.array(AssertivaSchema).min(3).max(5).optional(),
    /** Só no formato "assertivas": comando exibido depois da lista I, II, III… */
    comandoFinal: z.string().trim().min(10).optional(),
    alternativas: z.array(AlternativaSchema).length(5),
    pegadinhaFCC: z.string().trim().min(30),
    resumoFlashcard: FlashcardSchema,
    conceitosChave: z.array(z.string().trim().min(2).max(80)).min(1).max(3),
    fundamentacao: z.string().trim().min(5),
    revisarFonteOficial: z.boolean().optional(),
  })
  .superRefine((q, ctx) => {
    const corretas = q.alternativas.filter((a) => a.correta);
    if (corretas.length !== 1) {
      ctx.addIssue({ code: "custom", path: ["alternativas"], message: `deve haver exatamente 1 alternativa correta (há ${corretas.length})` });
    }
    const ids = new Set(q.alternativas.map((a) => a.id));
    if (ids.size !== 5) {
      ctx.addIssue({ code: "custom", path: ["alternativas"], message: "ids das alternativas devem ser opt-1..opt-5 sem repetição" });
    }
    q.alternativas.forEach((a, i) => {
      const prefixo = a.correta ? "CORRETA" : "INCORRETA";
      if (!a.explicacaoDetalhada.startsWith(prefixo)) {
        ctx.addIssue({ code: "custom", path: ["alternativas", i, "explicacaoDetalhada"], message: `explicação deve começar com "${prefixo}"` });
      }
      if (a.correta && !a.versaoInvertidaFalsa) {
        ctx.addIssue({ code: "custom", path: ["alternativas", i, "versaoInvertidaFalsa"], message: "alternativa correta precisa de versaoInvertidaFalsa" });
      }
    });
    const textos = q.alternativas.map((a) => normalizar(a.texto));
    if (new Set(textos).size !== textos.length) {
      ctx.addIssue({ code: "custom", path: ["alternativas"], message: "há alternativas com texto repetido" });
    }
    if (q.formato === "assertivas" && (!q.assertivas || !q.comandoFinal)) {
      ctx.addIssue({ code: "custom", path: ["assertivas"], message: "formato 'assertivas' exige os campos assertivas e comandoFinal" });
    }
    if (q.formato !== "assertivas" && (q.assertivas || q.comandoFinal)) {
      ctx.addIssue({ code: "custom", path: ["assertivas"], message: "assertivas e comandoFinal só são permitidos no formato 'assertivas'" });
    }
    const base = normalizar(q.enunciadoBase);
    const variantes = q.variantesEnunciado.map(normalizar);
    if (variantes.some((v) => v === base) || new Set(variantes).size !== variantes.length) {
      ctx.addIssue({ code: "custom", path: ["variantesEnunciado"], message: "variantes devem diferir do enunciado base e entre si" });
    }
  });

export const LoteSchema = z.strictObject({
  materiaSlug: MateriaSlugSchema,
  lote: z.number().int().min(1).max(99),
  questoes: z.array(QuestaoSchema).min(1).max(20),
});

export const TextoApoioSchema = z.strictObject({
  id: z.string().regex(/^[a-z]+(?:-[a-z]+)*-t\d{2}$/, "id no formato prefixo-tNN"),
  titulo: z.string().trim().min(3),
  idioma: z.enum(["pt", "en"]),
  genero: z.string().trim().min(3),
  fonte: z.string().trim().min(3),
  paragrafos: z.array(z.string().trim().min(20)).min(1).max(12),
});

export const TextosArquivoSchema = z.strictObject({
  materiaSlug: MateriaSlugSchema,
  textos: z.array(TextoApoioSchema).min(1),
});

export const NotaExemploSchema = z.strictObject({
  id: z.string().regex(/^nota-[a-z0-9-]+$/),
  materiaSlug: MateriaSlugSchema,
  titulo: z.string().trim().min(3),
  subtopico: z.string().trim().min(3),
  /** Coluna de pistas: perguntas de revisão com resposta curta (viram flashcards). */
  pistas: z.array(FlashcardSchema).min(4).max(12),
  /** Markdown simples: ## títulos, parágrafos, "- " listas, "- [ ] " checklists, "> " citações, **negrito**, ==destaque==. */
  conteudoMarkdown: z.string().trim().min(400),
  sintese: z.string().trim().min(80),
  fontes: z.array(z.string().trim().min(3)).min(1),
});

export const ItemEspelhoSchema = z.strictObject({
  id: z.string().trim().min(1),
  descricao: z.string().trim().min(15),
  pontos: z.number().positive(),
  palavrasChave: z.array(z.string().trim().min(2)).min(1),
});

export const PilarEspelhoSchema = z.strictObject({
  id: z.enum(["fundamento", "aplicacao", "conclusao"]),
  titulo: z.string().trim().min(5),
  pontos: z.number().positive(),
  itens: z.array(ItemEspelhoSchema).min(2),
});

export const CasoDiscursivoSchema = z
  .strictObject({
    id: z.string().regex(/^caso-\d{2}$/),
    titulo: z.string().trim().min(5),
    materiasRelacionadas: z.array(MateriaSlugSchema).min(2),
    contexto: z.array(z.string().trim().min(40)).min(2),
    comando: z.string().trim().min(40),
    itensComando: z.array(z.string().trim().min(10)).min(2).max(5),
    limiteLinhas: z.number().int().min(15).max(40),
    tempoSugeridoMin: z.number().int().min(30).max(120),
    espelho: z.strictObject({ pilares: z.array(PilarEspelhoSchema).length(3) }),
    respostaPadrao: z.array(z.string().trim().min(40)).min(3),
    errosComuns: z.array(z.string().trim().min(10)).min(2),
    fundamentacao: z.array(z.string().trim().min(3)).min(1),
    revisarFonteOficial: z.boolean().optional(),
  })
  .superRefine((c, ctx) => {
    const total = c.espelho.pilares.reduce((s, p) => s + p.pontos, 0);
    if (Math.abs(total - 70) > 0.001) {
      ctx.addIssue({ code: "custom", path: ["espelho"], message: `os 3 pilares devem somar 70 pontos (somam ${total})` });
    }
    c.espelho.pilares.forEach((p, i) => {
      const soma = p.itens.reduce((s, it) => s + it.pontos, 0);
      if (Math.abs(soma - p.pontos) > 0.001) {
        ctx.addIssue({ code: "custom", path: ["espelho", "pilares", i], message: `itens do pilar "${p.id}" somam ${soma}, esperado ${p.pontos}` });
      }
    });
    const ids = c.espelho.pilares.map((p) => p.id).sort().join(",");
    if (ids !== "aplicacao,conclusao,fundamento") {
      ctx.addIssue({ code: "custom", path: ["espelho", "pilares"], message: "pilares devem ser fundamento, aplicacao e conclusao" });
    }
  });

export type Nivel = z.infer<typeof NivelSchema>;
export type Formato = z.infer<typeof FormatoSchema>;
export type Procedencia = z.infer<typeof ProcedenciaSchema>;
export type AlternativaId = z.infer<typeof AlternativaIdSchema>;
export type Alternativa = z.infer<typeof AlternativaSchema>;
export type Assertiva = z.infer<typeof AssertivaSchema>;
export type Questao = z.infer<typeof QuestaoSchema>;
export type Lote = z.infer<typeof LoteSchema>;
export type TextoApoio = z.infer<typeof TextoApoioSchema>;
export type TextosArquivo = z.infer<typeof TextosArquivoSchema>;
export type NotaExemplo = z.infer<typeof NotaExemploSchema>;
export type CasoDiscursivo = z.infer<typeof CasoDiscursivoSchema>;
export type PilarEspelho = z.infer<typeof PilarEspelhoSchema>;

export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
