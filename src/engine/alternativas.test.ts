import { describe, expect, it } from "vitest";
import { questaoFake } from "@/test/fixtures";
import { letraDaCorreta, permutarAlternativas } from "./alternativas";
import { embaralhar, geradorDe, hashString } from "./rng";

describe("rng", () => {
  it("é determinístico para o mesmo seed", () => {
    expect(hashString("abc")).toBe(hashString("abc"));
    expect(embaralhar([1, 2, 3, 4, 5, 6], geradorDe("s1"))).toEqual(embaralhar([1, 2, 3, 4, 5, 6], geradorDe("s1")));
  });
  it("preserva os elementos", () => {
    expect(embaralhar([1, 2, 3, 4, 5], geradorDe("x")).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("permutarAlternativas", () => {
  const q = questaoFake(7);

  it("é estável dentro da mesma sessão", () => {
    expect(permutarAlternativas(q, "sessao-A")).toEqual(permutarAlternativas(q, "sessao-A"));
  });

  it("varia entre sessões", () => {
    const ordens = new Set(Array.from({ length: 20 }, (_, i) => permutarAlternativas(q, `sessao-${i}`).join(",")));
    expect(ordens.size).toBeGreaterThan(5);
  });

  it("nunca repete a letra do gabarito da exposição anterior", () => {
    for (let i = 0; i < 200; i++) {
      const anterior = letraDaCorreta(q, permutarAlternativas(q, `s-${i}`));
      const nova = letraDaCorreta(q, permutarAlternativas(q, `s-${i + 1000}`, anterior));
      expect(nova).not.toBe(anterior);
    }
  });

  it("distribui o gabarito pelas 5 letras", () => {
    const contagem: Record<string, number> = {};
    for (let i = 0; i < 500; i++) {
      const l = letraDaCorreta(q, permutarAlternativas(q, `dist-${i}`));
      contagem[l] = (contagem[l] ?? 0) + 1;
    }
    expect(Object.keys(contagem).sort()).toEqual(["A", "B", "C", "D", "E"]);
    for (const n of Object.values(contagem)) expect(n).toBeGreaterThan(60);
  });
});
