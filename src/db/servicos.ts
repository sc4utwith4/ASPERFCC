import { getMateria, MATERIAS, PROVA, type MateriaSlug } from "@/data/edital";
import type { Questao } from "@/data/schema";
import { dominioPorQuestao, ordemInicial, ordemVariantes, questoesEmMutacao, selecionarSimuladoProvaReal } from "@/engine/bateria";
import { entraNoCadernoDeRevisao, type Resultado } from "@/engine/classificacao";
import { hoje, somarDias, type Dia } from "@/engine/datas";
import { resumoDeOuro, textoResumoDeOuro } from "@/engine/debrief";
import { avaliarCard, cardNovo, type Avaliacao } from "@/engine/flashcardSrs";
import { PREMISSAS_PADRAO, type PremissasGrupo } from "@/engine/pontuacao";
import { novoId } from "@/engine/rng";
import { concluirEtapa, criarPacote, pacoteVencido, registrarResultadoItem, retencao, type ModoRevisao, type PacoteRevisao } from "@/engine/srs";
import type { Letra } from "@/engine/alternativas";
import { db, lerConfig, type Bateria, type Debrief, type Flashcard, type QuestaoRegistro, type Tentativa, type TipoBateria } from "./db";

// ---------------------------------------------------------------- configuração

export async function dataDaProva(): Promise<Dia> {
  return lerConfig<Dia>("dataProva", PROVA.dataProva);
}

export async function premissasGrupo(): Promise<PremissasGrupo> {
  return lerConfig<PremissasGrupo>("premissas", PREMISSAS_PADRAO);
}

// ---------------------------------------------------------------- questões

export async function questoesDaMateria(slug: MateriaSlug): Promise<QuestaoRegistro[]> {
  const lista = await db.questoes.where("materiaSlug").equals(slug).toArray();
  return lista.sort((a, b) => a.id.localeCompare(b.id));
}

export async function mapaDeQuestoes(ids: readonly string[]): Promise<Map<string, QuestaoRegistro>> {
  const lista = await db.questoes.bulkGet([...new Set(ids)]);
  return new Map(lista.filter((q): q is QuestaoRegistro => !!q).map((q) => [q.id, q]));
}

export async function exposicoesAnteriores(questaoId: string): Promise<number> {
  return db.tentativas.where("questaoId").equals(questaoId).count();
}

export async function ultimaLetraCorreta(questaoId: string): Promise<Letra | undefined> {
  const ultimas = await db.tentativas.where("questaoId").equals(questaoId).sortBy("respondidaEm");
  return ultimas.at(-1)?.letraCorreta;
}

// ---------------------------------------------------------------- baterias

const TIPOS_DE_CICLO: TipoBateria[] = ["ciclo", "variantes"];

export async function bateriasDaMateria(slug: MateriaSlug): Promise<Bateria[]> {
  const lista = await db.baterias.where("materiaSlug").equals(slug).toArray();
  return lista.filter((b) => TIPOS_DE_CICLO.includes(b.tipo)).sort((a, b) => a.criadaEm - b.criadaEm);
}

export async function bateriaAtiva(slug: MateriaSlug): Promise<Bateria | undefined> {
  return (await bateriasDaMateria(slug)).filter((b) => !b.concluidaEm).at(-1);
}

/** Inicia (ou retoma) a bateria da matéria. A primeira é o 1º ciclo; as seguintes são de variantes. */
export async function iniciarBateria(slug: MateriaSlug, tamanhoBloco: number): Promise<Bateria> {
  const ativa = await bateriaAtiva(slug);
  if (ativa) {
    // Lotes novos (importados ou gerados) entram no fim da bateria em andamento.
    const presentes = new Set(ativa.questaoIds);
    const novas = (await questoesDaMateria(slug)).map((q) => q.id).filter((id) => !presentes.has(id));
    const questaoIds = novas.length ? [...ativa.questaoIds, ...novas] : ativa.questaoIds;
    if (ativa.tamanhoBloco !== tamanhoBloco || novas.length) await db.baterias.update(ativa.id, { tamanhoBloco, questaoIds });
    return { ...ativa, tamanhoBloco, questaoIds };
  }
  const anteriores = await bateriasDaMateria(slug);
  return anteriores.length === 0 ? criarBateriaCiclo(slug, tamanhoBloco) : gerarBateriaVariantes(slug, tamanhoBloco);
}

