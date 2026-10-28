import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { corParaRgb, medir, razaoContraste, reprovados } from "./lib/contraste";

describe("contraste dos tokens", () => {
  it("calcula a razão WCAG de referência", () => {
    expect(razaoContraste(corParaRgb("#000000"), corParaRgb("#FFFFFF"))).toBeCloseTo(21, 5);
    expect(corParaRgb("rgba(0, 0, 0, 0.5)", [255, 255, 255])).toEqual([127.5, 127.5, 127.5]);
  });

  it("todos os pares obrigatórios atingem o alvo nos dois temas", () => {
    const css = readFileSync(join(__dirname, "..", "src", "design", "tokens.css"), "utf8");
    const falhas = reprovados(medir(css)).map((m) => `${m.rotulo}: claro ${m.claro.toFixed(2)}, escuro ${m.escuro.toFixed(2)} (alvo ${m.alvo})`);
    expect(falhas).toEqual([]);
  });
});
