/**
 * Guardas automáticas do design system "Zero Eye-Strain": reprovam no CI o
 * que o spec proíbe (preto/branco puros, gradientes decorativos, animações em
 * loop, sombras pesadas, easing elástico) e conferem que os hex de base
 * continuam exatamente os do spec.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = join(__dirname, "..");
const SRC = join(RAIZ, "src");

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho);
    return /\.(tsx?|css)$/.test(nome) && !/\.test\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

const FONTES = [...arquivos(SRC), join(RAIZ, "index.html")].map((caminho) => ({ caminho: relative(RAIZ, caminho), texto: readFileSync(caminho, "utf8") }));

const PROIBIDOS: { regra: string; padrao: RegExp; soCss?: boolean }[] = [
  { regra: "preto ou branco puro em hex", padrao: /#(?:000(?:000)?|fff(?:fff)?)(?![0-9a-f])/i },
  { regra: "classe utilitária preta ou branca", padrao: /\b(?:bg|text|border|from|via|to|fill|stroke|ring|outline|divide)-(?:black|white)\b/ },
  { regra: "palavra-chave black/white em CSS", padrao: /:\s*(?:black|white)\b/i, soCss: true },
  { regra: "gradiente decorativo", padrao: /\bbg-(?:gradient|linear|radial|conic)-|(?<!repeating-)\b(?:linear|radial|conic)-gradient\(/ },
  { regra: "animação em loop", padrao: /\banimate-(?:spin|pulse|bounce|ping)\b|\binfinite\b/ },
  { regra: "sombra pesada", padrao: /\b(?:shadow-(?:lg|xl|2xl)|drop-shadow(?:-\w+)?)\b/ },
  { regra: "easing elástico (cubic-bezier com overshoot)", padrao: /cubic-bezier\(\s*[\d.]+\s*,\s*(?:-|1\.\d*[1-9])|cubic-bezier\([^)]*,\s*(?:-|1\.\d*[1-9])[\d.]*\s*\)/ },
];

describe("guardas de design", () => {
  for (const { regra, padrao, soCss } of PROIBIDOS) {
    it(`sem ${regra}`, () => {
      const violacoes = FONTES.filter((f) => !soCss || f.caminho.endsWith(".css")).flatMap((f) =>
        f.texto.split("\n").flatMap((linha, i) => (padrao.test(linha) ? [`${f.caminho}:${i + 1}: ${linha.trim().slice(0, 120)}`] : [])),
      );
      expect(violacoes).toEqual([]);
    });
  }

  it("mantém exatamente os hex de base do spec nos dois temas", () => {
    const tokens = readFileSync(join(SRC, "design", "tokens.css"), "utf8");
    const claro = ["#F6F4EE", "#EFECE4", "#FAF8F3", "#222421", "#545852", "#82867F", "#E2DEC9", "#4A6B5B", "#5B6E82", "#B87D4B", "#A85454"];
    const escuro = ["#161816", "#1E211E", "#262A26", "#DCD9CE", "#9E9D95", "#6B6C66", "#2C302C", "#68937D", "#7B93AB"];
    for (const hex of [...claro, ...escuro]) expect(tokens).toContain(hex);
    expect(tokens).toContain("rgba(212, 175, 95, 0.22)");
    expect(tokens).toContain("cubic-bezier(0.22, 1, 0.36, 1)");
  });
});