async function criarBateriaCiclo(slug: MateriaSlug, tamanhoBloco: number): Promise<Bateria> {
  const questoes = await questoesDaMateria(slug);
  if (!questoes.length) throw new Error(`Não há questões de ${getMateria(slug).nome} no banco.`);
  const seed = novoId("seed");
  const bateria: Bateria = {
    id: novoId("bateria"),
    tipo: "ciclo",
    materiaSlug: slug,
    ciclo: 1,
    questaoIds: ordemInicial(questoes, seed),
    mutacao: [],
    seed,
    tamanhoBloco,
    criadaEm: Date.now(),
    dia: hoje(),
  };
  await db.baterias.add(bateria);
  return bateria;
}

/**
 * "Nova Bateria de Variantes": mesmo pool, ordem pelos itens de menor domínio,
 * enunciados rotacionados (pela contagem de exposições) e ~30% em Modo Mutação.
 */
export async function gerarBateriaVariantes(slug: MateriaSlug, tamanhoBloco = 10): Promise<Bateria> {
  const ativa = await bateriaAtiva(slug);
  if (ativa) {
    await db.baterias.update(ativa.id, { concluidaEm: Date.now(), diaConclusao: hoje() });
  }
  const questoes = await questoesDaMateria(slug);
  const tentativas = await db.tentativas.where("materiaSlug").equals(slug).toArray();
  const seed = novoId("seed");
  const ordem = ordemVariantes(questoes, dominioPorQuestao(tentativas), seed);
  const anteriores = await bateriasDaMateria(slug);
  const bateria: Bateria = {
    id: novoId("bateria"),
    tipo: "variantes",
    materiaSlug: slug,
    ciclo: anteriores.length + 1,
    questaoIds: ordem,
    mutacao: [...questoesEmMutacao(ordem, seed)],
    seed,
    tamanhoBloco,
    criadaEm: Date.now(),
    dia: hoje(),
  };
  await db.baterias.add(bateria);
  return bateria;
}

export interface ProgressoBateria {
  bateria: Bateria;
  respondidas: string[];
  ultimaPorQuestao: Map<string, Tentativa>;
  proximaQuestaoId?: string;
  respondidasHoje: number;
}

export async function progressoBateria(bateriaId: string): Promise<ProgressoBateria | undefined> {
  const bateria = await db.baterias.get(bateriaId);
  if (!bateria) return undefined;
  const tentativas = (await db.tentativas.where("bateriaId").equals(bateriaId).toArray()).sort((a, b) => a.respondidaEm - b.respondidaEm);
  const ultimaPorQuestao = new Map<string, Tentativa>();
  for (const t of tentativas) ultimaPorQuestao.set(t.questaoId, t);
  const dia = hoje();
  return {
    bateria,
    respondidas: [...ultimaPorQuestao.keys()],
    ultimaPorQuestao,
    proximaQuestaoId: bateria.questaoIds.find((id) => !ultimaPorQuestao.has(id)),
    respondidasHoje: new Set(tentativas.filter((t) => t.dia === dia).map((t) => t.questaoId)).size,
  };
}

// ---------------------------------------------------------------- tentativas

