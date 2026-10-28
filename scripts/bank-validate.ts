/**
 * Valida o banco de questões, os textos de apoio, as notas Cornell de exemplo
 * e os casos discursivos.
 *
 *   npm run bank:validate                         → banco completo (14 × 50), falha com qualquer erro
 *   npm run bank:validate -- --materia banco-de-dados
 *   npm run bank:validate -- --materia banco-de-dados --parcial   (contagem e cobertura viram aviso)
 *   npm run bank:validate -- --casos              → só os casos discursivos
 *   npm run bank:validate -- --sem-avisos         → oculta avisos
 */
import { join } from "node:path";
import { isMateriaSlug, MATERIAS, type MateriaSlug } from "../src/data/edital";
import { validarArquivoTextos, validarCaso, validarLotes, validarNotaExemplo, type Problema } from "../src/data/validacao";
import { carregarEntradasLotes, DIR_CASOS, DIR_NOTAS, DIR_TEXTOS, lerJson, listarJson, relativo } from "./lib/banco-fs";

const args = process.argv.slice(2);
const flag = (nome: string) => args.includes(nome);
const valor = (nome: string) => {
  const i = args.indexOf(nome);
  return i >= 0 ? args[i + 1] : undefined;
};

const materiaArg = valor("--materia");
if (materiaArg && !isMateriaSlug(materiaArg)) {
  console.error(`Matéria desconhecida: ${materiaArg}\nVálidas: ${MATERIAS.map((m) => m.slug).join(", ")}`);
  process.exit(2);
}
const materias: MateriaSlug[] | undefined = materiaArg ? [materiaArg as MateriaSlug] : undefined;
const parcial = flag("--parcial");
const soCasos = flag("--casos");
const semAvisos = flag("--sem-avisos");

const problemas: Problema[] = [];

function tentar<T>(fn: () => T, local: string): T | undefined {
  try {
    return fn();
  } catch (e) {
    problemas.push({ severidade: "erro", local, mensagem: (e as Error).message });
    return undefined;
  }
}

if (!soCasos) {
  const textosPorMateria = new Map<MateriaSlug, Set<string>>();
  for (const arquivo of listarJson(DIR_TEXTOS)) {
    const conteudo = tentar(() => lerJson(arquivo), relativo(arquivo));
    if (conteudo === undefined) continue;
    const r = validarArquivoTextos(relativo(arquivo), conteudo);
    problemas.push(...r.problemas);
    if (r.materiaSlug) textosPorMateria.set(r.materiaSlug, r.ids);
  }

  const entradas = tentar(() => carregarEntradasLotes(materias), "src/data/questions") ?? [];
  const { problemas: pLotes, resumos } = validarLotes(entradas, { exigirCompleto: !parcial, textosPorMateria, materias });
  problemas.push(...pLotes);

  for (const arquivo of listarJson(DIR_NOTAS)) {
    const conteudo = tentar(() => lerJson(arquivo), relativo(arquivo));
    if (conteudo === undefined) continue;
    const slug = (conteudo as { materiaSlug?: string }).materiaSlug;
    if (materias && slug && !materias.includes(slug as MateriaSlug)) continue;
    problemas.push(...validarNotaExemplo(relativo(arquivo), conteudo));
  }

  console.log("\nResumo por matéria");
  for (const r of resumos) {
    const flagSelo = r.comSelo ? `, ${r.comSelo} com selo` : "";
    console.log(`  ${r.materiaSlug.padEnd(32)} ${String(r.total).padStart(3)} questões${flagSelo}`);
  }
}

if (soCasos || !materias) {
  const casos = listarJson(DIR_CASOS, /^caso-\d{2}\.json$/);
  for (const arquivo of casos) {
    const conteudo = tentar(() => lerJson(arquivo), relativo(arquivo));
    if (conteudo !== undefined) problemas.push(...validarCaso(relativo(arquivo), conteudo));
  }
  console.log(`  ${"casos discursivos".padEnd(32)} ${String(casos.length).padStart(3)} casos (${relativo(join(DIR_CASOS))})`);
}

const erros = problemas.filter((p) => p.severidade === "erro");
const avisos = problemas.filter((p) => p.severidade === "aviso");

if (erros.length) {
  console.log(`\nERROS (${erros.length})`);
  for (const p of erros) console.log(`  ✗ ${p.local}\n      ${p.mensagem}`);
}
if (avisos.length && !semAvisos) {
  console.log(`\nAVISOS (${avisos.length})`);
  for (const p of avisos) console.log(`  ! ${p.local}\n      ${p.mensagem}`);
}

console.log(`\n${erros.length ? "FALHOU" : "OK"}: ${erros.length} erro(s), ${avisos.length} aviso(s)\n`);
process.exit(erros.length ? 1 : 0);
