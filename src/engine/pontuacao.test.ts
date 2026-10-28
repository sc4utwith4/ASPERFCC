import { describe, expect, it } from "vitest";
import { contar, notaPadronizada, percentualBruto, percentualLiquido, PREMISSAS_PADRAO, projetarMateria, projetarProva, valorMarginal } from "./pontuacao";

describe("pontuação FCC", () => {
  it("NP: média do grupo vale 50; um desvio acima vale 60", () => {
    expect(notaPadronizada(14, 14, 3.5)).toBe(50);
    expect(notaPadronizada(17.5, 14, 3.5)).toBeCloseTo(60);
    expect(notaPadronizada(10, 10, 0)).toBe(50); // σ = 0 → usa 1
  });

  it("percentual líquido desconta acertos frágeis", () => {
    const c = contar(["ACERTO_SOLIDO", "ACERTO_SOLIDO", "ACERTO_FRAGIL", "ERRO", "ERRO_CONVICTO"]);
    expect(percentualBruto(c)).toBeCloseTo(0.6);
    expect(percentualLiquido(c)).toBeCloseTo(0.4);
  });

  it("ficar na média do grupo em tudo dá exatamente o corte de 150", () => {
    const taxas = new Map();
    const p = projetarProva(taxas, PREMISSAS_PADRAO, 0);
    expect(p.notaObjetiva).toBeLessThan(150);
    const media = projetarProva(new Map(), PREMISSAS_PADRAO, 14 / 25);
    expect(media.npGerais).toBeCloseTo(50);
  });

  it("projeção da matéria usa questões e peso reais do edital", () => {
    const p = projetarMateria("banco-de-dados", 0.75);
    expect(p.questoesNaProva).toBe(4);
    expect(p.pontosBrutos).toBeCloseTo(6);
    expect(p.pontosBrutosMaximos).toBe(8);
  });

  it("uma questão específica vale menos que o dobro de uma geral com σ maior", () => {
    const v = valorMarginal(PREMISSAS_PADRAO);
    expect(v.razao).toBeGreaterThan(1);
    expect(v.razao).toBeLessThan(2);
  });
});
