/**
 * Gera lotes novos de questões com a Claude API. Só grava o que passa no
 * validador; o resto vai para rascunhos/ com um relatório.
 *
 *   npm run gerar -- --materia banco-de-dados                 # 1 lote, interativo
 *   npm run gerar -- --materia banco-de-dados --lotes 3
 *   npm run gerar -- --materia todas --batch                  # 1 lote por matéria num batch (50% mais barato)
 *   npm run gerar -- --retomar-batch msgbatch_...             # processa um batch criado antes
 *   npm run gerar -- --materia lingua-portuguesa --dry-run    # só planeja e grava o prompt, sem chamar a API
 *
 * Credenciais: ANTHROPIC_API_KEY ou perfil do `ant auth login`.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { getMateria, isMateriaSlug, MATERIA_SLUGS, type MateriaSlug } from "../src/data/edital";
import { carregarEntradasLotes, RAIZ } from "./lib/banco-fs";
import { criarClienteAnthropic, explicarErro, type ConfigCliente, type Esforco, type ResultadoBatch } from "./lib/cliente-anthropic";
import {
  carregarContexto,
  custoEstimado,
  estimarTokens,
  executarLote,
  gravarResultado,
  montarPedido,
  planejarLote,
  somarUso,
  type ContextoMateria,
  type DocumentosBase,
  type PlanoLote,
  type ResultadoLote,
} from "./lib/gerador";

const AJUDA = `Uso: npm run gerar -- --materia <slug|slug,slug|todas> [opções]

  --lotes N             lotes por matéria (padrão 1; cada lote tem 10 questões)
  --subtopicos "A;B"    restringe aos subtópicos indicados (texto exato da taxonomia)
  --dry-run             só planeja e grava o prompt em rascunhos/ (não chama a API)
  --batch               Message Batches API: 50% mais barata, assíncrona, sem fallback
  --retomar-batch ID    busca e processa o resultado de um batch criado antes
  --modelo ID           padrão claude-opus-5-5
  --esforco NIVEL       low | medium | high | xhigh | max (padrão high)
  --max-tokens N        padrão 96000
  --max-reparos N       rodadas de correção quando o validador reprova (padrão 2)
  --sem-fallback        desliga fallbacks: "default" (refazer recusas em outro modelo)
  --schema-simples      envia enums só como descrição (use se a API recusar o schema)`;

const { values: args } = parseArgs({
  options: {
    materia: { type: "string" },
    lotes: { type: "string", default: "1" },
    subtopicos: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    batch: { type: "boolean", default: false },
    "retomar-batch": { type: "string" },
    modelo: { type: "string", default: "claude-opus-5-5" },
    esforco: { type: "string", default: "high" },
    "max-tokens": { type: "string", default: "96000" },
    "max-reparos": { type: "string", default: "2" },
    "sem-fallback": { type: "boolean", default: false },
    "schema-simples": { type: "boolean", default: false },
    ajuda: { type: "boolean", short: "h", default: false },
  },
});

function sair(mensagem: string, codigo = 2): never {
  console.error(mensagem);
  process.exit(codigo);
}

if (args.ajuda) sair(AJUDA, 0);
const ESFORCOS: readonly Esforco[] = ["low", "medium", "high", "xhigh", "max"];
if (!ESFORCOS.includes(args.esforco as Esforco)) sair(`--esforco inválido: ${args.esforco}\n\n${AJUDA}`);
const nLotes = Number(args.lotes);
const maxReparos = Number(args["max-reparos"]);
const maxTokens = Number(args["max-tokens"]);
if (!Number.isInteger(nLotes) || nLotes < 1 || nLotes > 20) sair("--lotes deve ser um inteiro entre 1 e 20");
if (!Number.isInteger(maxReparos) || maxReparos < 0 || maxReparos > 5) sair("--max-reparos deve ser um inteiro entre 0 e 5");
if (!Number.isInteger(maxTokens) || maxTokens < 16000) sair("--max-tokens deve ser um inteiro ≥ 16000");
const subtopicos = args.subtopicos?.split(";").map((s) => s.trim()).filter(Boolean);
const simples = args["schema-simples"];

const config: ConfigCliente = { modelo: args.modelo, esforco: args.esforco as Esforco, maxTokens, fallback: !args["sem-fallback"] };
const DIR_ESTADO = join(RAIZ, ".gerador", "batches");

function materiasDoArgumento(): MateriaSlug[] {
  if (!args.materia) sair(`Informe --materia.\n\n${AJUDA}`);
  if (args.materia === "todas") return [...MATERIA_SLUGS];
  const slugs = args.materia.split(",").map((s) => s.trim());
  const invalidos = slugs.filter((s) => !isMateriaSlug(s));
  if (invalidos.length) sair(`Matéria(s) desconhecida(s): ${invalidos.join(", ")}\nVálidas: ${MATERIA_SLUGS.join(", ")}`);
  return slugs as MateriaSlug[];
}

function ler(rel: string): string | undefined {
  const arquivo = join(RAIZ, rel);
  return existsSync(arquivo) ? readFileSync(arquivo, "utf8") : undefined;
}

function documentos(slug: MateriaSlug): DocumentosBase {
  const autoria = ler("docs/autoria.md");
  const exemplo = ler("docs/exemplo-questao.json");
  if (!autoria || !exemplo) sair("docs/autoria.md e docs/exemplo-questao.json são obrigatórios.");
  const comNormativos = getMateria(slug).bloco === "especificos" || slug === "legislacao-institucional";
  return { autoria, exemplo, pesquisa: ler(`docs/pesquisa/${slug}.md`), normativos: comNormativos ? ler("docs/pesquisa/_normativos-tce-go.md") : undefined };
}

function contexto(slug: MateriaSlug): ContextoMateria {
  return carregarContexto(RAIZ, slug, carregarEntradasLotes([slug]));
}

function nn(n: number): string {
  return String(n).padStart(2, "0");
}

function rotulo(p: PlanoLote): string {
  return `${getMateria(p.materiaSlug).nomeCurto} · lote ${nn(p.lote)} (${p.ids[0]} a ${p.ids.at(-1)})`;
}

function usd(v: number): string {
  return `US$ ${v.toFixed(2)}`;
}

function progresso(prefixo: string): (caracteres: number) => void {
  let ultimo = 0;
  return (caracteres) => {
    if (!process.stdout.isTTY || Date.now() - ultimo < 1000) return;
    ultimo = Date.now();
    process.stdout.write(`\r  ${prefixo}: ${caracteres.toLocaleString("pt-BR")} caracteres recebidos   `);
  };
}

// ------------------------------------------------------------- resultado

interface LinhaResumo {
  rotulo: string;
  status: string;
  tentativas: number;
  saida: number;
  custo: number;
}
const resumo: LinhaResumo[] = [];

/** Grava o resultado e imprime o desfecho. `batchNaPrimeira`: a 1ª resposta veio do batch (meio preço). */
function finalizar(r: ResultadoLote, batchNaPrimeira = false): void {
  if (process.stdout.isTTY) process.stdout.write("\n");
  const custo = r.respostas.reduce((s, resp, i) => s + custoEstimado(resp.uso, { batch: batchNaPrimeira && i === 0 }), 0);
  const gravados = gravarResultado(RAIZ, r, custo);
  const uso = somarUso(r.respostas.map((x) => x.uso));
  const fallback = r.respostas.some((x) => x.fallbackUsado) ? `, fallback: ${r.respostas.find((x) => x.fallbackUsado)?.modelo}` : "";
  console.log(`  → ${r.status.toUpperCase()} em ${r.respostas.length} tentativa(s)${fallback} · saída ${uso.saida.toLocaleString("pt-BR")} tokens · ${usd(custo)}`);
  if (r.status === "aprovado" && r.avisos.length) console.log(`    ${r.avisos.length} aviso(s): ${r.avisos.slice(0, 3).map((a) => a.mensagem).join(" | ")}`);
  if (r.status !== "aprovado") for (const e of r.erros.slice(0, 6)) console.log(`    ✗ ${e.local}: ${e.mensagem}`);
  for (const g of gravados) console.log(`    gravado: ${g}`);
  resumo.push({ rotulo: rotulo(r.plano), status: r.status, tentativas: r.respostas.length, saida: uso.saida, custo });
}

