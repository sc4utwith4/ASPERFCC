import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getMateria, type MateriaSlug } from "../src/data/edital";
import type { Questao, TextoApoio } from "../src/data/schema";
import type { EntradaLote } from "../src/data/validacao";
import { questaoFake } from "../src/test/fixtures";
import {
  avaliarRascunho,
  contextoDeEntradas,
  custoEstimado,
  executarLote,
  gravarResultado,
  jsonSchemaDeSaida,
  montarPedido,
  paraSchemaEstruturado,
  planejarLote,
  type ClienteGerador,
  type ContextoMateria,
  type PedidoGeracao,
  type RespostaGeracao,
} from "./lib/gerador";

const DOCS = { autoria: "# Guia\nRegras de autoria.", exemplo: "{}" };

/** Navegação solta pelo JSON Schema gerado (só para asserções). */
interface NoSchema {
  [chave: string]: NoSchema | undefined;
}

function entrada(slug: MateriaSlug, lote: number, questoes: Questao[]): EntradaLote {
  return { arquivo: `src/data/questions/${slug}/lote-${String(lote).padStart(2, "0")}.json`, materiaEsperada: slug, conteudo: { materiaSlug: slug, lote, questoes } };
}

function faixa(de: number, ate: number, slug: MateriaSlug = "banco-de-dados", extra: (n: number) => Partial<Questao> = () => ({})): Questao[] {
  return Array.from({ length: ate - de + 1 }, (_, k) => questaoFake(de + k, slug, extra(de + k)));
}

/** Banco de Dados com o lote 1 (bd-001 a bd-010) já gravado. */
function contextoBd(): ContextoMateria {
  return contextoDeEntradas("banco-de-dados", [entrada("banco-de-dados", 1, faixa(1, 10))]);
}

function respostaJson(questoes: Questao[], textosNovos: TextoApoio[] = []): string {
  return JSON.stringify({ questoes, textosNovos });
}

function texto(id: string, idioma: "pt" | "en" = "pt"): TextoApoio {
  return { id, titulo: `Texto ${id}`, idioma, genero: "ensaio", fonte: "Texto elaborado para fins didáticos", paragrafos: ["Primeiro parágrafo do texto de apoio, com conteúdo suficiente.", "Segundo parágrafo do texto de apoio, também com conteúdo."] };
}

function clienteFake(respostas: Array<Partial<RespostaGeracao> & { texto: string }>): ClienteGerador & { pedidos: PedidoGeracao[] } {
  const pedidos: PedidoGeracao[] = [];
  let i = 0;
  return {
    pedidos,
    async gerar(pedido) {
      pedidos.push(pedido);
      const r = respostas[Math.min(i++, respostas.length - 1)]!;
      return { stopReason: "end_turn", modelo: "modelo-fake", fallbackUsado: false, uso: { entrada: 1000, saida: 20_000, cacheEscrita5m: 0, cacheEscrita1h: 0, cacheLeitura: 0 }, ...r };
    },
  };
}

