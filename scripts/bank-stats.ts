/**
 * Estatísticas do banco: distribuição por subtópico, nível e formato,
 * proporção de "correta é a mais longa" e questões com selo.
 *
 *   npm run bank:stats
 *   npm run bank:stats -- --materia governanca-ti
 */
import { getMateria, isMateriaSlug, type MateriaSlug } from "../src/data/edital";
import { validarLotes } from "../src/data/validacao";
import { carregarEntradasLotes } from "./lib/banco-fs";

const args = process.argv.slice(2);
const i = args.indexOf("--materia");
const materiaArg = i >= 0 ? args[i + 1] : undefined;
const materias = materiaArg && isMateriaSlug(materiaArg) ? [materiaArg as MateriaSlug] : undefined;

const { resumos, questoes } = validarLotes(carregarEntradasLotes(materias), { exigirCompleto: false, materias });

for (const r of resumos) {
  if (!r.total) continue;
  const materia = getMateria(r.materiaSlug);
  const pct = (n: number) => `${((n / r.total) * 100).toFixed(0)}%`;
  console.log(`\n${materia.nome} — ${r.total} questões`);
  console.log(`  nível:   ${Object.entries(r.porNivel).map(([k, v]) => `${k} ${v} (${pct(v)})`).join(" · ")}`);
  console.log(`  formato: ${Object.entries(r.porFormato).map(([k, v]) => `${k} ${v} (${pct(v)})`).join(" · ")}`);
  console.log(`  correta é a mais longa: ${r.corretaMaisLonga} (${pct(r.corretaMaisLonga)}) · com selo: ${r.comSelo}`);
  const doMateria = questoes.filter((q) => q.materiaSlug === r.materiaSlug);
  const media = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);
  console.log(`  tamanho médio: enunciado ${media(doMateria.map((q) => q.enunciadoBase.length))} · explicação ${media(doMateria.flatMap((q) => q.alternativas.map((a) => a.explicacaoDetalhada.length)))} caracteres`);
  console.log("  subtópicos:");
  for (const sub of materia.subtopicos) {
    const n = r.porSubtopico[sub] ?? 0;
    console.log(`    ${String(n).padStart(2)} ${"▪".repeat(n)}${n < 2 ? "  ← abaixo do mínimo" : ""}  ${sub}`);
  }
}