function imprimirResumo(): void {
  if (!resumo.length) return;
  const total = resumo.reduce((s, l) => s + l.custo, 0);
  const aprovados = resumo.filter((l) => l.status === "aprovado").length;
  console.log(`\nResumo: ${aprovados}/${resumo.length} lote(s) aprovado(s) · custo estimado ${usd(total)}`);
  if (config.modelo !== "claude-opus-5-5") console.log("(custo calculado com a tabela do Claude Opus 5.5; outro modelo tem outro preço)");
  if (aprovados) {
    console.log("Lotes gerados por IA entram com procedencia \"gerador-ia\" (selo no app). Revise e rode npm run bank:validate.");
    console.log("O app incorpora os lotes novos no próximo npm run dev ou npm run build.");
  }
}

// ----------------------------------------------------------------- modos

function modoDryRun(slugs: readonly MateriaSlug[]): void {
  for (const slug of slugs) {
    const ctx = contexto(slug);
    const docs = documentos(slug);
    const reservados: PlanoLote[] = [];
    for (let i = 0; i < nLotes; i++) {
      const plano = planejarLote(ctx, { reservados, subtopicos });
      reservados.push(plano);
      const pedido = montarPedido(plano, ctx, docs, { simples });
      const rel = `src/data/questions/${slug}/rascunhos/lote-${nn(plano.lote)}.prompt.md`;
      const arquivo = join(RAIZ, rel);
      mkdirSync(join(arquivo, ".."), { recursive: true });
      const sistema = pedido.sistema.map((b, k) => `## System, bloco ${k + 1}${b.cache ? " (cache 1 h)" : ""}\n\n${b.texto}`).join("\n\n");
      writeFileSync(arquivo, `${sistema}\n\n## Mensagem\n\n${pedido.mensagem}\n\n## Schema da saída\n\n\`\`\`json\n${JSON.stringify(pedido.schema, null, 2)}\n\`\`\`\n`);
      const tSistema = estimarTokens(pedido.sistema.map((b) => b.texto).join("") + JSON.stringify(pedido.schema));
      const tMensagem = estimarTokens(pedido.mensagem);
      const base = { entrada: tMensagem, cacheEscrita5m: 0, cacheEscrita1h: i === 0 ? tSistema : 0, cacheLeitura: i === 0 ? 0 : tSistema };
      const min = custoEstimado({ ...base, saida: 25_000 }, { batch: args.batch });
      const max = custoEstimado({ ...base, saida: 45_000 }, { batch: args.batch });
      console.log(`${rotulo(plano)}\n  subtópicos: ${plano.subtopicos.map((s) => `${s.subtopico} ×${s.quantidade}`).join("; ")}`);
      if (plano.idsTextosNovos.length) console.log(`  textos novos: ${plano.idsTextosNovos.join(", ")}`);
      console.log(`  entrada ≈ ${(tSistema + tMensagem).toLocaleString("pt-BR")} tokens (system ≈ ${tSistema.toLocaleString("pt-BR")}) · custo ≈ ${usd(min)} a ${usd(max)} por tentativa${args.batch ? " (batch)" : ""}\n  prompt: ${rel}`);
    }
  }
  console.log("\nNada foi enviado à API. A estimativa considera 25–45 mil tokens de saída (raciocínio + JSON); a 1ª execução real mede o valor.");
}