describe("planejarLote", () => {
  it("usa o próximo número de lote e a faixa de ids correspondente", () => {
    const plano = planejarLote(contextoBd());
    expect(plano.lote).toBe(2);
    expect(plano.ids[0]).toBe("bd-011");
    expect(plano.ids.at(-1)).toBe("bd-020");
    expect(plano.arquivo).toBe("src/data/questions/banco-de-dados/lote-02.json");
    expect(plano.subtopicos.reduce((s, x) => s + x.quantidade, 0)).toBe(10);
  });

  it("prioriza os subtópicos menos cobertos e respeita lotes já reservados", () => {
    const ctx = contextoBd();
    const primeiro = planejarLote(ctx);
    const segundo = planejarLote(ctx, { reservados: [primeiro] });
    expect(segundo.lote).toBe(3);
    // 13 subtópicos, 10 já cobertos uma vez: os 3 descobertos vêm primeiro.
    const cobertos = new Set(ctx.questoes.map((q) => q.subtopico));
    const descobertos = getMateria("banco-de-dados").subtopicos.filter((s) => !cobertos.has(s));
    expect(descobertos).toHaveLength(3);
    for (const s of descobertos) expect(primeiro.subtopicos.map((x) => x.subtopico)).toContain(s);
    // O 2º lote não repete a prioridade do 1º: os descobertos já estão reservados.
    expect(segundo.subtopicos.map((x) => x.subtopico)).not.toEqual(primeiro.subtopicos.map((x) => x.subtopico));
  });

  it("rejeita subtópico fora da taxonomia e planeja textos novos em Português", () => {
    expect(() => planejarLote(contextoBd(), { subtopicos: ["Inexistente"] })).toThrow(/fora da taxonomia/);
    const ctx = contextoDeEntradas("lingua-portuguesa", [], [texto("lp-t01")]);
    const plano = planejarLote(ctx);
    expect(plano.idsTextosNovos).toEqual(["lp-t02", "lp-t03"]);
    expect(plano.formatos["caso-pratico"]).toBe(0);
  });
});

describe("schema da saída estruturada", () => {
  it("mantém enum e const, move restrições não suportadas para a descrição e fecha objetos", () => {
    const r = paraSchemaEstruturado({
      $schema: "x",
      type: "object",
      properties: { a: { type: "string", enum: ["x", "y"], minLength: 2 }, b: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 } },
      required: ["a"],
    }) as NoSchema;
    expect(r.$schema).toBeUndefined();
    expect(r.additionalProperties).toBe(false);
    expect(r.properties?.a?.enum).toEqual(["x", "y"]);
    expect(r.properties?.a?.description).toContain("minLength");
    expect(r.properties?.b?.minItems).toBeUndefined();
    expect(r.properties?.b?.description).toContain("minItems: 2");
    const comEnum = paraSchemaEstruturado({ type: "string", enum: ["x"] }) as NoSchema;
    expect(comEnum.enum).toEqual(["x"]);
    expect((paraSchemaEstruturado({ type: "string", enum: ["x"] }, { simples: true }) as NoSchema).enum).toBeUndefined();
  });

  it("fixa slug e subtópicos da matéria e não expõe procedencia", () => {
    const schema = jsonSchemaDeSaida("banco-de-dados") as NoSchema;
    const questao = schema.properties?.questoes?.items;
    expect(questao?.properties?.materiaSlug?.const).toBe("banco-de-dados");
    expect(questao?.properties?.subtopico?.enum).toContain("Álgebra relacional");
    expect(questao?.properties?.procedencia).toBeUndefined();
    expect(JSON.stringify(schema)).not.toContain('"minLength"');
  });

  it("monta o system em dois blocos com cache e lista os enunciados existentes", () => {
    const ctx = contextoBd();
    const pedido = montarPedido(planejarLote(ctx), ctx, DOCS);
    expect(pedido.sistema).toHaveLength(2);
    expect(pedido.sistema.every((b) => b.cache)).toBe(true);
    expect(pedido.mensagem).toContain("bd-011");
    expect(pedido.mensagem).toContain(questaoFake(3).enunciadoBase.slice(0, 40));
  });
});

