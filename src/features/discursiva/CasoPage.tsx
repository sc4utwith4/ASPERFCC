import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, ClipboardCheck, Eye, FileText, RotateCcw } from "lucide-react";
import { carregarCasos } from "@/data/banco";
import { DISCURSIVA, getMateria } from "@/data/edital";
import type { CasoDiscursivo } from "@/data/schema";
import { db, type RespostaDiscursiva } from "@/db/db";
import { diaDe, formatarDiaCurto, formatarDuracao } from "@/engine/datas";
import { alertasAutomaticos, codificarMarcacoes, decodificarMarcacoes, notaConteudo, notaFinal, notaLingua, notaPorPilar, sugerirMarcacoes, type CriteriosLingua, type Marcacoes, type NivelItem } from "@/engine/espelho";
import { analisarFolha, PRESETS_LETRA } from "@/engine/linhas";
import { formatarNumero } from "@/engine/pontuacao";
import { novoId } from "@/engine/rng";
import { useUI } from "@/stores/ui";
import { Botao, Painel, Selo, TituloPagina, Vazio, cx } from "@/components/ui";
import { useAgora } from "@/features/workspace/Timer";

export default function CasoPage() {
  const { casoId } = useParams();
  const casos = useLiveQuery(() => carregarCasos(), []);
  const respostas = useLiveQuery(() => (casoId ? db.discursivas.where("casoId").equals(casoId).toArray() : []), [casoId]);
  if (!casos || !respostas) return null;
  const caso = casos.find((c) => c.id === casoId);
  if (!caso) return <Vazio titulo="Caso não encontrado" />;
  return <Caso key={caso.id} caso={caso} respostas={respostas} />;
}

function Caso({ caso, respostas }: { caso: CasoDiscursivo; respostas: RespostaDiscursiva[] }) {
  const navigate = useNavigate();
  const rascunhoSalvo = respostas.find((r) => r.status === "rascunho");
  const [resposta, setResposta] = useState<RespostaDiscursiva>(
    () =>
      rascunhoSalvo ?? { id: novoId("discursiva"), casoId: caso.id, texto: "", iniciadaEm: Date.now(), tempoMs: 0, caracteresPorLinha: useUI.getState().caracteresPorLinha, itensMarcados: [], status: "rascunho" },
  );
  const [verCorrigida, setVerCorrigida] = useState<RespostaDiscursiva>();
  const corrigidas = respostas.filter((r) => r.status === "corrigida").sort((a, b) => (b.finalizadaEm ?? 0) - (a.finalizadaEm ?? 0));
  const emCorrecao = verCorrigida ?? (resposta.status === "corrigida" ? resposta : undefined);

  return (
    <>
      <button type="button" onClick={() => navigate("/discursiva")} className="quiet-transition mb-3 inline-flex items-center gap-1 text-[12.5px] text-ink-2 hover:text-ink">
        <ArrowLeft size={14} strokeWidth={1.7} /> Laboratório Discursivo
      </button>
      <TituloPagina
        titulo={caso.titulo}
        subtitulo={`${caso.materiasRelacionadas.map((m) => getMateria(m).nomeCurto).join(" · ")} · até ${caso.limiteLinhas} linhas · ${caso.tempoSugeridoMin} min sugeridos`}
        acoes={caso.revisarFonteOficial ? <Selo tom="ambar">conferir no texto oficial</Selo> : undefined}
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Painel titulo="Situação-problema">
          <div className="reading">
            {caso.contexto.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="font-medium">{caso.comando}</p>
            <ol className="mt-3 flex flex-col gap-1.5">
              {caso.itensComando.map((it) => (
                <li key={it}>{it}</li>
              ))}
            </ol>
          </div>
        </Painel>
        {emCorrecao ? (
          <Espelho
            caso={caso}
            resposta={emCorrecao}
            somenteLeitura={!!verCorrigida}
            onSalvar={async (r) => {
              await db.discursivas.put(r);
              setResposta(r);
            }}
            onNova={() => {
              setVerCorrigida(undefined);
              setResposta({ id: novoId("discursiva"), casoId: caso.id, texto: "", iniciadaEm: Date.now(), tempoMs: 0, caracteresPorLinha: useUI.getState().caracteresPorLinha, itensMarcados: [], status: "rascunho" });
            }}
          />
        ) : (
          <Folha caso={caso} resposta={resposta} onChange={setResposta} />
        )}
      </div>
      {corrigidas.length > 0 && (
        <Painel titulo="Tentativas corrigidas" className="mt-5">
          <ul className="flex flex-col divide-y divide-line">
            {corrigidas.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-[13px]">
                <span className="text-ink">
                  {formatarDiaCurto(diaDe(new Date(r.finalizadaEm ?? r.iniciadaEm)))} · <span className="tabular">{formatarNumero(r.notaTotal ?? 0, 1)}</span> pontos · {formatarDuracao(r.tempoMs)}
                </span>
                <span className="flex items-center gap-2">
                  <Selo tom={(r.notaTotal ?? 0) >= DISCURSIVA.notaMinima ? "salvia" : "terracota"}>{(r.notaTotal ?? 0) >= DISCURSIVA.notaMinima ? "habilitaria" : "abaixo de 50"}</Selo>
                  <Botao tamanho="sm" variante="fantasma" icone={<Eye size={13} strokeWidth={1.7} />} onClick={() => setVerCorrigida(r)}>
                    Ver
                  </Botao>
                </span>
              </li>
            ))}
          </ul>
        </Painel>
      )}
    </>
  );
}

