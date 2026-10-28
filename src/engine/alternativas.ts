import type { AlternativaId, Questao } from "@/data/schema";
import { embaralhar, geradorDe } from "./rng";

export const LETRAS = ["A", "B", "C", "D", "E"] as const;
export type Letra = (typeof LETRAS)[number];

export function letraDoIndice(i: number): Letra {
  const l = LETRAS[i];
  if (!l) throw new Error(`Índice de alternativa inválido: ${i}`);
  return l;
}

export function indiceDaLetra(letra: string): number {
  return LETRAS.indexOf(letra.toUpperCase() as Letra);
}

export function idCorreta(q: Questao): AlternativaId {
  const c = q.alternativas.find((a) => a.correta);
  if (!c) throw new Error(`Questão sem alternativa correta: ${q.id}`);
  return c.id;
}

/**
 * Ordem de exibição das alternativas (lista de ids). Estável para o mesmo
 * seed de sessão, diferente entre sessões. Se `evitarLetra` for informada
 * (a letra do gabarito na exposição anterior), o gabarito nunca cai na mesma
 * letra — o estudante não consegue decorar "é a C".
 */
export function permutarAlternativas(q: Questao, seedSessao: string, evitarLetra?: Letra): AlternativaId[] {
  const ids = q.alternativas.map((a) => a.id);
  const correta = idCorreta(q);
  const proibido = evitarLetra ? indiceDaLetra(evitarLetra) : -1;
  for (let tentativa = 0; tentativa < 8; tentativa++) {
    const ordem = embaralhar(ids, geradorDe(`${seedSessao}:${q.id}:${tentativa}`));
    if (ordem.indexOf(correta) !== proibido) return ordem;
  }
  const ordem = embaralhar(ids, geradorDe(`${seedSessao}:${q.id}`));
  const atual = ordem.indexOf(correta);
  const destino = (proibido + 1) % ids.length;
  [ordem[atual], ordem[destino]] = [ordem[destino]!, ordem[atual]!];
  return ordem;
}

export function letraDaCorreta(q: Questao, ordem: readonly AlternativaId[]): Letra {
  return letraDoIndice(ordem.indexOf(idCorreta(q)));
}
