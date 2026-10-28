import { describe, expect, it } from "vitest";
import { questaoFake } from "@/test/fixtures";
import { QuestaoSchema, chaveExata, type Questao } from "./schema";
import { afirmativasCitadas, validarLotes, validarQuestaoNoContexto } from "./validacao";

function assertivas(verdadeiras: boolean[], correta: string, outras: string[], comandoFinal = "Está correto o que se afirma APENAS em"): Questao {
  const base = questaoFake(1);
  const textos = [correta, ...outras];
  return {
    ...base,
    formato: "assertivas",
    assertivas: verdadeiras.map((v, i) => ({ texto: `Afirmativa número ${i + 1} do teste`, verdadeira: v, explicacao: `Explicação da afirmativa ${i + 1}, longa o bastante.` })),
    comandoFinal,
    alternativas: base.alternativas.map((a, i) => ({ ...a, correta: i === 0, texto: textos[i]!, explicacaoDetalhada: `${i === 0 ? "CORRETA" : "INCORRETA"}. Explicação detalhada da alternativa ${i + 1}, longa o bastante para o schema.`, versaoInvertidaFalsa: i === 0 ? "Versão invertida e falsa da alternativa correta." : undefined })),
  };
}

const CTX = { textosPorMateria: undefined };
const erros = (q: Questao) => validarQuestaoNoContexto(q, { materiaSlug: q.materiaSlug, lote: 1 }, "q", CTX).filter((p) => p.severidade === "erro");

describe("igualdade de alternativas", () => {
  it("diferencia acentos e pontuação (crase, acentuação)", () => {
    expect(chaveExata("à − a − às")).not.toBe(chaveExata("a − a − as"));
    expect(chaveExata("  Contêm ")).toBe(chaveExata("contêm"));
    const q = questaoFake(1);
    const crase = { ...q, alternativas: q.alternativas.map((a, i) => ({ ...a, texto: ["à", "a", "às", "as", "há"][i]! })) };
    expect(QuestaoSchema.safeParse(crase).success).toBe(true);
  });
});

describe("gabarito das assertivas", () => {
  it("lê as afirmativas citadas numa alternativa", () => {
    expect([...afirmativasCitadas("I e III, apenas.")!]).toEqual([0, 2]);
    expect([...afirmativasCitadas("II, III e IV.")!]).toEqual([1, 2, 3]);
    expect(afirmativasCitadas("Todas as afirmativas.")).toBeUndefined();
  });

  it("aceita gabarito coerente e reprova correta que não bate com as verdadeiras", () => {
    expect(erros(assertivas([true, false, true, false], "I e III, apenas.", ["I e II, apenas.", "II e IV, apenas.", "III e IV, apenas.", "I, II e III, apenas."]))).toEqual([]);
    const errada = erros(assertivas([true, false, true, false], "I e II, apenas.", ["I e III, apenas.", "II e IV, apenas.", "III e IV, apenas.", "I, II e III, apenas."]));
    expect(errada.some((p) => /a alternativa correta cita I, II/.test(p.mensagem))).toBe(true);
    expect(errada.some((p) => /incorreta "I e III, apenas\." também lista/.test(p.mensagem))).toBe(true);
  });

  it("quando o comando pede as incorretas, compara com as falsas", () => {
    const q = assertivas([true, false, true, false], "II e IV, apenas.", ["I e III, apenas.", "I e II, apenas.", "III e IV, apenas.", "I, II e III, apenas."], "Está INCORRETO o que se afirma em");
    expect(erros(q)).toEqual([]);
  });

  it("reprova alternativa que cita afirmativa inexistente", () => {
    const q = assertivas([true, false, true], "I e III, apenas.", ["I e IV, apenas.", "II, apenas.", "III, apenas.", "I e II, apenas."]);
    expect(erros(q).some((p) => /afirmativa inexistente/.test(p.mensagem))).toBe(true);
  });
});

describe("regras de conjunto da matéria", () => {
  const entrada = (questoes: Questao[], lote = 1) => ({ arquivo: `lote-${lote}`, materiaEsperada: "banco-de-dados" as const, conteudo: { materiaSlug: "banco-de-dados", lote, questoes } });

  it("aceita mais de 50 questões e cobra o mínimo só no modo completo", () => {
    const lotes = Array.from({ length: 6 }, (_, l) => entrada(Array.from({ length: 10 }, (_, k) => questaoFake(l * 10 + k + 1, "banco-de-dados", { enunciadoBase: `Caso ${l * 10 + k + 1}: situação totalmente distinta envolvendo o tema ${"abcdefghijklmnopqrstuvwxyz"[(l * 10 + k) % 26]} e o número ${(l * 10 + k + 1) * 7}.` })), l + 1));
    const r60 = validarLotes(lotes, { exigirCompleto: true, materias: ["banco-de-dados"] });
    expect(r60.problemas.some((p) => /questões \(mínimo 50\)/.test(p.mensagem))).toBe(false);
    const r10 = validarLotes(lotes.slice(0, 1), { exigirCompleto: true, materias: ["banco-de-dados"] });
    expect(r10.problemas.some((p) => p.severidade === "erro" && /10 questões \(mínimo 50\)/.test(p.mensagem))).toBe(true);
  });

  it("avisa quando a correta quase nunca é a mais longa (viés inverso)", () => {
    const curtas = Array.from({ length: 3 }, (_, l) =>
      entrada(
        Array.from({ length: 10 }, (_, k) => {
          const n = l * 10 + k + 1;
          const q = questaoFake(n, "banco-de-dados", { enunciadoBase: `Cenário ${n}: questão independente sobre o assunto ${n * 13} do banco.` });
          return { ...q, alternativas: q.alternativas.map((a) => (a.correta ? { ...a, texto: `Curta ${n}` } : a)) };
        }),
        l + 1,
      ),
    );
    const r = validarLotes(curtas, { exigirCompleto: false, materias: ["banco-de-dados"] });
    expect(r.problemas.some((p) => /viés inverso/.test(p.mensagem))).toBe(true);
  });
});
