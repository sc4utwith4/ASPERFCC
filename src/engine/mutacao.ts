import type { AlternativaId, Questao } from "@/data/schema";
import { normalizar } from "@/data/schema";
import { embaralhar, geradorDe, hashString } from "./rng";

/**
 * Modo Mutação (Caça ao Erro), para revisões:
 *  - caca-ao-erro: marcar exatamente as alternativas incorretas (ou as assertivas falsas);
 *  - versao-invertida: entre a afirmação fiel e a versão invertida, apontar a fiel;
 *  - justificativa: escolher a alternativa e escrever o porquê; o estudante compara com a explicação.
 */
export type SubModoMutacao = "caca-ao-erro" | "versao-invertida" | "justificativa";
export const SUBMODOS: readonly SubModoMutacao[] = ["caca-ao-erro", "versao-invertida", "justificativa"];

export const ROTULO_SUBMODO: Record<SubModoMutacao, string> = {
  "caca-ao-erro": "Caça ao erro",
  "versao-invertida": "Versão invertida",
  justificativa: "Justificativa",
};

export function escolherSubModo(q: Questao, seed: string): SubModoMutacao {
  return SUBMODOS[hashString(`${seed}:${q.id}:mutacao`) % SUBMODOS.length]!;
}

export interface AvaliacaoCacaAoErro {
  acertou: boolean;
  /** Itens falsos que o estudante não marcou. */
  faltaram: string[];
  /** Itens verdadeiros marcados como falsos. */
  sobraram: string[];
}

/** Chaves dos itens falsos: ids de alternativa ou "assertiva-N" no formato assertivas. */
export function itensFalsos(q: Questao): string[] {
  if (q.formato === "assertivas" && q.assertivas) {
    return q.assertivas.flatMap((a, i) => (a.verdadeira ? [] : [`assertiva-${i}`]));
  }
  return q.alternativas.filter((a) => !a.correta).map((a) => a.id);
}

export function avaliarCacaAoErro(q: Questao, marcados: ReadonlySet<string>): AvaliacaoCacaAoErro {
  const falsos = new Set(itensFalsos(q));
  const faltaram = [...falsos].filter((k) => !marcados.has(k));
  const sobraram = [...marcados].filter((k) => !falsos.has(k));
  return { acertou: faltaram.length === 0 && sobraram.length === 0, faltaram, sobraram };
}

export interface OpcaoVersao {
  chave: "fiel" | "invertida";
  texto: string;
}

/** Par (fiel × invertida) em ordem embaralhada pelo seed. */
export function parVersaoInvertida(q: Questao, seed: string): OpcaoVersao[] {
  const correta = q.alternativas.find((a) => a.correta);
  const invertida = correta?.versaoInvertidaFalsa;
  if (!correta || !invertida) return [];
  let fiel = correta.texto;
  if (q.formato === "assertivas" && q.assertivas) {
    // A versão invertida reescreve a assertiva verdadeira mais próxima dela.
    const verdadeiras = q.assertivas.filter((a) => a.verdadeira);
    const alvo = normalizar(invertida);
    let melhor = verdadeiras[0]?.texto ?? fiel;
    let melhorSim = -1;
    for (const a of verdadeiras) {
      const sim = similaridade(normalizar(a.texto), alvo);
      if (sim > melhorSim) {
        melhorSim = sim;
        melhor = a.texto;
      }
    }
    fiel = melhor;
  }
  const opcoes: OpcaoVersao[] = [
    { chave: "fiel", texto: fiel },
    { chave: "invertida", texto: invertida },
  ];
  return embaralhar(opcoes, geradorDe(`${seed}:${q.id}:versao`));
}

function similaridade(a: string, b: string): number {
  const pa = new Set(a.split(" "));
  const pb = new Set(b.split(" "));
  let inter = 0;
  for (const p of pa) if (pb.has(p)) inter++;
  return inter / Math.max(1, pa.size + pb.size - inter);
}

export type AutoAvaliacaoJustificativa = "correta" | "parcial" | "errada";

/** Justificativa: alternativa certa + justificativa correta = sólido; parcial = frágil; resto = erro. */
export function resultadoJustificativa(alternativaCorreta: boolean, auto: AutoAvaliacaoJustificativa): { acertou: boolean; confianca: 1 | 2 | 3 } {
  if (!alternativaCorreta) return { acertou: false, confianca: auto === "correta" ? 1 : 2 };
  if (auto === "correta") return { acertou: true, confianca: 1 };
  return { acertou: true, confianca: auto === "parcial" ? 2 : 3 };
}

export function idsIncorretas(q: Questao): AlternativaId[] {
  return q.alternativas.filter((a) => !a.correta).map((a) => a.id);
}
