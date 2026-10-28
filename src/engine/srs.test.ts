import { describe, expect, it } from "vitest";
import { concluirEtapa, criarPacote, etapaAtual, itensParaRevisar, pacoteVencido, registrarResultadoItem } from "./srs";

const base = {
  id: "p1",
  materiaSlug: "banco-de-dados",
  bateriaId: "b1",
  debriefId: "d1",
  dataProva: "2027-01-17",
  questoesDaBateria: ["bd-001", "bd-002", "bd-003"],
  itens: [
    { questaoId: "bd-001", resultado: "ERRO" as const },
    { questaoId: "bd-002", resultado: "ACERTO_FRAGIL" as const },
  ],
};

describe("pacote de revisão", () => {
  it("agenda +1, +3, +7, +15, +30 a partir da consolidação", () => {
    const p = criarPacote({ ...base, dia: "2026-10-28" });
    expect(p.etapas.map((e) => e.dataPrevista)).toEqual(["2026-10-29", "2026-10-31", "2026-11-04", "2026-11-12", "2026-11-27"]);
  });

  it("comprime para D-3 a etapa que passaria da prova e descarta as seguintes", () => {
    const p = criarPacote({ ...base, dia: "2026-12-20" });
    // +1 21/12, +3 23/12, +7 27/12, +15 04/01, +30 19/01 (depois da prova) → final em 14/01
    expect(p.etapas.map((e) => e.dataPrevista)).toEqual(["2026-12-21", "2026-12-23", "2026-12-27", "2027-01-04", "2027-01-14"]);
    expect(p.etapas.at(-1)?.final).toBe(true);
  });

  it("15/12 é o último dia para a escada completa caber até D-3", () => {
    const p = criarPacote({ ...base, dia: "2026-12-15" });
    expect(p.etapas.at(-1)).toMatchObject({ dataPrevista: "2027-01-14", offsetDias: 30 });
    expect(p.etapas.at(-1)?.final).toBeUndefined();
  });

  it("pacote criado na reta final ganha uma única revisão no dia seguinte", () => {
    const p = criarPacote({ ...base, dia: "2027-01-15" });
    expect(p.etapas).toHaveLength(1);
    expect(p.etapas[0]?.dataPrevista).toBe("2027-01-16");
  });

  it("vence na data prevista e não antes", () => {
    const p = criarPacote({ ...base, dia: "2026-10-28" });
    expect(pacoteVencido(p, "2026-10-28")).toBe(false);
    expect(pacoteVencido(p, "2026-10-29")).toBe(true);
  });

  it("gradua o item após 2 acertos sólidos seguidos", () => {
    let p = criarPacote({ ...base, dia: "2026-10-28" });
    p = registrarResultadoItem(p, "bd-001", "ACERTO_SOLIDO", "2026-10-29");
    expect(itensParaRevisar(p)).toHaveLength(2);
    p = registrarResultadoItem(p, "bd-001", "ACERTO_SOLIDO", "2026-10-31");
    expect(itensParaRevisar(p).map((i) => i.questaoId)).toEqual(["bd-002"]);
  });

  it("acerto frágil zera a sequência; 2 erros tornam o item crítico", () => {
    let p = criarPacote({ ...base, dia: "2026-10-28" });
    p = registrarResultadoItem(p, "bd-002", "ACERTO_SOLIDO", "2026-10-29");
    p = registrarResultadoItem(p, "bd-002", "ACERTO_FRAGIL", "2026-10-31");
    expect(p.itens.find((i) => i.questaoId === "bd-002")?.solidosSeguidos).toBe(0);
    p = registrarResultadoItem(p, "bd-001", "ERRO", "2026-10-29");
    p = registrarResultadoItem(p, "bd-001", "ERRO_CONVICTO", "2026-10-31");
    expect(p.itens.find((i) => i.questaoId === "bd-001")?.estado).toBe("critico");
  });

  it("etapa feita com atraso reancora as seguintes na data real", () => {
    let p = criarPacote({ ...base, dia: "2026-10-28" });
    p = concluirEtapa(p, "2026-11-02", "erros-frageis"); // +1 previsto 29/10, feito 02/11 (offset 1)
    // próxima: +3 → 02/11 + (3 − 1) = 04/11
    expect(etapaAtual(p)?.dataPrevista).toBe("2026-11-04");
    expect(p.etapas.filter((e) => e.concluidaEm)).toHaveLength(1);
  });

  it("concluir a revisão final encerra o pacote", () => {
    let p = criarPacote({ ...base, dia: "2027-01-15" });
    p = concluirEtapa(p, "2027-01-16", "flashcards");
    expect(etapaAtual(p)).toBeUndefined();
  });
});
