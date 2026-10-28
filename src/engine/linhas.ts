/**
 * Contador de linhas da folha de resposta FCC. Não há como medir letra
 * cursiva, então o app aproxima: cada linha comporta N caracteres
 * (configurável: 60 letra grande, 70 média, 80 pequena). A quebra é por
 * palavra; cada Enter inicia novo parágrafo em linha nova.
 * Texto além do limite é "desconsiderado" (Edital 01/2026, item 11.14).
 */
export const CARACTERES_POR_LINHA_PADRAO = 70;
export const PRESETS_LETRA = { grande: 60, media: 70, pequena: 80 } as const;

export function quebrarEmLinhas(texto: string, caracteresPorLinha = CARACTERES_POR_LINHA_PADRAO): string[] {
  const largura = Math.max(20, Math.floor(caracteresPorLinha));
  const linhas: string[] = [];
  const paragrafos = texto.replace(/\r\n?/g, "\n").split("\n");
  for (const paragrafo of paragrafos) {
    const palavras = paragrafo.split(/\s+/).filter(Boolean);
    if (palavras.length === 0) {
      linhas.push("");
      continue;
    }
    let atual = "";
    for (const palavra of palavras) {
      let resto = palavra;
      while (resto.length > largura) {
        if (atual) {
          linhas.push(atual);
          atual = "";
        }
        linhas.push(resto.slice(0, largura));
        resto = resto.slice(largura);
      }
      if (!atual) atual = resto;
      else if (atual.length + 1 + resto.length <= largura) atual += ` ${resto}`;
      else {
        linhas.push(atual);
        atual = resto;
      }
    }
    if (atual) linhas.push(atual);
  }
  while (linhas.length && linhas.at(-1) === "") linhas.pop();
  return linhas;
}

export interface AnaliseFolha {
  linhas: string[];
  total: number;
  limite: number;
  excedentes: number;
  paragrafos: number;
  palavras: number;
  /** Texto que cabe na folha (o que seria corrigido). */
  dentroDoLimite: string;
}

export function analisarFolha(texto: string, limite: number, caracteresPorLinha = CARACTERES_POR_LINHA_PADRAO): AnaliseFolha {
  const linhas = quebrarEmLinhas(texto, caracteresPorLinha);
  return {
    linhas,
    total: linhas.length,
    limite,
    excedentes: Math.max(0, linhas.length - limite),
    paragrafos: texto.split(/\n+/).filter((p) => p.trim()).length,
    palavras: texto.split(/\s+/).filter(Boolean).length,
    dentroDoLimite: linhas.slice(0, limite).join("\n"),
  };
}