export async function registrarTentativa(t: Omit<Tentativa, "id">): Promise<number> {
  const id = await db.tentativas.add(t);
  if (t.bateriaId && t.contexto !== "revisao") {
    const progresso = await progressoBateria(t.bateriaId);
    if (progresso && !progresso.proximaQuestaoId && !progresso.bateria.concluidaEm && progresso.bateria.tipo !== "simulado-prova-real") {
      await db.baterias.update(t.bateriaId, { concluidaEm: Date.now(), diaConclusao: t.dia });
    }
  }
  return id as number;
}

// ---------------------------------------------------------------- debrief

export async function tentativasDoDiaNaBateria(bateriaId: string, dia: Dia): Promise<Tentativa[]> {
  return (await db.tentativas.where("bateriaId").equals(bateriaId).toArray()).filter((t) => t.dia === dia && t.contexto !== "revisao").sort((a, b) => a.respondidaEm - b.respondidaEm);
}

/** Cria (ou atualiza, se ainda não consolidado) o Debrief do dia para a bateria. */
export async function gerarDebrief(bateriaId: string, dia: Dia = hoje()): Promise<Debrief> {
  const bateria = await db.baterias.get(bateriaId);
  if (!bateria || bateria.materiaSlug === "prova-real") throw new Error("Bateria inválida para o Debrief.");
  const tentativas = await tentativasDoDiaNaBateria(bateriaId, dia);
  const existente = (await db.debriefs.where("bateriaId").equals(bateriaId).toArray()).find((d) => d.dia === dia);
  const ids = tentativas.map((t) => t.id!).filter((x) => x !== undefined);
  if (existente) {
    if (existente.consolidadoEm) return existente;
    const atualizado = { ...existente, tentativaIds: ids };
    if (!existente.resumoOuro.trim()) atualizado.resumoOuro = await textoOuro(tentativas);
    await db.debriefs.put(atualizado);
    return atualizado;
  }
  const debrief: Debrief = {
    id: novoId("debrief"),
    materiaSlug: bateria.materiaSlug,
    bateriaId,
    dia,
    criadoEm: Date.now(),
    tentativaIds: ids,
    resumoOuro: await textoOuro(tentativas),
    conclusaoCornell: "",
  };
  await db.debriefs.add(debrief);
  return debrief;
}

async function textoOuro(tentativas: readonly Tentativa[]): Promise<string> {
  const questoes = await mapaDeQuestoes(tentativas.map((t) => t.questaoId));
  return textoResumoDeOuro(resumoDeOuro(questoes, tentativas));
}

export async function salvarDebrief(id: string, campos: Pick<Debrief, "resumoOuro" | "conclusaoCornell">): Promise<void> {
  await db.debriefs.update(id, campos);
}

/** "Consolidar Dia & Gerar Ciclo de Revisão": cria o pacote SRS com erros e acertos frágeis do dia. */
export async function consolidarDebrief(debriefId: string): Promise<PacoteRevisao> {
  const debrief = await db.debriefs.get(debriefId);
  if (!debrief) throw new Error("Debrief não encontrado.");
  if (debrief.pacoteId) {
    const existente = await db.pacotes.get(debrief.pacoteId);
    if (existente) return existente;
  }
  const tentativas = (await db.tentativas.bulkGet(debrief.tentativaIds)).filter((t): t is Tentativa => !!t);
  const ultima = new Map<string, Resultado>();
  for (const t of tentativas.sort((a, b) => a.respondidaEm - b.respondidaEm)) ultima.set(t.questaoId, t.resultado);
  const itens = [...ultima].filter(([, r]) => entraNoCadernoDeRevisao(r)).map(([questaoId, resultado]) => ({ questaoId, resultado }));
  const progresso = await progressoBateria(debrief.bateriaId);
  const pacote = criarPacote({
    id: novoId("pacote"),
    materiaSlug: debrief.materiaSlug,
    bateriaId: debrief.bateriaId,
    debriefId,
    dia: debrief.dia,
    dataProva: await dataDaProva(),
    questoesDaBateria: progresso?.respondidas ?? [...ultima.keys()],
    itens,
  });
  const questoes = await mapaDeQuestoes(itens.map((i) => i.questaoId));
  await db.transaction("rw", db.pacotes, db.debriefs, db.flashcards, async () => {
    await db.pacotes.add(pacote);
    await db.debriefs.update(debriefId, { consolidadoEm: Date.now(), pacoteId: pacote.id });
    for (const q of questoes.values()) await garantirFlashcardDaQuestao(q, debrief.dia);
  });
  return pacote;
}