describe("avaliarRascunho", () => {
  it("aprova um lote válido e marca procedencia gerador-ia", () => {
    const ctx = contextoBd();
    const plano = planejarLote(ctx);
    const r = avaliarRascunho(respostaJson(faixa(11, 20)), plano, ctx);
    expect(r.erros).toEqual([]);
    expect(r.lote?.questoes).toHaveLength(10);
    expect(r.lote?.questoes.every((q) => q.procedencia === "gerador-ia")).toBe(true);
  });

  it("reprova JSON inválido, ids fora do plano e enunciado duplicado do banco", () => {
    const ctx = contextoBd();
    const plano = planejarLote(ctx);
    expect(avaliarRascunho("{ quebrado", plano, ctx).erros[0]?.mensagem).toMatch(/JSON válido/);

    const ids = avaliarRascunho(respostaJson(faixa(21, 30)), plano, ctx);
    expect(ids.erros.some((e) => /faltam os ids/.test(e.mensagem))).toBe(true);

    const duplicada = faixa(11, 20, "banco-de-dados", (n) => (n === 11 ? { enunciadoBase: questaoFake(1).enunciadoBase } : {}));
    const dup = avaliarRascunho(respostaJson(duplicada), plano, ctx);
    expect(dup.lote).toBeUndefined();
    expect(dup.erros.some((e) => /quase idênticos: bd-001 e bd-011/.test(e.mensagem))).toBe(true);
  });

  it("reprova lote em que a correta é a mais longa em mais de 4 questões", () => {
    const ctx = contextoBd();
    const plano = planejarLote(ctx);
    const viciadas = faixa(11, 20, "banco-de-dados", (n) => {
      if (n > 15) return {};
      const q = questaoFake(n);
      return { alternativas: q.alternativas.map((a) => (a.correta ? { ...a, texto: `${a.texto}, com um complemento que a deixa bem mais longa` } : a)) };
    });
    const r = avaliarRascunho(respostaJson(viciadas), plano, ctx);
    expect(r.erros.some((e) => /mais longa em 5 de 10/.test(e.mensagem))).toBe(true);
  });

  it("exige que cada texto novo seja usado e esteja no idioma da matéria", () => {
    const ctx = contextoDeEntradas("lingua-portuguesa", [], [texto("lp-t01")]);
    const plano = planejarLote(ctx);
    const questoes = faixa(1, 10, "lingua-portuguesa", (n) => (n <= 3 ? { textoApoioId: "lp-t02" } : {}));
    const r = avaliarRascunho(respostaJson(questoes, [texto("lp-t02"), texto("lp-t03", "en")]), plano, ctx);
    expect(r.erros.some((e) => /lp-t03/.test(e.local) && /não é usado/.test(e.mensagem))).toBe(true);
    expect(r.erros.some((e) => /idioma deve ser "pt"/.test(e.mensagem))).toBe(true);
  });
});

describe("executarLote", () => {
  it("devolve os problemas ao modelo e aprova na tentativa de reparo", async () => {
    const ctx = contextoBd();
    const plano = planejarLote(ctx);
    const pedido = montarPedido(plano, ctx, DOCS);
    const cliente = clienteFake([{ texto: respostaJson(faixa(21, 30)) }, { texto: respostaJson(faixa(11, 20)) }]);
    const r = await executarLote(cliente, plano, ctx, pedido, { maxReparos: 2 });
    expect(r.status).toBe("aprovado");
    expect(cliente.pedidos).toHaveLength(2);
    expect(cliente.pedidos[1]!.mensagem).toContain("reprovada pelo validador");
    expect(cliente.pedidos[1]!.mensagem).toContain("faltam os ids");
    expect(cliente.pedidos[1]!.sistema).toEqual(pedido.sistema);
  });

  it("para na recusa sem reparar e esgota as tentativas quando nada passa", async () => {
    const ctx = contextoBd();
    const plano = planejarLote(ctx);
    const pedido = montarPedido(plano, ctx, DOCS);
    const recusa = clienteFake([{ texto: "", stopReason: "refusal", recusa: { categoria: "cyber" } }]);
    const r1 = await executarLote(recusa, plano, ctx, pedido, { maxReparos: 2 });
    expect(r1.status).toBe("recusado");
    expect(recusa.pedidos).toHaveLength(1);
    expect(r1.erros[0]?.mensagem).toContain("cyber");

    const ruim = clienteFake([{ texto: "{}" }]);
    const r2 = await executarLote(ruim, plano, ctx, pedido, { maxReparos: 1 });
    expect(r2.status).toBe("reprovado");
    expect(ruim.pedidos).toHaveLength(2);
  });

  it("refaz o pedido quando a resposta vem truncada e aproveita a 1ª resposta do batch", async () => {
    const ctx = contextoBd();
    const plano = planejarLote(ctx);
    const pedido = montarPedido(plano, ctx, DOCS);
    const cliente = clienteFake([{ texto: respostaJson(faixa(11, 20)) }]);
    const r = await executarLote(cliente, plano, ctx, pedido, {
      maxReparos: 2,
      primeiraResposta: { texto: '{"questoes": [', stopReason: "max_tokens", modelo: "x", fallbackUsado: false, uso: { entrada: 0, saida: 0, cacheEscrita5m: 0, cacheEscrita1h: 0, cacheLeitura: 0 } },
    });
    expect(r.status).toBe("aprovado");
    expect(cliente.pedidos).toHaveLength(1);
    expect(cliente.pedidos[0]!.mensagem).toContain("limite de tokens");
  });
});

