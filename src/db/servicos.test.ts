import { beforeEach, describe, expect, it } from "vitest";
import { questaoFake } from "@/test/fixtures";
import { classificar } from "@/engine/classificacao";
import { hoje } from "@/engine/datas";
import { db } from "./db";
import {
  bateriaAtiva,
  concluirEtapaDoPacote,
  consolidarDebrief,
  flashcardsVencidos,
  gerarBateriaVariantes,
  gerarDebrief,
  iniciarBateria,
  pacotesVencidos,
  progressoBateria,
  registrarResultadoRevisao,
  registrarTentativa,
  resumoDaMateria,
} from "./servicos";

async function responder(bateriaId: string, questaoId: string, acertou: boolean, confianca: 1 | 2 | 3, dia = hoje()) {
  return registrarTentativa({
    questaoId,
    materiaSlug: "banco-de-dados",
    bateriaId,
    contexto: "estudo",
    modo: "padrao",
    sessaoId: "s1",
    varianteIdx: -1,
    ordem: ["opt-1", "opt-2", "opt-3", "opt-4", "opt-5"],
    letraCorreta: "A",
    escolhidaId: "opt-1",
    riscadas: [],
    confianca,
    acertou,
    resultado: classificar(acertou, confianca),
    tempoMs: 30_000,
    dia,
    respondidaEm: Date.now(),
  });
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  await db.questoes.bulkPut(Array.from({ length: 12 }, (_, i) => ({ ...questaoFake(i + 1), procedencia: "banco-inicial" as const, loteChave: "banco-de-dados/lote-01" })));
});

describe("fluxo diário: bateria → debrief → pacote SRS", () => {
  it("bateria retoma de onde parou e conclui ao responder tudo", async () => {
    const b = await iniciarBateria("banco-de-dados", 10);
    expect(b.questaoIds).toHaveLength(12);
    for (const id of b.questaoIds.slice(0, 3)) await responder(b.id, id, true, 1);
    const p = await progressoBateria(b.id);
    expect(p?.respondidas).toHaveLength(3);
    expect(p?.proximaQuestaoId).toBe(b.questaoIds[3]);
    const mesma = await iniciarBateria("banco-de-dados", 15);
    expect(mesma.id).toBe(b.id);
    for (const id of b.questaoIds.slice(3)) await responder(b.id, id, true, 1);
    expect((await db.baterias.get(b.id))?.concluidaEm).toBeDefined();
    expect(await bateriaAtiva("banco-de-dados")).toBeUndefined();
  });

  it("consolidar o dia cria pacote só com erros e acertos frágeis, e flashcards deles", async () => {
    const b = await iniciarBateria("banco-de-dados", 10);
    const [q1, q2, q3, q4] = b.questaoIds;
    await responder(b.id, q1!, true, 1); // sólido
    await responder(b.id, q2!, true, 3); // frágil
    await responder(b.id, q3!, false, 2); // erro
    await responder(b.id, q4!, false, 1); // erro convicto
    const debrief = await gerarDebrief(b.id);
    expect(debrief.tentativaIds).toHaveLength(4);
    expect(debrief.resumoOuro).toContain("•");
    const pacote = await consolidarDebrief(debrief.id);
    expect(pacote.itens.map((i) => i.questaoId).sort()).toEqual([q2, q3, q4].sort());
    expect(pacote.etapas).toHaveLength(5);
    expect(pacote.questoesDaBateria).toHaveLength(4);
    const cards = await db.flashcards.toArray();
    expect(cards.map((c) => c.refId).sort()).toEqual([q2, q3, q4].sort());
    expect(await consolidarDebrief(debrief.id)).toMatchObject({ id: pacote.id });
  });

  it("revisão registra resultados e reancora a próxima etapa", async () => {
    const b = await iniciarBateria("banco-de-dados", 10);
    await responder(b.id, b.questaoIds[0]!, false, 2, "2026-10-28");
    const d = await gerarDebrief(b.id, "2026-10-28");
    const pacote = await consolidarDebrief(d.id);
    expect(await pacotesVencidos("2026-10-28")).toHaveLength(0);
    expect(await pacotesVencidos("2026-10-29")).toHaveLength(1);
    await registrarResultadoRevisao(pacote.id, b.questaoIds[0]!, "ACERTO_SOLIDO", "2026-10-29");
    const depois = await concluirEtapaDoPacote(pacote.id, "erros-frageis", "2026-10-29");
    expect(depois?.etapas.find((e) => !e.concluidaEm)?.dataPrevista).toBe("2026-10-31");
    expect(await flashcardsVencidos("2026-10-28")).toHaveLength(1);
  });

  it("nova bateria de variantes encerra a ativa e marca ~30% em mutação", async () => {
    const b1 = await iniciarBateria("banco-de-dados", 10);
    const b2 = await gerarBateriaVariantes("banco-de-dados");
    expect((await db.baterias.get(b1.id))?.concluidaEm).toBeDefined();
    expect(b2.tipo).toBe("variantes");
    expect(b2.ciclo).toBe(2);
    expect(b2.mutacao).toHaveLength(4);
    const r = await resumoDaMateria("banco-de-dados");
    expect(r.bateriasFechadas).toBe(1);
  });
});
