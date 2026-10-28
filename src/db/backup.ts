import { z } from "zod";
import { db } from "./db";

/**
 * Exportação/importação do progresso em JSON. As questões do banco embutido
 * não vão no arquivo (o build as recria); lotes importados vão.
 */
const TABELAS = ["baterias", "tentativas", "debriefs", "pacotes", "flashcards", "notas", "discursivas", "backlog", "brainDump", "sessoesFoco", "reportes", "config"] as const;
type NomeTabela = (typeof TABELAS)[number];

export const BackupSchema = z.object({
  app: z.literal("asperfcc"),
  versao: z.literal(1),
  exportadoEm: z.string(),
  tabelas: z.record(z.string(), z.array(z.unknown())),
  questoesImportadas: z.array(z.unknown()).optional(),
  lotesImportados: z.array(z.unknown()).optional(),
});
export type Backup = z.infer<typeof BackupSchema>;

export async function exportarBackup(): Promise<Backup> {
  const tabelas: Record<string, unknown[]> = {};
  for (const nome of TABELAS) tabelas[nome] = await db.table(nome).toArray();
  return {
    app: "asperfcc",
    versao: 1,
    exportadoEm: new Date().toISOString(),
    tabelas,
    questoesImportadas: await db.questoes.where("procedencia").anyOf("importado", "gerador-ia").filter((q) => q.loteChave.startsWith("importado:")).toArray(),
    lotesImportados: await db.lotes.where("origem").equals("importado").toArray(),
  };
}

export async function importarBackup(conteudo: unknown, modo: "mesclar" | "substituir"): Promise<{ registros: number }> {
  const backup = BackupSchema.parse(conteudo);
  let registros = 0;
  const todas = [...TABELAS.map((n) => db.table(n)), db.questoes, db.lotes];
  await db.transaction("rw", todas, async () => {
    if (modo === "substituir") {
      for (const nome of TABELAS) await db.table(nome).clear();
      await db.questoes.where("procedencia").equals("importado").delete();
      await db.lotes.where("origem").equals("importado").delete();
    }
    for (const nome of TABELAS as readonly NomeTabela[]) {
      const linhas = backup.tabelas[nome] ?? [];
      if (linhas.length) await db.table(nome).bulkPut(linhas);
      registros += linhas.length;
    }
    if (backup.questoesImportadas?.length) await db.questoes.bulkPut(backup.questoesImportadas as never[]);
    if (backup.lotesImportados?.length) await db.lotes.bulkPut(backup.lotesImportados as never[]);
  });
  return { registros };
}

export function baixarJson(nomeArquivo: string, dados: unknown): void {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