describe("gravarResultado", () => {
  it("grava o lote aprovado e acrescenta os textos novos ao arquivo da matéria", async () => {
    const raiz = mkdtempSync(join(tmpdir(), "gerador-"));
    mkdirSync(join(raiz, "src/data/textos"), { recursive: true });
    writeFileSync(join(raiz, "src/data/textos/lingua-portuguesa.json"), JSON.stringify({ materiaSlug: "lingua-portuguesa", textos: [texto("lp-t01")] }));
    const ctx = contextoDeEntradas("lingua-portuguesa", [], [texto("lp-t01")]);
    const plano = planejarLote(ctx);
    const questoes = faixa(1, 10, "lingua-portuguesa", (n) => ({ textoApoioId: n <= 5 ? "lp-t02" : "lp-t03" }));
    const r = await executarLote(clienteFake([{ texto: respostaJson(questoes, [texto("lp-t02"), texto("lp-t03")]) }]), plano, ctx, montarPedido(plano, ctx, DOCS), { maxReparos: 0 });
    expect(r.status).toBe("aprovado");
    const gravados = gravarResultado(raiz, r);
    expect(gravados).toEqual(["src/data/questions/lingua-portuguesa/lote-01.json", "src/data/textos/lingua-portuguesa.json"]);
    const lote = JSON.parse(readFileSync(join(raiz, gravados[0]!), "utf8"));
    expect(lote.questoes[0].procedencia).toBe("gerador-ia");
    const textos = JSON.parse(readFileSync(join(raiz, gravados[1]!), "utf8"));
    expect(textos.textos.map((t: TextoApoio) => t.id)).toEqual(["lp-t01", "lp-t02", "lp-t03"]);
  });

  it("manda o reprovado para rascunhos/ com relatório", async () => {
    const raiz = mkdtempSync(join(tmpdir(), "gerador-"));
    const ctx = contextoBd();
    const plano = planejarLote(ctx);
    const r = await executarLote(clienteFake([{ texto: respostaJson(faixa(21, 30)) }]), plano, ctx, montarPedido(plano, ctx, DOCS), { maxReparos: 0 });
    const gravados = gravarResultado(raiz, r, 0.42);
    expect(gravados).toEqual(["src/data/questions/banco-de-dados/rascunhos/lote-02.json", "src/data/questions/banco-de-dados/rascunhos/lote-02.relatorio.md"]);
    expect(existsSync(join(raiz, plano.arquivo))).toBe(false);
    const relatorio = readFileSync(join(raiz, gravados[1]!), "utf8");
    expect(relatorio).toContain("reprovado");
    expect(relatorio).toContain("US$ 0.42");
    expect(relatorio).toContain("faltam os ids");
  });
});

describe("custoEstimado", () => {
  it("usa a tabela do Opus 5.5 e aplica 50% no batch", () => {
    const milhao = { entrada: 1_000_000, saida: 1_000_000, cacheEscrita5m: 0, cacheEscrita1h: 1_000_000, cacheLeitura: 1_000_000 };
    expect(custoEstimado(milhao)).toBeCloseTo(4 + 20 + 8 + 0.2);
    expect(custoEstimado(milhao, { batch: true })).toBeCloseTo((4 + 20 + 8 + 0.2) / 2);
  });
});
