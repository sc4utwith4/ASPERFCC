import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { GraduationCap, Plus, Trash2, X } from "lucide-react";
import { getMateria, isMateriaSlug, MATERIAS, type MateriaSlug } from "@/data/edital";
import { db, type Nota } from "@/db/db";
import { avaliarFlashcard } from "@/db/servicos";
import { cardNovo } from "@/engine/flashcardSrs";
import { formatarDiaCurto, hoje, diaDe } from "@/engine/datas";
import { novoId } from "@/engine/rng";
import { useUI } from "@/stores/ui";
import { Botao, Selo, TituloPagina, Vazio, cx } from "@/components/ui";
import { Dialogo } from "@/components/Dialogo";
import { SessaoFlashcards } from "@/features/flashcards/SessaoFlashcards";
import { EditorCornell } from "./EditorCornell";

export default function NotasPage() {
  const [params, setParams] = useSearchParams();
  const materiaAtiva = useUI((s) => s.materiaAtiva);
  const filtro = params.get("materia");
  const materiaFiltro: MateriaSlug | "todas" = filtro && isMateriaSlug(filtro) ? filtro : "todas";
  const notas = useLiveQuery(() => db.notas.orderBy("atualizadoEm").reverse().toArray(), []);
  const [selecionada, setSelecionada] = useState<string>();
  const visiveis = useMemo(() => (notas ?? []).filter((n) => materiaFiltro === "todas" || n.materiaSlug === materiaFiltro), [notas, materiaFiltro]);
  const atual = visiveis.find((n) => n.id === selecionada) ?? visiveis[0];

  async function criar() {
    const materiaSlug = materiaFiltro === "todas" ? materiaAtiva : materiaFiltro;
    const agora = Date.now();
    const nota: Nota = {
      id: novoId("nota"),
      materiaSlug,
      titulo: "Nova nota",
      pistas: [{ pergunta: "", resposta: "" }],
      conteudo: { type: "doc", content: [{ type: "paragraph" }] },
      sintese: "",
      exemplo: false,
      criadoEm: agora,
      atualizadoEm: agora,
    };
    await db.notas.add(nota);
    setSelecionada(nota.id);
  }

  return (
    <>
      <TituloPagina
        titulo="Notas Cornell"
        subtitulo="Pistas e perguntas à esquerda, conteúdo à direita, síntese com as suas palavras no rodapé. As pistas viram flashcards."
        acoes={
          <>
            <label className="sr-only" htmlFor="filtro-materia">
              Filtrar por matéria
            </label>
            <select id="filtro-materia" value={materiaFiltro} onChange={(e) => setParams(e.target.value === "todas" ? {} : { materia: e.target.value })} className="h-8 rounded-lg border border-line-control bg-elevated px-2 text-[12.5px]">
              <option value="todas">Todas as matérias</option>
              {MATERIAS.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.nomeCurto}
                </option>
              ))}
            </select>
            <Botao variante="primario" icone={<Plus size={14} strokeWidth={1.8} />} onClick={() => void criar()}>
              Nova nota
            </Botao>
          </>
        }
      />
      {!notas ? null : visiveis.length === 0 ? (
        <Vazio titulo="Nenhuma nota aqui ainda" acao={<Botao variante="primario" onClick={() => void criar()}>Criar nota</Botao>}>
          Uma nota Cornell por tema: perguntas de revisão na coluna da esquerda, a matéria à direita e a síntese embaixo.
        </Vazio>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="Notas" className="flex flex-col gap-1 lg:sticky lg:top-16 lg:self-start">
            {visiveis.map((n) => (
              <button key={n.id} type="button" onClick={() => setSelecionada(n.id)} aria-current={n.id === atual?.id} className={cx("quiet-transition rounded-lg px-2.5 py-2 text-left", n.id === atual?.id ? "bg-surface" : "hover:bg-surface")}>
                <span className="line-clamp-2 block text-[13px] text-ink">{n.titulo}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-2">
                  {getMateria(n.materiaSlug).nomeCurto} · {formatarDiaCurto(diaDe(new Date(n.atualizadoEm)))}
                  {n.exemplo && <Selo tom="neutro">exemplo</Selo>}
                </span>
              </button>
            ))}
          </nav>
          {atual && <EditorNota key={atual.id} nota={atual} />}
        </div>
      )}
    </>
  );
}