function Folha({ caso, resposta, onChange }: { caso: CasoDiscursivo; resposta: RespostaDiscursiva; onChange: (r: RespostaDiscursiva) => void }) {
  const agora = useAgora(1000);
  const [inicioSessao] = useState(() => Date.now());
  const [verFolha, setVerFolha] = useState(false);
  const cpl = resposta.caracteresPorLinha;
  const analise = useMemo(() => analisarFolha(resposta.texto, caso.limiteLinhas, cpl), [resposta.texto, caso.limiteLinhas, cpl]);
  const tempo = resposta.tempoMs + (agora - inicioSessao);
  const sugeridoMs = caso.tempoSugeridoMin * 60_000;
  const salvo = useRef(resposta.texto);

  useEffect(() => {
    if (resposta.texto === salvo.current) return;
    const t = window.setTimeout(() => {
      salvo.current = resposta.texto;
      void db.discursivas.put({ ...resposta, tempoMs: resposta.tempoMs + (Date.now() - inicioSessao) });
    }, 800);
    return () => window.clearTimeout(t);
  }, [resposta, inicioSessao]);

  async function finalizar() {
    const final: RespostaDiscursiva = { ...resposta, tempoMs: resposta.tempoMs + (Date.now() - inicioSessao), status: "corrigida", finalizadaEm: Date.now(), itensMarcados: [], lingua: { estrutura: 0, coesao: 0, norma: 0 } };
    await db.discursivas.put(final);
    onChange(final);
  }

  return (
    <Painel
      titulo="Folha de resposta"
      acao={
        <span className={cx("dado rounded-md px-2 py-0.5 text-[12.5px]", tempo > sugeridoMs ? "bg-warning-soft text-warning-text" : "text-ink-2")} aria-label="Tempo de redação">
          {formatarDuracao(tempo)} / {caso.tempoSugeridoMin}:00
        </span>
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[12px] text-ink-2">
        <label className="flex items-center gap-2">
          Letra
          <select
            value={cpl}
            onChange={(e) => {
              useUI.getState().definir({ caracteresPorLinha: Number(e.target.value) });
              onChange({ ...resposta, caracteresPorLinha: Number(e.target.value) });
            }}
            className="h-7 rounded-md border border-line bg-surface px-1.5 text-[12px]"
          >
            <option value={PRESETS_LETRA.grande}>grande (60 car./linha)</option>
            <option value={PRESETS_LETRA.media}>média (70 car./linha)</option>
            <option value={PRESETS_LETRA.pequena}>pequena (80 car./linha)</option>
          </select>
        </label>
        <button type="button" onClick={() => setVerFolha((v) => !v)} className="quiet-transition inline-flex items-center gap-1 rounded px-1 hover:text-ink" aria-pressed={verFolha}>
          <FileText size={13} strokeWidth={1.7} /> {verFolha ? "Editar texto" : "Ver como na folha"}
        </button>
      </div>
      {verFolha ? (
        <FolhaPautada linhas={analise.linhas} limite={caso.limiteLinhas} />
      ) : (
        <>
          <label htmlFor="texto-discursiva" className="sr-only">
            Resposta do estudo de caso
          </label>
          <textarea
            id="texto-discursiva"
            value={resposta.texto}
            onChange={(e) => onChange({ ...resposta, texto: e.target.value })}
            rows={18}
            spellCheck
            lang="pt-BR"
            className="field folha-linhas font-serif text-[16px] leading-[1.75]"
            placeholder="Escreva aqui. Cada Enter começa um novo parágrafo em linha nova."
          />
        </>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
        <span className={cx("tabular", analise.excedentes ? "text-danger-text" : "text-ink")}>
          Linhas: {analise.total}/{caso.limiteLinhas}
        </span>
        <span className="tabular text-ink-2">{analise.palavras} palavras</span>
        <span className="tabular text-ink-2">{analise.paragrafos} parágrafos</span>
        {analise.excedentes > 0 && <span className="text-danger-text">{analise.excedentes} linha(s) seriam desconsideradas</span>}
      </div>
      <div className="mt-4 flex justify-end">
        <Botao variante="primario" icone={<ClipboardCheck size={15} strokeWidth={1.7} />} disabled={!resposta.texto.trim()} onClick={() => void finalizar()}>
          Finalizar e corrigir pelo espelho
        </Botao>
      </div>
    </Painel>
  );
}

function FolhaPautada({ linhas, limite }: { linhas: string[]; limite: number }) {
  const total = Math.max(limite, linhas.length);
  return (
    <ol className="rounded-lg border border-line bg-elevated py-1" aria-label="Folha de resposta numerada">
      {Array.from({ length: total }, (_, i) => {
        const fora = i >= limite;
        return (
          <li key={i} className={cx("grid grid-cols-[2.4em_1fr] border-b border-line last:border-0", fora && "bg-danger-soft")}>
            <span className="tabular py-[3px] pr-2 text-right text-[11px] text-ink-2">{i + 1}</span>
            <span className={cx("min-h-[26px] py-[3px] font-mono text-[12.5px] leading-[20px] whitespace-pre", fora ? "text-danger-text" : "text-ink")}>{linhas[i] ?? ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

const NIVEIS: { valor: NivelItem; rotulo: string }[] = [
  { valor: 0, rotulo: "Não abordou" },
  { valor: 0.5, rotulo: "Parcial" },
  { valor: 1, rotulo: "Completo" },
];

const CRITERIOS: { id: keyof CriteriosLingua; titulo: string; descricao: string }[] = [
  { id: "estrutura", titulo: "Estrutura e adequação ao comando", descricao: "Responde a todos os itens, na ordem pedida, com introdução, desenvolvimento e conclusão." },
  { id: "coesao", titulo: "Coesão e progressão", descricao: "Conectivos e retomadas fazem o texto avançar; sem repetição nem saltos." },
  { id: "norma", titulo: "Norma-padrão", descricao: "Ortografia, acentuação, concordância, regência, crase e pontuação." },
];

function Espelho({ caso, resposta, somenteLeitura, onSalvar, onNova }: { caso: CasoDiscursivo; resposta: RespostaDiscursiva; somenteLeitura: boolean; onSalvar: (r: RespostaDiscursiva) => Promise<void>; onNova: () => void }) {
  const analise = useMemo(() => analisarFolha(resposta.texto, caso.limiteLinhas, resposta.caracteresPorLinha), [resposta, caso.limiteLinhas]);
  const sugestoes = useMemo(() => new Map(sugerirMarcacoes(caso, analise.dentroDoLimite).map((s) => [s.itemId, s])), [caso, analise.dentroDoLimite]);
  const [marcacoes, setMarcacoes] = useState<Marcacoes>(() => decodificarMarcacoes(resposta.itensMarcados));
  const [lingua, setLingua] = useState<CriteriosLingua>(resposta.lingua ?? { estrutura: 0, coesao: 0, norma: 0 });
  const [verModelo, setVerModelo] = useState(false);
  const conteudo = notaConteudo(caso, marcacoes);
  const nLingua = notaLingua(lingua);
  const total = notaFinal(conteudo, nLingua, analise);
  const alertas = alertasAutomaticos(analise);

  useEffect(() => {
    if (somenteLeitura) return;
    const t = window.setTimeout(() => void onSalvar({ ...resposta, itensMarcados: codificarMarcacoes(marcacoes), lingua, notaConteudo: conteudo, notaTotal: total }), 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marcacoes, lingua]);

  return (
    <div className="flex flex-col gap-4">
      <Painel
        titulo="Espelho de correção interativo"
        descricao="Marque o que a sua resposta realmente cobriu. As palavras-chave detectadas são só sugestão; analisam apenas o texto dentro do limite de linhas."
        acao={
          <div className="text-right">
            <p className="dado text-[22px] leading-tight font-medium text-ink">{formatarNumero(total, 1)}</p>
            <p className="text-[11.5px] text-ink-2">de 100 · {total >= DISCURSIVA.notaMinima ? "habilitaria (≥ 50)" : "abaixo do mínimo 50"}</p>
          </div>
        }
      >
        {alertas.length > 0 && (
          <ul className="mb-4 flex flex-col gap-1.5">
            {alertas.map((a) => (
              <li key={a.texto} className={cx("rounded-lg px-3 py-2 text-[12.5px]", a.tom === "grave" ? "bg-danger-soft text-danger-text" : "bg-warning-soft text-warning-text")}>
                {a.texto}
              </li>
            ))}
          </ul>
        )}
        {!somenteLeitura && (
          <Botao
            tamanho="sm"
            className="mb-3"
            onClick={() => {
              const m: Marcacoes = {};
              for (const [id, s] of sugestoes) if (s.sugestao > 0) m[id] = s.sugestao;
              setMarcacoes(m);
            }}
          >
            Aplicar sugestões da detecção
          </Botao>
        )}
        <div className="flex flex-col gap-5">
          {caso.espelho.pilares.map((pilar) => {
            const nota = notaPorPilar(caso, marcacoes).find((p) => p.id === pilar.id)!;
            return (
              <section key={pilar.id} aria-label={pilar.titulo}>
                <h3 className="mb-2 flex items-baseline justify-between gap-2 text-[13px] font-semibold text-ink">
                  {pilar.titulo}
                  <span className="tabular text-[12.5px] font-normal text-ink-2">
                    {formatarNumero(nota.nota, 1)} / {pilar.pontos}
                  </span>
                </h3>
                <ul className="flex flex-col gap-2">
                  {pilar.itens.map((item) => {
                    const s = sugestoes.get(item.id);
                    const atual = marcacoes[item.id] ?? 0;
                    return (
                      <li key={item.id} className="rounded-lg border border-line bg-elevated px-3 py-2.5">
                        <p className="text-[13px] text-ink">
                          {item.descricao} <span className="tabular text-ink-2">({item.pontos} pts)</span>
                        </p>
                        <p className="mt-1 text-[12px] text-ink-2">
                          {s && s.encontradas.length ? (
                            <>
                              Detectado: {s.encontradas.map((e) => e.split("|")[0]).join(", ")}
                              {s.sugestao > 0 && <span className="text-accent-text"> · sugestão: {s.sugestao === 1 ? "completo" : "parcial"}</span>}
                            </>
                          ) : (
                            <>Nenhuma palavra-chave encontrada ({item.palavrasChave.map((k) => k.split("|")[0]).join(", ")}).</>
                          )}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1" role="radiogroup" aria-label={`Avaliação: ${item.descricao}`}>
                          {NIVEIS.map((n) => (
                            <button key={n.valor} type="button" role="radio" aria-checked={atual === n.valor} disabled={somenteLeitura} onClick={() => setMarcacoes((m) => ({ ...m, [item.id]: n.valor }))} className={cx("quiet-transition h-7 rounded-md border px-2 text-[12px]", atual === n.valor ? (n.valor === 0 ? "border-line-control bg-surface text-ink" : "border-accent bg-accent-soft text-accent-text") : "border-line text-ink-2 hover:text-ink")}>
                              {n.rotulo}
                            </button>
                          ))}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
          <section aria-label="Língua e estrutura">
            <h3 className="mb-2 flex items-baseline justify-between text-[13px] font-semibold text-ink">
              Coesão e norma-padrão
              <span className="tabular text-[12.5px] font-normal text-ink-2">{formatarNumero(nLingua, 1)} / {DISCURSIVA.pontosLingua}</span>
            </h3>
            <div className="flex flex-col gap-3">
              {CRITERIOS.map((c) => (
                <div key={c.id}>
                  <label htmlFor={`crit-${c.id}`} className="flex items-baseline justify-between text-[13px] text-ink">
                    {c.titulo}
                    <span className="tabular text-[12px] text-ink-2">{lingua[c.id]}/10</span>
                  </label>
                  <p className="text-[12px] text-ink-2">{c.descricao}</p>
                  <input id={`crit-${c.id}`} type="range" min={0} max={10} step={1} value={lingua[c.id]} disabled={somenteLeitura} onChange={(e) => setLingua((l) => ({ ...l, [c.id]: Number(e.target.value) }))} className="range mt-1 w-full" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </Painel>

      <Painel titulo="Sua resposta (como seria corrigida)">
        <FolhaPautada linhas={analise.linhas} limite={caso.limiteLinhas} />
      </Painel>

      <Painel
        titulo="Resposta-padrão e erros comuns"
        acao={
          <Botao tamanho="sm" variante="fantasma" onClick={() => setVerModelo((v) => !v)}>
            {verModelo ? "Ocultar" : "Mostrar"}
          </Botao>
        }
      >
        {verModelo ? (
          <>
            <div className="reading">
              {caso.respostaPadrao.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <h3 className="mt-4 mb-1 text-[12.5px] font-semibold text-ink">Erros comuns</h3>
            <ul className="flex list-disc flex-col gap-1 pl-4 text-[13px] text-ink-2">
              {caso.errosComuns.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
            <p className="mt-3 text-[12px] text-ink-2">Fundamentação: {caso.fundamentacao.join("; ")}</p>
          </>
        ) : (
          <p className="text-[13px] text-ink-2">Corrija primeiro pelo espelho e depois compare com a resposta-padrão, para não ancorar a sua avaliação.</p>
        )}
      </Painel>

      <div className="flex justify-end">
        <Botao icone={<RotateCcw size={14} strokeWidth={1.7} />} onClick={onNova}>
          Nova tentativa
        </Botao>
      </div>
    </div>
  );
}
