/**
 * Cliente real do gerador, sobre o SDK oficial (@anthropic-ai/sdk).
 *
 * - Interativo: Messages API em streaming (finalMessage) com saída
 *   estruturada, cache de 1 h no system e `fallbacks: "default"`: se o
 *   classificador de segurança recusar (ex.: categoria cyber em questões de
 *   ransomware), a própria API refaz o pedido no modelo de fallback
 *   recomendado.
 * - Batch: Message Batches API (50% mais barata, assíncrona). Não aceita
 *   fallbacks; recusas voltam como stop_reason "refusal" e o CLI as refaz no
 *   modo interativo.
 *
 * Credenciais: ANTHROPIC_API_KEY, ou um perfil do `ant auth login`. A chave
 * fica só neste processo Node; nada disso vai para o app no navegador.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { ClienteGerador, PedidoGeracao, RespostaGeracao, Uso } from "./gerador";

export type Esforco = "low" | "medium" | "high" | "xhigh" | "max";

export interface ConfigCliente {
  modelo: string;
  esforco: Esforco;
  maxTokens: number;
  fallback: boolean;
}

export interface ItemBatch {
  customId: string;
  pedido: PedidoGeracao;
}

export interface ResultadoBatch {
  customId: string;
  tipo: "succeeded" | "errored" | "canceled" | "expired";
  resposta?: RespostaGeracao;
  erro?: string;
}

export interface StatusBatch {
  status: "in_progress" | "canceling" | "ended";
  processando: number;
  sucesso: number;
  erro: number;
  outros: number;
}

export interface ClienteBatch {
  criarBatch(itens: readonly ItemBatch[]): Promise<string>;
  consultarBatch(id: string): Promise<StatusBatch>;
  resultadosBatch(id: string): AsyncIterable<ResultadoBatch>;
}

const BETA_FALLBACK = "server-side-fallback-2026-07-01";

function paramsBase(pedido: PedidoGeracao, cfg: ConfigCliente) {
  return {
    model: cfg.modelo,
    max_tokens: cfg.maxTokens,
    thinking: { type: "adaptive" as const },
    output_config: { effort: cfg.esforco, format: { type: "json_schema" as const, schema: pedido.schema } },
    system: pedido.sistema.map((b) => ({
      type: "text" as const,
      text: b.texto,
      ...(b.cache ? { cache_control: { type: "ephemeral" as const, ttl: "1h" as const } } : {}),
    })),
    messages: [{ role: "user" as const, content: pedido.mensagem }],
  };
}

/** Campos comuns às mensagens beta e estáveis que o pipeline usa. */
interface MensagemComum {
  model: string;
  stop_reason: string | null;
  content: ReadonlyArray<{ type: string; text?: string }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number | null;
    cache_read_input_tokens: number | null;
    cache_creation: { ephemeral_5m_input_tokens: number; ephemeral_1h_input_tokens: number } | null;
    iterations?: ReadonlyArray<{ type: string }> | null;
  };
  stop_details?: { category?: string | null; explanation?: string | null } | null;
}

export function converterMensagem(msg: MensagemComum): RespostaGeracao {
  const u = msg.usage;
  const uso: Uso = {
    entrada: u.input_tokens,
    saida: u.output_tokens,
    cacheEscrita5m: u.cache_creation?.ephemeral_5m_input_tokens ?? 0,
    // Sem o detalhamento por TTL, a escrita é atribuída ao TTL de 1 h (o único que usamos).
    cacheEscrita1h: u.cache_creation?.ephemeral_1h_input_tokens ?? (u.cache_creation_input_tokens ?? 0),
    cacheLeitura: u.cache_read_input_tokens ?? 0,
  };
  return {
    texto: msg.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join(""),
    stopReason: msg.stop_reason,
    recusa: msg.stop_reason === "refusal" ? { categoria: msg.stop_details?.category, explicacao: msg.stop_details?.explanation } : undefined,
    modelo: msg.model,
    fallbackUsado: (u.iterations ?? []).some((e) => e.type === "fallback_message") || msg.content.some((b) => b.type === "fallback"),
    uso,
  };
}

export function criarClienteAnthropic(cfg: ConfigCliente): ClienteGerador & ClienteBatch {
  const client = new Anthropic({ maxRetries: 4, timeout: 60 * 60 * 1000 });

  return {
    async gerar(pedido, opcoes) {
      const stream = client.beta.messages.stream({
        ...paramsBase(pedido, cfg),
        ...(cfg.fallback ? { betas: [BETA_FALLBACK], fallbacks: "default" as const } : {}),
      });
      let caracteres = 0;
      stream.on("text", (delta) => {
        caracteres += delta.length;
        opcoes?.onProgresso?.(caracteres);
      });
      return converterMensagem(await stream.finalMessage());
    },

    async criarBatch(itens) {
      const batch = await client.messages.batches.create({
        requests: itens.map((i) => ({ custom_id: i.customId, params: paramsBase(i.pedido, cfg) })),
      });
      return batch.id;
    },

    async consultarBatch(id) {
      const b = await client.messages.batches.retrieve(id);
      const c = b.request_counts;
      return { status: b.processing_status, processando: c.processing, sucesso: c.succeeded, erro: c.errored, outros: c.canceled + c.expired };
    },

    async *resultadosBatch(id) {
      for await (const r of await client.messages.batches.results(id)) {
        const res = r.result;
        if (res.type === "succeeded") yield { customId: r.custom_id, tipo: "succeeded", resposta: converterMensagem(res.message) };
        else if (res.type === "errored") yield { customId: r.custom_id, tipo: "errored", erro: JSON.stringify(res.error) };
        else yield { customId: r.custom_id, tipo: res.type };
      }
    },
  };
}

/** Mensagem amigável para erros de API comuns (sem expor credenciais). */
export function explicarErro(e: unknown): string {
  if (e instanceof Anthropic.AuthenticationError) return "credencial inválida ou ausente: defina ANTHROPIC_API_KEY ou rode `ant auth login`.";
  if (e instanceof Anthropic.PermissionDeniedError) return "a credencial não tem acesso a este modelo ou recurso.";
  if (e instanceof Anthropic.RateLimitError) return "limite de taxa atingido: aguarde e rode de novo (lotes já gravados são mantidos).";
  if (e instanceof Anthropic.BadRequestError) return `pedido rejeitado pela API: ${e.message}. Se o erro citar o schema, rode de novo com --schema-simples.`;
  if (e instanceof Anthropic.APIError) return `erro da API (${e.status ?? "sem status"}): ${e.message}`;
  return (e as Error)?.message ?? String(e);
}