function EditorNota({ nota }: { nota: Nota }) {
  const [rascunho, setRascunho] = useState<Nota>(nota);
  const [testando, setTestando] = useState(false);
  const [apagar, setApagar] = useState(false);
  const temporizador = useRef<number | undefined>(undefined);
  const ultimoSalvo = useRef(JSON.stringify(nota));

  useEffect(() => {
    const serial = JSON.stringify(rascunho);
    if (serial === ultimoSalvo.current) return;
    window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => {
      ultimoSalvo.current = serial;
      void db.notas.put({ ...rascunho, atualizadoEm: Date.now() });
    }, 600);
    return () => window.clearTimeout(temporizador.current);
  }, [rascunho]);

  const atualizar = (parcial: Partial<Nota>) => setRascunho((r) => ({ ...r, ...parcial }));
  const pistasValidas = rascunho.pistas.filter((p) => p.pergunta.trim() && p.resposta.trim());

  async function sincronizarCards() {
    const dia = hoje();
    const existentes = new Map((await db.flashcards.where("refId").equals(nota.id).toArray()).map((c) => [c.id, c]));
    const cards = pistasValidas.map((p, i) => {
      const id = `${nota.id}#${i}`;
      const anterior = existentes.get(id);
      return { id, origem: "nota" as const, refId: nota.id, materiaSlug: rascunho.materiaSlug, frente: p.pergunta, verso: p.resposta, estado: anterior?.estado ?? cardNovo(dia), criadoEm: anterior?.criadoEm ?? Date.now() };
    });
    await db.flashcards.bulkPut(cards);
    const validos = new Set(cards.map((c) => c.id));
    await db.flashcards.bulkDelete([...existentes.keys()].filter((id) => !validos.has(id)));
    return cards;
  }

  if (testando) {
    return (
      <section aria-label="Testar esta nota" className="surface-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-semibold">Testando: {rascunho.titulo}</h2>
          <Botao variante="fantasma" tamanho="sm" icone={<X size={13} strokeWidth={1.8} />} onClick={() => setTestando(false)}>
            Voltar à nota
          </Botao>
        </div>
        <SessaoFlashcards
          cartoes={pistasValidas.map((p, i) => ({ id: `${nota.id}#${i}`, frente: p.pergunta, verso: p.resposta }))}
          onAvaliar={(id, a) => avaliarFlashcard(id, a)}
          onFim={() => setTestando(false)}
        />
      </section>
    );
  }

  return (
    <article className="surface-card p-5" aria-label={`Nota: ${rascunho.titulo}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="titulo-nota" className="sr-only">
            Título da nota
          </label>
          <input id="titulo-nota" value={rascunho.titulo} onChange={(e) => atualizar({ titulo: e.target.value })} className="w-full bg-transparent text-[18px] font-semibold text-ink focus-visible:outline-offset-4" />
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
            <label htmlFor="materia-nota" className="sr-only">
              Matéria
            </label>
            <select id="materia-nota" value={rascunho.materiaSlug} onChange={(e) => atualizar({ materiaSlug: e.target.value as MateriaSlug })} className="h-7 rounded-md border border-line bg-surface px-1.5 text-[12px]">
              {MATERIAS.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.nomeCurto}
                </option>
              ))}
            </select>
            {rascunho.subtopico && <span>{rascunho.subtopico}</span>}
            <span>· salvo automaticamente</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Botao
            variante="primario"
            icone={<GraduationCap size={14} strokeWidth={1.7} />}
            disabled={pistasValidas.length === 0}
            onClick={async () => {
              await sincronizarCards();
              setTestando(true);
            }}
          >
            Testar esta nota ({pistasValidas.length})
          </Botao>
          <Botao variante="perigo" icone={<Trash2 size={14} strokeWidth={1.7} />} onClick={() => setApagar(true)} aria-label="Apagar nota" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[minmax(200px,0.38fr)_minmax(0,1fr)]">
        <section aria-label="Pistas e perguntas de revisão" className="md:border-r md:border-line md:pr-5">
          <h3 className="mb-2 text-[11.5px] font-semibold tracking-[0.06em] text-ink-2 uppercase">Pistas · perguntas</h3>
          <ol className="flex flex-col gap-3">
            {rascunho.pistas.map((p, i) => (
              <li key={i} className="group flex flex-col gap-1">
                <textarea
                  value={p.pergunta}
                  onChange={(e) => atualizar({ pistas: rascunho.pistas.map((x, k) => (k === i ? { ...x, pergunta: e.target.value } : x)) })}
                  placeholder="Pergunta de revisão"
                  aria-label={`Pergunta ${i + 1}`}
                  rows={2}
                  className="field resize-none text-[13px] font-medium"
                />
                <textarea
                  value={p.resposta}
                  onChange={(e) => atualizar({ pistas: rascunho.pistas.map((x, k) => (k === i ? { ...x, resposta: e.target.value } : x)) })}
                  placeholder="Resposta curta"
                  aria-label={`Resposta ${i + 1}`}
                  rows={2}
                  className="field resize-none text-[12.5px] text-ink-2"
                />
                <button type="button" onClick={() => atualizar({ pistas: rascunho.pistas.filter((_, k) => k !== i) })} className="self-end text-[11.5px] text-ink-2 opacity-0 group-hover:opacity-100 hover:text-danger-text focus-visible:opacity-100">
                  remover pista
                </button>
              </li>
            ))}
          </ol>
          <Botao variante="fantasma" tamanho="sm" className="mt-2" icone={<Plus size={13} strokeWidth={1.8} />} onClick={() => atualizar({ pistas: [...rascunho.pistas, { pergunta: "", resposta: "" }] })}>
            Pista
          </Botao>
        </section>
        <section aria-label="Conteúdo">
          <EditorCornell conteudo={rascunho.conteudo} onChange={(conteudo) => atualizar({ conteudo })} rotulo={`Conteúdo da nota ${rascunho.titulo}`} />
        </section>
      </div>

      <section aria-label="Síntese" className="mt-6 border-t border-line pt-4">
        <label htmlFor="sintese" className="text-[11.5px] font-semibold tracking-[0.06em] text-ink-2 uppercase">
          Síntese com as suas palavras
        </label>
        <textarea id="sintese" value={rascunho.sintese} onChange={(e) => atualizar({ sintese: e.target.value })} rows={3} className="field mt-2 font-serif text-[15px] leading-[1.65]" placeholder="Em 3 a 5 linhas: o que esta nota diz e como cai na prova." />
      </section>

      <Dialogo
        aberto={apagar}
        onFechar={() => setApagar(false)}
        titulo="Apagar esta nota?"
        largura="sm"
        rodape={
          <>
            <Botao variante="fantasma" onClick={() => setApagar(false)}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              onClick={async () => {
                await db.notas.delete(nota.id);
                await db.flashcards.where("refId").equals(nota.id).delete();
                setApagar(false);
              }}
            >
              Apagar
            </Botao>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">A nota e os flashcards das pistas dela serão removidos deste navegador.</p>
      </Dialogo>
    </article>
  );
}
