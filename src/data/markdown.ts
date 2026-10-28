import type { JSONContent } from "@tiptap/react";

/**
 * Conversor mínimo de Markdown para o JSON do TipTap, usado para semear as
 * notas Cornell de exemplo. Suporta: ## e ### títulos, parágrafos, "- " listas,
 * "1. " listas numeradas, "- [ ] " checklists, "> " citações, **negrito**,
 * *itálico*, `código` e ==destaque==.
 */
export function markdownParaTiptap(md: string): JSONContent {
  const linhas = md.replace(/\r\n?/g, "\n").split("\n");
  const blocos: JSONContent[] = [];
  let i = 0;
  while (i < linhas.length) {
    const linha = linhas[i]!;
    if (!linha.trim()) {
      i++;
      continue;
    }
    const titulo = /^(#{2,3})\s+(.*)$/.exec(linha);
    if (titulo) {
      blocos.push({ type: "heading", attrs: { level: titulo[1]!.length }, content: inline(titulo[2]!) });
      i++;
      continue;
    }
    if (/^>\s?/.test(linha)) {
      const partes: string[] = [];
      while (i < linhas.length && /^>\s?/.test(linhas[i]!)) partes.push(linhas[i++]!.replace(/^>\s?/, ""));
      blocos.push({ type: "blockquote", content: [{ type: "paragraph", content: inline(partes.join(" ")) }] });
      continue;
    }
    if (/^- \[( |x|X)\]\s+/.test(linha)) {
      const itens: JSONContent[] = [];
      while (i < linhas.length && /^- \[( |x|X)\]\s+/.test(linhas[i]!)) {
        const m = /^- \[( |x|X)\]\s+(.*)$/.exec(linhas[i++]!)!;
        itens.push({ type: "taskItem", attrs: { checked: m[1] !== " " }, content: [{ type: "paragraph", content: inline(m[2]!) }] });
      }
      blocos.push({ type: "taskList", content: itens });
      continue;
    }
    if (/^- /.test(linha)) {
      const itens: JSONContent[] = [];
      while (i < linhas.length && /^- /.test(linhas[i]!) && !/^- \[( |x|X)\]/.test(linhas[i]!)) {
        itens.push({ type: "listItem", content: [{ type: "paragraph", content: inline(linhas[i++]!.slice(2)) }] });
      }
      blocos.push({ type: "bulletList", content: itens });
      continue;
    }
    if (/^\d+\.\s+/.test(linha)) {
      const itens: JSONContent[] = [];
      while (i < linhas.length && /^\d+\.\s+/.test(linhas[i]!)) {
        itens.push({ type: "listItem", content: [{ type: "paragraph", content: inline(linhas[i++]!.replace(/^\d+\.\s+/, "")) }] });
      }
      blocos.push({ type: "orderedList", content: itens });
      continue;
    }
    const partes: string[] = [];
    while (i < linhas.length && linhas[i]!.trim() && !/^(#{2,3}\s|>|- |\d+\.\s)/.test(linhas[i]!)) partes.push(linhas[i++]!.trim());
    blocos.push({ type: "paragraph", content: inline(partes.join(" ")) });
  }
  return { type: "doc", content: blocos.length ? blocos : [{ type: "paragraph" }] };
}

type Marca = { type: string; attrs?: Record<string, unknown> };

const PADRAO_INLINE = /(\*\*[^*]+\*\*|==[^=]+==|`[^`]+`|\*[^*]+\*)/g;

function inline(texto: string): JSONContent[] {
  const nos: JSONContent[] = [];
  let ultimo = 0;
  for (const m of texto.matchAll(PADRAO_INLINE)) {
    const inicio = m.index ?? 0;
    if (inicio > ultimo) nos.push({ type: "text", text: texto.slice(ultimo, inicio) });
    const token = m[0];
    let marca: Marca;
    let conteudo: string;
    if (token.startsWith("**")) {
      marca = { type: "bold" };
      conteudo = token.slice(2, -2);
    } else if (token.startsWith("==")) {
      marca = { type: "highlight", attrs: { color: "var(--highlight-note)" } };
      conteudo = token.slice(2, -2);
    } else if (token.startsWith("`")) {
      marca = { type: "code" };
      conteudo = token.slice(1, -1);
    } else {
      marca = { type: "italic" };
      conteudo = token.slice(1, -1);
    }
    nos.push({ type: "text", text: conteudo, marks: [marca] });
    ultimo = inicio + token.length;
  }
  if (ultimo < texto.length) nos.push({ type: "text", text: texto.slice(ultimo) });
  return nos.filter((n) => n.text);
}
