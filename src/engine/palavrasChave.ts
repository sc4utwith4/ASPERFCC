import { normalizar } from "@/data/schema";

/**
 * Detecção de palavras-chave do espelho de correção na resposta do estudante.
 * É só uma sugestão: quem confirma cada item é o estudante.
 *  - "RIPD|relatório de impacto" → qualquer das alternativas conta;
 *  - termo de uma palavra com 6+ letras aceita flexões ("anonimização" casa "anonimizados");
 *  - expressões de várias palavras exigem a sequência inteira.
 */
export function contemTermo(textoNormalizado: string, termo: string): boolean {
  return termo
    .split("|")
    .map((t) => normalizar(t))
    .filter(Boolean)
    .some((t) => {
      if (t.includes(" ")) return ` ${textoNormalizado} `.includes(` ${t} `);
      if (t.length >= 6) {
        const raiz = t.slice(0, Math.max(5, t.length - 3));
        return textoNormalizado.split(" ").some((p) => p.startsWith(raiz));
      }
      return textoNormalizado.split(" ").includes(t);
    });
}

export function detectarPalavrasChave(texto: string, termos: readonly string[]): { encontradas: string[]; ausentes: string[] } {
  const alvo = normalizar(texto);
  const encontradas: string[] = [];
  const ausentes: string[] = [];
  for (const termo of termos) (contemTermo(alvo, termo) ? encontradas : ausentes).push(termo);
  return { encontradas, ausentes };
}
