import { isMateriaSlug, type MateriaSlug } from "./edital";
import { CasoDiscursivoSchema, NotaExemploSchema, TextosArquivoSchema, type CasoDiscursivo, type NotaExemplo, type TextoApoio } from "./schema";

/**
 * Conteúdo embutido no build. Os lotes de questões são carregados sob demanda
 * (texto bruto, para calcular o hash no seeder); textos de apoio são pequenos
 * e vêm junto; notas e casos carregam quando a tela precisa.
 */
const lotesBrutos = import.meta.glob<string>("./questions/*/lote-*.json", { query: "?raw", import: "default" });
const textosModulos = import.meta.glob<unknown>("./textos/*.json", { import: "default", eager: true });
const notasModulos = import.meta.glob<unknown>("./notas-exemplo/*.json", { import: "default" });
const casosModulos = import.meta.glob<unknown>("./casos/caso-*.json", { import: "default" });

export interface LoteEmbutido {
  chave: string;
  materiaSlug: MateriaSlug;
  lote: number;
  carregar: () => Promise<string>;
}

export function listarLotesEmbutidos(): LoteEmbutido[] {
  const lotes: LoteEmbutido[] = [];
  for (const [caminho, carregar] of Object.entries(lotesBrutos)) {
    const m = /\.\/questions\/([^/]+)\/lote-(\d{2})\.json$/.exec(caminho);
    if (!m || !isMateriaSlug(m[1]!)) continue;
    lotes.push({ chave: `${m[1]}/lote-${m[2]}`, materiaSlug: m[1] as MateriaSlug, lote: Number(m[2]), carregar });
  }
  return lotes.sort((a, b) => a.chave.localeCompare(b.chave));
}

const textos = new Map<string, TextoApoio>();
for (const [caminho, conteudo] of Object.entries(textosModulos)) {
  const parsed = TextosArquivoSchema.safeParse(conteudo);
  if (!parsed.success) {
    console.error(`Textos de apoio inválidos em ${caminho}`, parsed.error.issues.slice(0, 3));
    continue;
  }
  for (const t of parsed.data.textos) textos.set(t.id, t);
}

export function textoDeApoio(id: string | undefined): TextoApoio | undefined {
  return id ? textos.get(id) : undefined;
}

export async function carregarNotasExemplo(): Promise<NotaExemplo[]> {
  const notas: NotaExemplo[] = [];
  for (const [caminho, carregar] of Object.entries(notasModulos)) {
    const parsed = NotaExemploSchema.safeParse(await carregar());
    if (parsed.success) notas.push(parsed.data);
    else console.error(`Nota de exemplo inválida em ${caminho}`, parsed.error.issues.slice(0, 3));
  }
  return notas.sort((a, b) => a.id.localeCompare(b.id));
}

let casosCache: Promise<CasoDiscursivo[]> | undefined;

export function carregarCasos(): Promise<CasoDiscursivo[]> {
  casosCache ??= (async () => {
    const casos: CasoDiscursivo[] = [];
    for (const [caminho, carregar] of Object.entries(casosModulos)) {
      const parsed = CasoDiscursivoSchema.safeParse(await carregar());
      if (parsed.success) casos.push(parsed.data);
      else console.error(`Caso discursivo inválido em ${caminho}`, parsed.error.issues.slice(0, 3));
    }
    return casos.sort((a, b) => a.id.localeCompare(b.id));
  })();
  return casosCache;
}
