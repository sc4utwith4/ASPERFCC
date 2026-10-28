import { describe, expect, it } from "vitest";
import { classificar, entraNoCadernoDeRevisao } from "./classificacao";

describe("classificar (regra do Acerto Frágil)", () => {
  it("acerto com certeza é sólido", () => expect(classificar(true, 1)).toBe("ACERTO_SOLIDO"));
  it("acerto com dúvida entre duas é frágil", () => expect(classificar(true, 2)).toBe("ACERTO_FRAGIL"));
  it("acerto no chute é frágil", () => expect(classificar(true, 3)).toBe("ACERTO_FRAGIL"));
  it("erro com certeza é erro convicto", () => expect(classificar(false, 1)).toBe("ERRO_CONVICTO"));
  it("erro com dúvida é erro comum", () => {
    expect(classificar(false, 2)).toBe("ERRO");
    expect(classificar(false, 3)).toBe("ERRO");
  });
  it("frágeis e erros entram obrigatoriamente no Caderno de Revisão", () => {
    expect(entraNoCadernoDeRevisao("ACERTO_FRAGIL")).toBe(true);
    expect(entraNoCadernoDeRevisao("ERRO")).toBe(true);
    expect(entraNoCadernoDeRevisao("ERRO_CONVICTO")).toBe(true);
    expect(entraNoCadernoDeRevisao("ACERTO_SOLIDO")).toBe(false);
  });
});
