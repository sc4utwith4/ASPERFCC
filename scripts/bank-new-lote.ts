/**
 * Cria o esqueleto do próximo lote de uma matéria, com ids sequenciais.
 *
 *   npm run bank:new-lote -- banco-de-dados
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getMateria, isMateriaSlug } from "../src/data/edital";
import { DIR_QUESTOES, listarJson, relativo } from "./lib/banco-fs";

const slug = process.argv[2];
if (!slug || !isMateriaSlug(slug)) {
  console.error("Uso: npm run bank:new-lote -- <materia-slug>");
  process.exit(2);
}
const materia = getMateria(slug);
const dir = join(DIR_QUESTOES, slug);
mkdirSync(dir, { recursive: true });
const existentes = listarJson(dir, /^lote-\d{2}\.json$/);
const numero = existentes.length + 1;
const arquivo = join(dir, `lote-${String(numero).padStart(2, "0")}.json`);
if (existsSync(arquivo)) {
  console.error(`Já existe: ${relativo(arquivo)}`);
  process.exit(1);
}

const questoes = Array.from({ length: 10 }, (_, k) => {
  const n = (numero - 1) * 10 + k + 1;
  return {
    id: `${materia.prefixoId}-${String(n).padStart(3, "0")}`,
    materiaSlug: slug,
    subtopico: materia.subtopicos[k % materia.subtopicos.length],
    origem: "Inédita padrão FCC",
    nivel: "Intermediário",
    formato: "caso-pratico",
    enunciadoBase: "",
    variantesEnunciado: ["", ""],
    alternativas: [1, 2, 3, 4, 5].map((o) => ({
      id: `opt-${o}`,
      texto: "",
      correta: o === 1,
      explicacaoDetalhada: o === 1 ? "CORRETA. " : "INCORRETA. ",
      ...(o === 1 ? { versaoInvertidaFalsa: "" } : {}),
    })),
    pegadinhaFCC: "",
    resumoFlashcard: { pergunta: "", resposta: "" },
    conceitosChave: [""],
    fundamentacao: "",
  };
});

writeFileSync(arquivo, `${JSON.stringify({ materiaSlug: slug, lote: numero, questoes }, null, 2)}\n`);
console.log(`Criado ${relativo(arquivo)} (${questoes[0]!.id} a ${questoes.at(-1)!.id})`);