// ---------------------------------------------------------------- revisão

export async function pacotesVencidos(dia: Dia = hoje()): Promise<PacoteRevisao[]> {
  return (await db.pacotes.toArray()).filter((p) => pacoteVencido(p, dia)).sort((a, b) => (a.etapas.find((e) => !e.concluidaEm)?.dataPrevista ?? "").localeCompare(b.etapas.find((e) => !e.concluidaEm)?.dataPrevista ?? ""));
}

export async function registrarResultadoRevisao(pacoteId: string, questaoId: string, resultado: Resultado, dia: Dia = hoje()): Promise<void> {
  await db.transaction("rw", db.pacotes, async () => {
    const p = await db.pacotes.get(pacoteId);
    if (p) await db.pacotes.put(registrarResultadoItem(p, questaoId, resultado, dia));
  });
}

export async function concluirEtapaDoPacote(pacoteId: string, modo: ModoRevisao, dia: Dia = hoje()): Promise<PacoteRevisao | undefined> {
  return db.transaction("rw", db.pacotes, async () => {
    const p = await db.pacotes.get(pacoteId);
    if (!p) return undefined;
    const atualizado = concluirEtapa(p, dia, modo);
    await db.pacotes.put(atualizado);
    return atualizado;
  });
}

// ---------------------------------------------------------------- flashcards

export function idFlashcardDaQuestao(questaoId: string): string {
  return `q:${questaoId}`;
}

export async function garantirFlashcardDaQuestao(q: Questao, dia: Dia = hoje()): Promise<Flashcard> {
  const id = idFlashcardDaQuestao(q.id);
  const existente = await db.flashcards.get(id);
  if (existente) return existente;
  const card: Flashcard = { id, origem: "questao", refId: q.id, materiaSlug: q.materiaSlug, frente: q.resumoFlashcard.pergunta, verso: q.resumoFlashcard.resposta, estado: cardNovo(dia), criadoEm: Date.now() };
  await db.flashcards.put(card);
  return card;
}

export async function avaliarFlashcard(id: string, avaliacao: Avaliacao, dia: Dia = hoje()): Promise<void> {
  await db.transaction("rw", db.flashcards, async () => {
    const card = await db.flashcards.get(id);
    if (card) await db.flashcards.update(id, { estado: avaliarCard(card.estado, avaliacao, dia) });
  });
}

export async function flashcardsVencidos(dia: Dia = hoje(), materiaSlug?: MateriaSlug): Promise<Flashcard[]> {
  const vencidos = await db.flashcards.where("estado.vencimento").belowOrEqual(dia).toArray();
  return materiaSlug ? vencidos.filter((c) => c.materiaSlug === materiaSlug) : vencidos;
}

// ---------------------------------------------------------------- simulado prova real

export async function criarSimuladoProvaReal(): Promise<Bateria> {
  const porMateria = new Map<MateriaSlug, Questao[]>();
  for (const m of MATERIAS) porMateria.set(m.slug, await questoesDaMateria(m.slug));
  const exposicoes = new Map<string, number>();
  for (const t of await db.tentativas.toArray()) exposicoes.set(t.questaoId, (exposicoes.get(t.questaoId) ?? 0) + 1);
  const seed = novoId("seed");
  const bateria: Bateria = {
    id: novoId("simulado"),
    tipo: "simulado-prova-real",
    materiaSlug: "prova-real",
    ciclo: (await db.baterias.where("tipo").equals("simulado-prova-real").count()) + 1,
    questaoIds: selecionarSimuladoProvaReal(porMateria, exposicoes, seed),
    mutacao: [],
    seed,
    tamanhoBloco: PROVA.totalQuestoes,
    criadaEm: Date.now(),
    dia: hoje(),
    limiteMs: PROVA.duracaoMinutos * 60_000,
    iniciadaEm: Date.now(),
  };
  await db.baterias.add(bateria);
  return bateria;
}

