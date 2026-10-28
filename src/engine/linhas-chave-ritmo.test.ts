import { describe, expect, it } from "vitest";
import { analisarFolha, quebrarEmLinhas } from "./linhas";
import { detectarPalavrasChave } from "./palavrasChave";
import { calcularRitmo } from "./ritmo";
import { avaliarCard, cardNovo } from "./flashcardSrs";

describe("linhas da folha FCC", () => {
  it("quebra por palavra respeitando a largura", () => {
    const linhas = quebrarEmLinhas("aaaaaaaaa bbbbbbbbb ccccccccc", 20);
    expect(linhas).toEqual(["aaaaaaaaa bbbbbbbbb", "ccccccccc"]);
  });
  it("cada parágrafo começa em linha nova", () => {
    expect(quebrarEmLinhas("um\ndois", 70)).toEqual(["um", "dois"]);
  });
  it("conta excedentes e o que fica dentro do limite", () => {
    const texto = Array.from({ length: 35 }, (_, i) => `Parágrafo ${i}`).join("\n");
    const a = analisarFolha(texto, 30);
    expect(a.total).toBe(35);
    expect(a.excedentes).toBe(5);
    expect(a.dentroDoLimite.split("\n")).toHaveLength(30);
  });
});

describe("palavras-chave do espelho", () => {
  it("ignora acentos e caixa e aceita alternativas", () => {
    const r = detectarPalavrasChave("Deve-se elaborar o Relatório de Impacto e anonimizar os dados.", ["RIPD|relatório de impacto", "anonimização", "ANPD"]);
    expect(r.encontradas).toEqual(["RIPD|relatório de impacto", "anonimização"]);
    expect(r.ausentes).toEqual(["ANPD"]);
  });
});

describe("ritmo até a prova", () => {
  it("o limite da escada completa é 15/12/2026", () => {
    const r = calcularRitmo("2026-10-28", 700);
    expect(r.limiteEscadaCompleta).toBe("2026-12-15");
    expect(r.questoesPorDia).toBe(15);
    expect(r.status).toBe("em-dia");
  });
  it("sem questões restantes, o ciclo está concluído", () => {
    expect(calcularRitmo("2026-11-01", 0).status).toBe("concluido");
  });
});

describe("flashcards (SM-2 simplificado)", () => {
  it("bom cresce 1 → 3 → ×facilidade; difícil volta para amanhã", () => {
    let c = cardNovo("2026-10-28");
    c = avaliarCard(c, "bom", "2026-10-28");
    expect(c.intervaloDias).toBe(1);
    c = avaliarCard(c, "bom", "2026-10-29");
    expect(c.intervaloDias).toBe(3);
    c = avaliarCard(c, "bom", "2026-11-01");
    expect(c.intervaloDias).toBe(8);
    c = avaliarCard(c, "dificil", "2026-11-09");
    expect(c).toMatchObject({ intervaloDias: 1, vencimento: "2026-11-10", lapsos: 1, repeticoes: 0 });
  });
});
