import { describe, expect, it } from "vitest";
import { questaoFake } from "@/test/fixtures";
import { avaliarCacaAoErro, itensFalsos, parVersaoInvertida, resultadoJustificativa } from "./mutacao";
import { escolherEnunciado } from "./variantes";

describe("rotação de enunciado", () => {
  const q = questaoFake(3);
  it("primeira exposição usa o enunciado base", () => {
    expect(escolherEnunciado(q, 0)).toEqual({ texto: q.enunciadoBase, varianteIdx: -1 });
  });
  it("revisões alternam as variantes em rodízio", () => {
    expect(escolherEnunciado(q, 1).varianteIdx).toBe(0);
    expect(escolherEnunciado(q, 2).varianteIdx).toBe(1);
    expect(escolherEnunciado(q, 3).varianteIdx).toBe(0);
  });
});

describe("Modo Mutação", () => {
  const q = questaoFake(4);
  it("caça ao erro exige marcar exatamente as 4 incorretas", () => {
    const falsos = new Set(itensFalsos(q));
    expect(falsos.size).toBe(4);
    expect(avaliarCacaAoErro(q, falsos).acertou).toBe(true);
    const faltando = new Set([...falsos].slice(1));
    const r = avaliarCacaAoErro(q, faltando);
    expect(r.acertou).toBe(false);
    expect(r.faltaram).toHaveLength(1);
  });

  it("caça ao erro em assertivas usa as assertivas falsas", () => {
    const qa = questaoFake(5, "governanca-ti", {
      formato: "assertivas",
      comandoFinal: "Está correto o que se afirma em",
      assertivas: [
        { texto: "Assertiva verdadeira um", verdadeira: true, explicacao: "Explicação verdadeira longa o bastante." },
        { texto: "Assertiva falsa dois", verdadeira: false, explicacao: "Explicação falsa longa o bastante aqui." },
        { texto: "Assertiva verdadeira três", verdadeira: true, explicacao: "Explicação verdadeira longa o bastante." },
      ],
    });
    expect(itensFalsos(qa)).toEqual(["assertiva-1"]);
    expect(avaliarCacaAoErro(qa, new Set(["assertiva-1"])).acertou).toBe(true);
  });

  it("versão invertida oferece a fiel e a invertida", () => {
    const par = parVersaoInvertida(q, "seed");
    expect(par.map((p) => p.chave).sort()).toEqual(["fiel", "invertida"]);
  });

  it("justificativa: parcial com alternativa certa vira acerto frágil", () => {
    expect(resultadoJustificativa(true, "correta")).toEqual({ acertou: true, confianca: 1 });
    expect(resultadoJustificativa(true, "parcial")).toEqual({ acertou: true, confianca: 2 });
    expect(resultadoJustificativa(false, "correta").acertou).toBe(false);
  });
});