// ---------------------------------------------------------------- estatísticas

export interface ResumoMateriaProgresso {
  materiaSlug: MateriaSlug;
  totalQuestoes: number;
  respondidasCiclo1: number;
  ultimaPorQuestao: Map<string, Resultado>;
  diaConclusaoCiclo1?: Dia;
  bateriasFechadas: number;
  retencao?: number;
  revisados: number;
  ultimaAtividade?: Dia;
}

export async function resumoDaMateria(slug: MateriaSlug): Promise<ResumoMateriaProgresso> {
  const [totalQuestoes, baterias, tentativas, pacotes] = await Promise.all([
    db.questoes.where("materiaSlug").equals(slug).count(),
    bateriasDaMateria(slug),
    db.tentativas.where("materiaSlug").equals(slug).sortBy("respondidaEm"),
    db.pacotes.where("materiaSlug").equals(slug).toArray(),
  ]);
  const ciclo1 = baterias.find((b) => b.ciclo === 1);
  const ultimaPorQuestao = new Map<string, Resultado>();
  for (const t of tentativas) if (t.contexto !== "revisao") ultimaPorQuestao.set(t.questaoId, t.resultado);
  const respondidasCiclo1 = ciclo1 ? new Set(tentativas.filter((t) => t.bateriaId === ciclo1.id).map((t) => t.questaoId)).size : 0;
  let revisados = 0;
  let solidos = 0;
  for (const p of pacotes) {
    const r = retencao(p);
    revisados += r.revisados;
    solidos += r.solidos;
  }
  return {
    materiaSlug: slug,
    totalQuestoes,
    respondidasCiclo1,
    ultimaPorQuestao,
    diaConclusaoCiclo1: ciclo1?.diaConclusao,
    bateriasFechadas: baterias.filter((b) => b.concluidaEm).length,
    retencao: revisados ? solidos / revisados : undefined,
    revisados,
    ultimaAtividade: tentativas.at(-1)?.dia,
  };
}

export interface PontoEvolucao {
  dia: Dia;
  solidos: number;
  frageis: number;
  erros: number;
  errosConvictos: number;
  minutosFoco: number;
}

export async function evolucaoDiaria(dias = 30, ate: Dia = hoje()): Promise<PontoEvolucao[]> {
  const inicio = somarDias(ate, -(dias - 1));
  const [tentativas, sessoes] = await Promise.all([db.tentativas.where("dia").between(inicio, ate, true, true).toArray(), db.sessoesFoco.where("dia").between(inicio, ate, true, true).toArray()]);
  const pontos = new Map<Dia, PontoEvolucao>();
  for (let i = 0; i < dias; i++) {
    const d = somarDias(inicio, i);
    pontos.set(d, { dia: d, solidos: 0, frageis: 0, erros: 0, errosConvictos: 0, minutosFoco: 0 });
  }
  for (const t of tentativas) {
    const p = pontos.get(t.dia);
    if (!p) continue;
    if (t.resultado === "ACERTO_SOLIDO") p.solidos++;
    else if (t.resultado === "ACERTO_FRAGIL") p.frageis++;
    else if (t.resultado === "ERRO_CONVICTO") p.errosConvictos++;
    else p.erros++;
  }
  for (const s of sessoes) {
    const p = pontos.get(s.dia);
    if (p) p.minutosFoco += Math.round(s.duracaoMs / 60_000);
  }
  return [...pontos.values()];
}