async function modoInterativo(slugs: readonly MateriaSlug[]): Promise<void> {
  const cliente = criarClienteAnthropic(config);
  if (config.fallback) console.log('Fallback ligado (fallbacks: "default"): recusas por categoria são refeitas no modelo recomendado pela API.');
  for (const slug of slugs) {
    for (let i = 0; i < nLotes; i++) {
      const ctx = contexto(slug);
      const plano = planejarLote(ctx, { subtopicos });
      const pedido = montarPedido(plano, ctx, documentos(slug), { simples });
      console.log(`\n${rotulo(plano)}`);
      const resultado = await executarLote(cliente, plano, ctx, pedido, {
        maxReparos,
        onTentativa: (t) => t > 0 && console.log(`${process.stdout.isTTY ? "\n" : ""}  reparo ${t}/${maxReparos}: devolvendo os problemas ao modelo`),
        onProgresso: progresso(`lote ${nn(plano.lote)}`),
      });
      finalizar(resultado);
      if (resultado.status !== "aprovado") {
        console.log(`  Interrompendo ${getMateria(slug).nomeCurto}: corrija o rascunho ou rode de novo.`);
        break;
      }
    }
  }
}

interface EstadoBatch {
  id: string;
  criadoEm: string;
  config: ConfigCliente;
  simples: boolean;
  planos: { customId: string; plano: PlanoLote }[];
}

