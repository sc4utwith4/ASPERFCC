import { carregarNotasExemplo, listarLotesEmbutidos } from "@/data/banco";
import { markdownParaTiptap } from "@/data/markdown";
import { LoteSchema } from "@/data/schema";
import { cardNovo } from "@/engine/flashcardSrs";
import { hoje } from "@/engine/datas";
import { hashString, novoId } from "@/engine/rng";
import { db, gravarConfig, lerConfig, type QuestaoRegistro } from "./db";

export interface ProgressoSeed {
  etapa: string;
  feito: number;
  total: number;
}

export interface ResultadoSeed {
  lotesAtualizados: number;
  lotesRemovidos: number;
  questoesNoBanco: number;
  lotesInvalidos: string[];
}

/**
 * Seeder assíncrono: sincroniza os lotes embutidos no build com o IndexedDB
 * sem tocar no progresso do estudante. Só regrava um lote quando o conteúdo
 * (hash do JSON) mudou; remove lotes embutidos que deixaram de existir.
 */
export async function semearBanco(onProgresso?: (p: ProgressoSeed) => void): Promise<ResultadoSeed> {
  const lotes = listarLotesEmbutidos();
  const total = lotes.length + 2;
  const existentes = new Map((await db.lotes.where("origem").equals("embutido").toArray()).map((l) => [l.chave, l]));
  const resultado: ResultadoSeed = { lotesAtualizados: 0, lotesRemovidos: 0, questoesNoBanco: 0, lotesInvalidos: [] };
  let feito = 0;

  for (const lote of lotes) {
    onProgresso?.({ etapa: `Banco de questões: ${lote.chave}`, feito, total });
    const bruto = await lote.carregar();
    const hash = hashString(bruto).toString(36);
    if (existentes.get(lote.chave)?.hash !== hash) {
      const parsed = LoteSchema.safeParse(JSON.parse(bruto));
      if (!parsed.success) {
        resultado.lotesInvalidos.push(lote.chave);
        console.error(`Lote inválido ignorado: ${lote.chave}`, parsed.error.issues.slice(0, 5));
      } else {
        const registros: QuestaoRegistro[] = parsed.data.questoes.map((q) => ({ ...q, procedencia: q.procedencia ?? "banco-inicial", loteChave: lote.chave }));
        await db.transaction("rw", db.questoes, db.lotes, async () => {
          await db.questoes.where("loteChave").equals(lote.chave).delete();
          await db.questoes.bulkPut(registros);
          await db.lotes.put({ chave: lote.chave, materiaSlug: lote.materiaSlug, lote: lote.lote, origem: "embutido", hash, quantidade: registros.length, atualizadoEm: Date.now() });
        });
        resultado.lotesAtualizados++;
      }
    }
    existentes.delete(lote.chave);
    feito++;
  }

  for (const chave of existentes.keys()) {
    await db.transaction("rw", db.questoes, db.lotes, async () => {
      await db.questoes.where("loteChave").equals(chave).delete();
      await db.lotes.delete(chave);
    });
    resultado.lotesRemovidos++;
  }

  onProgresso?.({ etapa: "Notas Cornell de exemplo", feito: feito++, total });
  await semearNotasExemplo();
  onProgresso?.({ etapa: "Workspace de exemplo", feito, total });
  await semearWorkspaceExemplo();
  onProgresso?.({ etapa: "Pronto", feito: total, total });

  resultado.questoesNoBanco = await db.questoes.count();
  return resultado;
}

async function semearNotasExemplo(): Promise<void> {
  const notas = await carregarNotasExemplo();
  const semeadas = new Set(await lerConfig<string[]>("seed:notas", []));
  const dia = hoje();
  for (const nota of notas) {
    if (semeadas.has(nota.id)) continue;
    const agora = Date.now();
    await db.transaction("rw", db.notas, db.flashcards, async () => {
      await db.notas.put({
        id: nota.id,
        materiaSlug: nota.materiaSlug,
        titulo: nota.titulo,
        subtopico: nota.subtopico,
        pistas: nota.pistas,
        conteudo: markdownParaTiptap(nota.conteudoMarkdown),
        sintese: nota.sintese,
        exemplo: true,
        criadoEm: agora,
        atualizadoEm: agora,
      });
      await db.flashcards.bulkPut(
        nota.pistas.map((p, i) => ({ id: `${nota.id}#${i}`, origem: "nota" as const, refId: nota.id, materiaSlug: nota.materiaSlug, frente: p.pergunta, verso: p.resposta, estado: cardNovo(dia), criadoEm: agora })),
      );
    });
    semeadas.add(nota.id);
  }
  await gravarConfig("seed:notas", [...semeadas]);
}

export const BACKLOG_EXEMPLO = [
  { titulo: "Fechar o bloco de 10 de Banco de Dados", subtarefas: ["Resolver com seletor de confiança", "Ler o Debrief e editar o Resumo de Ouro"] },
  { titulo: "Revisar o pacote +1 de Legislação de TI", subtarefas: ["Modo Erros + Frágeis com Mutação", "Flashcards dos erros convictos"] },
  { titulo: "Estudo de caso: 1 resposta em 60 minutos", subtarefas: ["Respeitar o limite de 30 linhas", "Corrigir pelo espelho"] },
];

export const BRAIN_DUMP_EXEMPLO = ["Conferir no GNOI o texto compilado da RN 13/2016 (CETI)", "Pagar o boleto da inscrição até 09/11"];

async function semearWorkspaceExemplo(): Promise<void> {
  if (await lerConfig("seed:workspace", false)) return;
  const agora = Date.now();
  await db.backlog.bulkPut(
    BACKLOG_EXEMPLO.map((t, i) => ({
      id: novoId("tarefa"),
      titulo: t.titulo,
      feita: false,
      ordem: i,
      subtarefas: t.subtarefas.map((s) => ({ id: novoId("sub"), titulo: s, feita: false })),
      criadoEm: agora + i,
      exemplo: true,
    })),
  );
  await db.brainDump.bulkPut(BRAIN_DUMP_EXEMPLO.map((texto, i) => ({ id: novoId("captura"), texto, criadoEm: agora + i, resolvida: false, exemplo: true })));
  await gravarConfig("seed:workspace", true);
}

/** Remove os dados de exemplo (notas, flashcards de notas, backlog e brain dump marcados como exemplo). */
export async function limparExemplos(): Promise<void> {
  await db.transaction("rw", [db.notas, db.flashcards, db.backlog, db.brainDump], async () => {
    const notas = await db.notas.filter((n) => n.exemplo).toArray();
    await db.notas.bulkDelete(notas.map((n) => n.id));
    await db.flashcards.where("refId").anyOf(notas.map((n) => n.id)).delete();
    await db.backlog.filter((t) => !!t.exemplo).delete();
    await db.brainDump.filter((c) => !!c.exemplo).delete();
  });
}
