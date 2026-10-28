import { useRef, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Download, FileUp, RefreshCw, Trash2, Upload } from "lucide-react";
import { getMateria, MATERIAS, PROVA } from "@/data/edital";
import { textoDeApoio } from "@/data/banco";
import { LoteSchema } from "@/data/schema";
import { validarQuestaoNoContexto, formatarCaminho, type Problema } from "@/data/validacao";
import { db } from "@/db/db";
import { baixarJson, exportarBackup, importarBackup } from "@/db/backup";
import { semearBanco, type ProgressoSeed } from "@/db/seeder";
import { diaDe, formatarDiaCurto, hoje } from "@/engine/datas";
import { BarraFina, Botao, Painel, Selo, TituloPagina } from "@/components/ui";
import { Dialogo } from "@/components/Dialogo";

export default function LotesPage() {
  const lotes = useLiveQuery(() => db.lotes.toArray(), []);
  const contagem = useLiveQuery(async () => {
    const todas = await db.questoes.toArray();
    const mapa = new Map<string, { total: number; importadas: number; selo: number }>();
    for (const q of todas) {
      const v = mapa.get(q.materiaSlug) ?? { total: 0, importadas: 0, selo: 0 };
      v.total++;
      if (q.procedencia !== "banco-inicial") v.importadas++;
      if (q.revisarFonteOficial) v.selo++;
      mapa.set(q.materiaSlug, v);
    }
    return mapa;
  }, []);
  const reportes = useLiveQuery(() => db.reportes.orderBy("criadoEm").reverse().toArray(), []);
  const [progresso, setProgresso] = useState<ProgressoSeed>();
  const [mensagem, setMensagem] = useState<string>();
  const [relatorio, setRelatorio] = useState<{ arquivo: string; problemas: Problema[]; aplicar?: () => Promise<void> }>();
  const [backupPendente, setBackupPendente] = useState<unknown>();
  const entradaLote = useRef<HTMLInputElement>(null);
  const entradaBackup = useRef<HTMLInputElement>(null);

  async function recarregar() {
    await db.lotes.where("origem").equals("embutido").modify({ hash: "" });
    const r = await semearBanco(setProgresso);
    setProgresso(undefined);
    setMensagem(`Banco recarregado: ${r.lotesAtualizados} lotes regravados, ${r.questoesNoBanco} questões.${r.lotesInvalidos.length ? ` Inválidos: ${r.lotesInvalidos.join(", ")}.` : ""}`);
  }

  async function lerLote(arquivo: File) {
    let conteudo: unknown;
    try {
      conteudo = JSON.parse(await arquivo.text());
    } catch (e) {
      setRelatorio({ arquivo: arquivo.name, problemas: [{ severidade: "erro", local: arquivo.name, mensagem: `JSON inválido: ${(e as Error).message}` }] });
      return;
    }
    const parsed = LoteSchema.safeParse(conteudo);
    if (!parsed.success) {
      setRelatorio({ arquivo: arquivo.name, problemas: parsed.error.issues.map((i) => ({ severidade: "erro", local: formatarCaminho(i.path), mensagem: i.message })) });
      return;
    }
    const lote = parsed.data;
    const problemas: Problema[] = [];
    const existentes = new Set((await db.questoes.bulkGet(lote.questoes.map((q) => q.id))).filter(Boolean).map((q) => q!.id));
    lote.questoes.forEach((q, i) => {
      problemas.push(...validarQuestaoNoContexto(q, lote, `questoes[${i}] (${q.id})`, {}));
      if (q.textoApoioId && !textoDeApoio(q.textoApoioId)) problemas.push({ severidade: "erro", local: q.id, mensagem: `texto de apoio ${q.textoApoioId} não existe no app` });
      if (existentes.has(q.id)) problemas.push({ severidade: "erro", local: q.id, mensagem: "id já existe no banco (renumere o lote)" });
    });
    const temErro = problemas.some((p) => p.severidade === "erro");
    setRelatorio({
      arquivo: arquivo.name,
      problemas,
      aplicar: temErro
        ? undefined
        : async () => {
            const chave = `importado:${lote.materiaSlug}/lote-${String(lote.lote).padStart(2, "0")}-${Date.now()}`;
            await db.transaction("rw", db.questoes, db.lotes, async () => {
              await db.questoes.bulkPut(lote.questoes.map((q) => ({ ...q, procedencia: q.procedencia ?? "importado", loteChave: chave })));
              await db.lotes.put({ chave, materiaSlug: lote.materiaSlug, lote: lote.lote, origem: "importado", hash: "", quantidade: lote.questoes.length, atualizadoEm: Date.now(), nomeArquivo: arquivo.name });
            });
            setMensagem(`${lote.questoes.length} questões importadas em ${getMateria(lote.materiaSlug).nome}.`);
            setRelatorio(undefined);
          },
    });
  }

  async function removerLote(chave: string) {
    await db.transaction("rw", db.questoes, db.lotes, async () => {
      await db.questoes.where("loteChave").equals(chave).delete();
      await db.lotes.delete(chave);
    });
  }

  return (
    <>
      <TituloPagina titulo="Banco e backup" subtitulo="Lotes de questões, importação validada e cópia de segurança do seu progresso (tudo fica neste navegador)." />
      {mensagem && (
        <p className="mb-4 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink" role="status">
          {mensagem}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <Painel
          titulo="Questões por matéria"
          className="lg:col-span-2"
          acao={
            <Botao tamanho="sm" icone={<RefreshCw size={13} strokeWidth={1.7} />} onClick={() => void recarregar()} disabled={!!progresso}>
              Recarregar lotes embutidos
            </Botao>
          }
        >
          {progresso && (
            <div className="mb-3" role="status">
              <p className="text-[12.5px] text-ink-2">{progresso.etapa}</p>
              <BarraFina valor={progresso.feito / Math.max(1, progresso.total)} rotulo="Recarregando banco" className="mt-1" />
            </div>
          )}
          <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {MATERIAS.map((m) => {
              const v = contagem?.get(m.slug);
              return (
                <li key={m.slug} className="flex items-center justify-between gap-2 py-1 text-[13px]">
                  <span className="truncate text-ink">{m.nomeCurto}</span>
                  <span className="flex items-center gap-1.5">
                    {v?.selo ? <Selo tom="ambar" title="Questões com selo 'conferir no texto oficial'">{v.selo} selo</Selo> : null}
                    {v?.importadas ? <Selo tom="ardosia">{v.importadas} import.</Selo> : null}
                    <span className={(v?.total ?? 0) >= PROVA.questoesPorBateria ? "tabular text-ink" : "tabular text-warning-text"}>
                      {v?.total ?? 0}
                      {(v?.total ?? 0) < PROVA.questoesPorBateria ? `/${PROVA.questoesPorBateria}` : ""}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Painel>
        <Painel titulo="Importar lote de questões" descricao="JSON no formato dos lotes (ver docs/autoria.md). Validado antes de entrar no banco.">
          <input ref={entradaLote} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => e.target.files?.[0] && void lerLote(e.target.files[0])} aria-label="Arquivo de lote" />
          <Botao icone={<FileUp size={14} strokeWidth={1.7} />} onClick={() => entradaLote.current?.click()}>
            Escolher arquivo
          </Botao>
          <p className="mt-3 text-[12px] text-ink-2">Lotes novos também podem ser gerados com o CLI <code className="font-mono">npm run gerar</code> (Claude API).</p>
        </Painel>
        <Painel titulo="Lotes" className="lg:col-span-2">
          <ul className="flex max-h-[340px] flex-col divide-y divide-line overflow-y-auto">
            {(lotes ?? [])
              .sort((a, b) => a.chave.localeCompare(b.chave))
              .map((l) => (
                <li key={l.chave} className="flex items-center justify-between gap-2 py-1.5 text-[12.5px]">
                  <span className="min-w-0 truncate text-ink">
                    {getMateria(l.materiaSlug).nomeCurto} · lote {String(l.lote).padStart(2, "0")}
                    {l.nomeArquivo ? <span className="text-ink-2"> · {l.nomeArquivo}</span> : null}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="tabular text-ink-2">{l.quantidade} q.</span>
                    <Selo tom={l.origem === "embutido" ? "neutro" : "ardosia"}>{l.origem}</Selo>
                    {l.origem === "importado" && (
                      <button type="button" onClick={() => void removerLote(l.chave)} className="rounded p-0.5 text-ink-3 hover:text-danger-text" aria-label="Remover lote importado">
                        <Trash2 size={13} strokeWidth={1.6} />
                      </button>
                    )}
                  </span>
                </li>
              ))}
          </ul>
        </Painel>
        <Painel titulo="Backup do progresso" descricao="Tentativas, baterias, pacotes, notas, flashcards, discursivas, workspace e configurações.">
          <div className="flex flex-col gap-2">
            <Botao icone={<Download size={14} strokeWidth={1.7} />} onClick={async () => baixarJson(`caderno-fcc-backup-${hoje()}.json`, await exportarBackup())}>
              Exportar JSON
            </Botao>
            <input ref={entradaBackup} type="file" accept="application/json,.json" className="sr-only" aria-label="Arquivo de backup" onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                setBackupPendente(JSON.parse(await f.text()));
              } catch {
                setMensagem("Arquivo de backup inválido.");
              }
            }} />
            <Botao icone={<Upload size={14} strokeWidth={1.7} />} onClick={() => entradaBackup.current?.click()}>
              Importar JSON
            </Botao>
          </div>
        </Painel>
        <Painel titulo={`Erros reportados (${reportes?.length ?? 0})`} className="lg:col-span-3" acao={reportes?.length ? <Botao tamanho="sm" variante="fantasma" onClick={() => baixarJson(`reportes-${hoje()}.json`, reportes)}>Exportar</Botao> : undefined}>
          {!reportes?.length ? (
            <p className="text-[13px] text-ink-2">Use "Reportar erro" no feedback de uma questão quando achar algo errado. Os reportes ficam aqui.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-line">
              {reportes.map((r) => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-2 text-[13px]">
                  <span className="text-ink">
                    <span className="tabular text-ink-2">{r.questaoId} · {formatarDiaCurto(diaDe(new Date(r.criadoEm)))}</span> — {r.texto}
                  </span>
                  <button type="button" onClick={() => db.reportes.delete(r.id)} className="rounded p-0.5 text-ink-3 hover:text-danger-text" aria-label="Apagar reporte">
                    <Trash2 size={13} strokeWidth={1.6} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>

      <Dialogo
        aberto={!!relatorio}
        onFechar={() => setRelatorio(undefined)}
        titulo={`Validação de ${relatorio?.arquivo ?? ""}`}
        largura="lg"
        rodape={
          <>
            <Botao variante="fantasma" onClick={() => setRelatorio(undefined)}>
              Fechar
            </Botao>
            {relatorio?.aplicar && (
              <Botao variante="primario" onClick={() => void relatorio.aplicar?.()}>
                Importar lote
              </Botao>
            )}
          </>
        }
      >
        {relatorio && relatorio.problemas.length === 0 && <p className="text-[13px] text-ink">Nenhum problema encontrado.</p>}
        <ul className="flex flex-col gap-1.5">
          {relatorio?.problemas.map((p, i) => (
            <li key={i} className="text-[12.5px]">
              <Selo tom={p.severidade === "erro" ? "terracota" : "ambar"}>{p.severidade}</Selo> <span className="text-ink-2">{p.local}:</span> <span className="text-ink">{p.mensagem}</span>
            </li>
          ))}
        </ul>
      </Dialogo>

      <Dialogo
        aberto={backupPendente !== undefined}
        onFechar={() => setBackupPendente(undefined)}
        titulo="Importar backup"
        rodape={
          <>
            <Botao variante="fantasma" onClick={() => setBackupPendente(undefined)}>
              Cancelar
            </Botao>
            <Botao
              onClick={async () => {
                try {
                  const r = await importarBackup(backupPendente, "mesclar");
                  setMensagem(`Backup mesclado: ${r.registros} registros.`);
                } catch (e) {
                  setMensagem(`Backup recusado: ${(e as Error).message}`);
                }
                setBackupPendente(undefined);
              }}
            >
              Mesclar com o atual
            </Botao>
            <Botao
              variante="primario"
              onClick={async () => {
                try {
                  const r = await importarBackup(backupPendente, "substituir");
                  setMensagem(`Backup restaurado: ${r.registros} registros.`);
                } catch (e) {
                  setMensagem(`Backup recusado: ${(e as Error).message}`);
                }
                setBackupPendente(undefined);
              }}
            >
              Substituir tudo
            </Botao>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">"Mesclar" mantém o que já existe e sobrescreve registros com o mesmo id. "Substituir tudo" apaga o progresso atual deste navegador antes de restaurar.</p>
      </Dialogo>
    </>
  );
}
