/**
 * Mede o contraste WCAG dos tokens de cor nos dois temas e publica a tabela
 * em docs/contraste.md. Sai com código 1 se algum par obrigatório reprovar.
 *
 *   npm run contraste
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RAIZ } from "./lib/banco-fs";
import { medir, PARES, PARES_INFORMATIVOS, reprovados, type Medicao } from "./lib/contraste";

const css = readFileSync(join(RAIZ, "src/design/tokens.css"), "utf8");
const medicoes = medir(css, PARES);
const informativos = medir(css, PARES_INFORMATIVOS);
const falhas = reprovados(medicoes);

const fmt = (n: number) => `${n.toFixed(2).replace(".", ",")}:1`;
const ok = (m: Medicao, n: number) => (m.alvo === 0 ? "—" : n >= m.alvo ? "ok" : "**falha**");

const linhas = [
  "# Contraste dos tokens (WCAG 2.x)",
  "",
  "Gerado por `npm run contraste` a partir de `src/design/tokens.css`. Não edite à mão.",
  "",
  "Alvos: 7:1 (AAA) para o texto de leitura longa; 4,5:1 (AA) para texto comum; 3:1 para texto grande em negrito e para contornos e indicadores de interface (critério 1.4.11).",
  "",
  "| Par | Claro (Warm E-Ink) | Escuro (Low-Blue Warm Slate) | Alvo | Uso |",
  "|---|---:|---:|---:|---|",
  ...medicoes.map((m) => `| ${m.rotulo} | ${fmt(m.claro)} ${ok(m, m.claro)} | ${fmt(m.escuro)} ${ok(m, m.escuro)} | ${fmt(m.alvo)} | ${m.uso} |`),
  "",
  "## Informativo",
  "",
  "| Par | Claro | Escuro | Uso |",
  "|---|---:|---:|---|",
  ...informativos.map((m) => `| ${m.rotulo} | ${fmt(m.claro)} | ${fmt(m.escuro)} | ${m.uso} |`),
  "",
  "O spec pedia contraste \"em torno de 12,5:1\" para o texto principal. Os hex exigidos medem o valor da primeira linha da tabela, acima disso no claro e um pouco abaixo no escuro, e ficam acima de AAA nos dois temas.",
  "",
];
writeFileSync(join(RAIZ, "docs/contraste.md"), linhas.join("\n"));

for (const m of medicoes) console.log(`${m.alvo > 0 && (m.claro < m.alvo || m.escuro < m.alvo) ? "✗" : "✓"} ${m.rotulo.padEnd(44)} claro ${fmt(m.claro).padStart(8)}  escuro ${fmt(m.escuro).padStart(8)}  (alvo ${fmt(m.alvo)})`);
console.log(`\ndocs/contraste.md atualizado. ${falhas.length ? `${falhas.length} par(es) abaixo do alvo.` : "Todos os pares obrigatórios passam."}`);
process.exit(falhas.length ? 1 : 0);
