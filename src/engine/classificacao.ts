/**
 * Seletor de confiança pré-gabarito:
 *   1 = certeza consciente · 2 = dúvida entre duas · 3 = chute/desconhecimento.
 * Acertou com 2 ou 3 → ACERTO_FRAGIL (vai para o Caderno de Revisão junto com os erros).
 * Errou com 1 → ERRO_CONVICTO (equívoco conceitual; prioridade máxima).
 */
export type Confianca = 1 | 2 | 3;
export type Resultado = "ACERTO_SOLIDO" | "ACERTO_FRAGIL" | "ERRO" | "ERRO_CONVICTO";

export const RESULTADOS: readonly Resultado[] = ["ACERTO_SOLIDO", "ACERTO_FRAGIL", "ERRO", "ERRO_CONVICTO"];

export function classificar(acertou: boolean, confianca: Confianca): Resultado {
  if (acertou) return confianca === 1 ? "ACERTO_SOLIDO" : "ACERTO_FRAGIL";
  return confianca === 1 ? "ERRO_CONVICTO" : "ERRO";
}

export function ehAcerto(r: Resultado): boolean {
  return r === "ACERTO_SOLIDO" || r === "ACERTO_FRAGIL";
}

/** Tudo que não for acerto sólido entra obrigatoriamente no Caderno de Revisão. */
export function entraNoCadernoDeRevisao(r: Resultado): boolean {
  return r !== "ACERTO_SOLIDO";
}

/** Peso do resultado no "domínio": frágil vale meio ponto, erro convicto pesa como zero. */
export function pesoDominio(r: Resultado): number {
  switch (r) {
    case "ACERTO_SOLIDO":
      return 1;
    case "ACERTO_FRAGIL":
      return 0.5;
    case "ERRO":
      return 0;
    case "ERRO_CONVICTO":
      return 0;
  }
}

/** Prioridade de revisão (maior = antes). */
export function prioridadeRevisao(r: Resultado): number {
  switch (r) {
    case "ERRO_CONVICTO":
      return 3;
    case "ERRO":
      return 2;
    case "ACERTO_FRAGIL":
      return 1;
    case "ACERTO_SOLIDO":
      return 0;
  }
}

export const ROTULO_CONFIANCA: Record<Confianca, string> = {
  1: "Certeza consciente",
  2: "Dúvida entre duas",
  3: "Chute / desconhecimento",
};

export const ROTULO_RESULTADO: Record<Resultado, string> = {
  ACERTO_SOLIDO: "Acerto sólido",
  ACERTO_FRAGIL: "Acerto frágil",
  ERRO: "Erro",
  ERRO_CONVICTO: "Erro convicto",
};