async function modoBatch(slugs: readonly MateriaSlug[]): Promise<void> {
  const cliente = criarClienteAnthropic(config);
  const planos: EstadoBatch["planos"] = [];
  const itens = [];
  for (const slug of slugs) {
    const ctx = contexto(slug);
    const docs = documentos(slug);
    const reservados: PlanoLote[] = [];
    for (let i = 0; i < nLotes; i++) {
      const plano = planejarLote(ctx, { reservados, subtopicos });
      reservados.push(plano);
      const customId = `${slug}-lote-${nn(plano.lote)}`;
      itens.push({ customId, pedido: montarPedido(plano, ctx, docs, { simples }) });
      planos.push({ customId, plano });
    }
  }
  const id = await cliente.criarBatch(itens);
  mkdirSync(DIR_ESTADO, { recursive: true });
  const estado: EstadoBatch = { id, criadoEm: new Date().toISOString(), config, simples, planos };
  writeFileSync(join(DIR_ESTADO, `${id}.json`), `${JSON.stringify(estado, null, 2)}\n`);
  console.log(`Batch ${id} criado com ${itens.length} pedido(s). Pode interromper (Ctrl+C) e retomar depois com:\n  npm run gerar -- --retomar-batch ${id}`);
  await processarBatch(estado);
}

async function processarBatch(estado: EstadoBatch): Promise<void> {
  const cfg = { ...estado.config, fallback: config.fallback };
  const cliente = criarClienteAnthropic(cfg);
  for (;;) {
    const s = await cliente.consultarBatch(estado.id);
    console.log(`[${new Date().toLocaleTimeString("pt-BR")}] batch ${s.status}: ${s.processando} processando, ${s.sucesso} ok, ${s.erro} com erro, ${s.outros} cancelados/expirados`);
    if (s.status === "ended") break;
    await new Promise((r) => setTimeout(r, 60_000));
  }
  const resultados = new Map<string, ResultadoBatch>();
  for await (const r of cliente.resultadosBatch(estado.id)) resultados.set(r.customId, r);

  for (const { customId, plano } of estado.planos) {
    console.log(`\n${rotulo(plano)}`);
    if (existsSync(join(RAIZ, plano.arquivo))) {
      console.log("  já gravado; pulando");
      continue;
    }
    const r = resultados.get(customId);
    if (!r?.resposta) {
      console.log(`  ${r?.tipo ?? "sem resultado"}${r?.erro ? `: ${r.erro}` : ""}. Gere este lote de novo sem --batch.`);
      continue;
    }
    const ctx = contexto(plano.materiaSlug);
    const pedido = montarPedido(plano, ctx, documentos(plano.materiaSlug), { simples: estado.simples });
    const opcoes = { maxReparos, onProgresso: progresso(`lote ${nn(plano.lote)}`) };
    if (r.resposta.stopReason === "refusal" && cfg.fallback) {
      console.log("  recusa no batch (o batch não aceita fallback): refazendo no modo interativo, com fallback");
      const resultado = await executarLote(cliente, plano, ctx, pedido, opcoes);
      // A tentativa recusada no batch também é cobrada (com desconto): entra como 1ª resposta.
      finalizar({ ...resultado, respostas: [r.resposta, ...resultado.respostas] }, true);
      continue;
    }
    finalizar(await executarLote(cliente, plano, ctx, pedido, { ...opcoes, primeiraResposta: r.resposta }), true);
  }
}

async function principal(): Promise<void> {
  const idRetomar = args["retomar-batch"];
  if (idRetomar) {
    const arquivo = join(DIR_ESTADO, `${idRetomar}.json`);
    if (!existsSync(arquivo)) sair(`Estado do batch não encontrado: .gerador/batches/${idRetomar}.json`);
    await processarBatch(JSON.parse(readFileSync(arquivo, "utf8")) as EstadoBatch);
  } else {
    const slugs = materiasDoArgumento();
    if (args["dry-run"]) modoDryRun(slugs);
    else if (args.batch) await modoBatch(slugs);
    else await modoInterativo(slugs);
  }
  imprimirResumo();
}

principal().catch((e: unknown) => {
  imprimirResumo();
  sair(`\nFalha: ${explicarErro(e)}`, 1);
});
