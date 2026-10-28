import { useState, type FormEvent } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Check, ChevronDown, ChevronRight, Trash2 } from "lucide-react";
import { db, type TarefaBacklog } from "@/db/db";
import { novoId } from "@/engine/rng";
import { cx } from "@/components/ui";
import { definirVolume, type TipoRuido } from "./audio";

const VISIVEIS = 5;

export function PainelApoio() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <MicroBacklog />
      <BrainDump />
      <Ruido />
    </div>
  );
}

function TituloSecao({ children, detalhe }: { children: string; detalhe?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <h2 className="text-[12px] font-semibold tracking-[0.04em] text-ink-2 uppercase">{children}</h2>
      {detalhe && <span className="text-[11.5px] text-ink-2">{detalhe}</span>}
    </div>
  );
}

function MicroBacklog() {
  const tarefas = useLiveQuery(() => db.backlog.orderBy("ordem").toArray(), []) ?? [];
  const [verTodas, setVerTodas] = useState(false);
  const [novo, setNovo] = useState("");
  const pendentes = tarefas.filter((t) => !t.feita);
  const feitas = tarefas.filter((t) => t.feita);
  const lista = verTodas ? [...pendentes, ...feitas] : pendentes.slice(0, VISIVEIS);

  async function adicionar(e: FormEvent) {
    e.preventDefault();
    const titulo = novo.trim();
    if (!titulo) return;
    const ordem = (tarefas.at(-1)?.ordem ?? 0) + 1;
    await db.backlog.add({ id: novoId("tarefa"), titulo, feita: false, ordem, subtarefas: [], criadoEm: Date.now() });
    setNovo("");
  }

  return (
    <section aria-labelledby="titulo-backlog">
      <TituloSecao detalhe={`${pendentes.length} pendente${pendentes.length === 1 ? "" : "s"}`}>Prioridades da sessão</TituloSecao>
      <ul className="flex flex-col gap-1">
        {lista.map((t) => (
          <ItemTarefa key={t.id} tarefa={t} />
        ))}
      </ul>
      {pendentes.length > VISIVEIS || feitas.length > 0 ? (
        <button type="button" onClick={() => setVerTodas((v) => !v)} className="quiet-transition mt-1 text-[12px] text-ink-2 hover:text-ink">
          {verTodas ? "Mostrar só as próximas" : `Ver todas (${tarefas.length})`}
        </button>
      ) : null}
      <form onSubmit={adicionar} className="mt-2">
        <label className="sr-only" htmlFor="nova-tarefa">
          Nova prioridade
        </label>
        <input id="nova-tarefa" value={novo} onChange={(e) => setNovo(e.target.value)} placeholder="Nova prioridade + Enter" className="field h-8 py-0 text-[13px]" />
      </form>
    </section>
  );
}

function ItemTarefa({ tarefa }: { tarefa: TarefaBacklog }) {
  const [aberta, setAberta] = useState(false);
  const [sub, setSub] = useState("");
  const alternar = () => db.backlog.update(tarefa.id, { feita: !tarefa.feita });
  const alternarSub = (id: string) => db.backlog.update(tarefa.id, { subtarefas: tarefa.subtarefas.map((s) => (s.id === id ? { ...s, feita: !s.feita } : s)) });
  async function adicionarSub(e: FormEvent) {
    e.preventDefault();
    if (!sub.trim()) return;
    await db.backlog.update(tarefa.id, { subtarefas: [...tarefa.subtarefas, { id: novoId("sub"), titulo: sub.trim(), feita: false }] });
    setSub("");
  }
  const feitas = tarefa.subtarefas.filter((s) => s.feita).length;
  return (
    <li className="group rounded-md">
      <div className="flex items-start gap-2 rounded-md px-1 py-1 hover:bg-surface">
        <Caixa marcada={tarefa.feita} onClick={alternar} rotulo={tarefa.titulo} />
        <button type="button" onClick={() => setAberta((a) => !a)} className="flex min-w-0 flex-1 items-start gap-1 text-left" aria-expanded={aberta}>
          <span className={cx("min-w-0 flex-1 text-[13px] leading-snug", tarefa.feita ? "strike" : "text-ink")}>{tarefa.titulo}</span>
          {tarefa.subtarefas.length > 0 && <span className="tabular mt-px text-[11px] text-ink-2">{feitas}/{tarefa.subtarefas.length}</span>}
          {aberta ? <ChevronDown size={14} className="mt-0.5 shrink-0 text-ink-3" /> : <ChevronRight size={14} className="mt-0.5 shrink-0 text-ink-3" />}
        </button>
        <button type="button" onClick={() => db.backlog.delete(tarefa.id)} className="quiet-transition rounded p-0.5 text-ink-3 opacity-0 group-hover:opacity-100 hover:text-danger-text focus-visible:opacity-100" aria-label={`Remover ${tarefa.titulo}`}>
          <Trash2 size={13} strokeWidth={1.6} />
        </button>
      </div>
      {aberta && (
        <div className="mb-1 ml-7 flex flex-col gap-0.5">
          {tarefa.subtarefas.map((s) => (
            <div key={s.id} className="flex items-start gap-2 py-0.5">
              <Caixa marcada={s.feita} onClick={() => alternarSub(s.id)} rotulo={s.titulo} pequena />
              <span className={cx("text-[12.5px] leading-snug", s.feita ? "strike" : "text-ink-2")}>{s.titulo}</span>
            </div>
          ))}
          <form onSubmit={adicionarSub}>
            <input value={sub} onChange={(e) => setSub(e.target.value)} placeholder="Subtarefa + Enter" aria-label="Nova subtarefa" className="field mt-1 h-7 py-0 text-[12.5px]" />
          </form>
        </div>
      )}
    </li>
  );
}

function Caixa({ marcada, onClick, rotulo, pequena }: { marcada: boolean; onClick: () => void; rotulo: string; pequena?: boolean }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={marcada}
      aria-label={rotulo}
      onClick={onClick}
      className={cx("quiet-transition mt-0.5 flex shrink-0 items-center justify-center rounded border", pequena ? "size-3.5" : "size-4", marcada ? "border-accent bg-accent text-on-accent" : "border-line-control bg-elevated")}
    >
      {marcada && <Check size={pequena ? 10 : 12} strokeWidth={2.4} />}
    </button>
  );
}

function BrainDump() {
  const capturas = useLiveQuery(() => db.brainDump.orderBy("criadoEm").reverse().toArray(), []) ?? [];
  const [texto, setTexto] = useState("");
  const abertas = capturas.filter((c) => !c.resolvida);
  async function capturar(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    await db.brainDump.add({ id: novoId("captura"), texto: t, criadoEm: Date.now(), resolvida: false });
    setTexto("");
  }
  return (
    <section>
      <TituloSecao detalhe={abertas.length ? `${abertas.length} para depois` : undefined}>Brain dump</TituloSecao>
      <form onSubmit={capturar}>
        <label htmlFor="brain-dump" className="sr-only">
          Capturar pensamento intrusivo
        </label>
        <input id="brain-dump" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Tirou o foco? Anote + Enter" className="field h-8 py-0 text-[13px]" autoComplete="off" />
      </form>
      <ul className="mt-2 flex flex-col">
        {abertas.slice(0, 8).map((c) => (
          <li key={c.id} className="group flex items-start gap-2 rounded-md px-1 py-1 hover:bg-surface">
            <Caixa marcada={false} onClick={() => db.brainDump.update(c.id, { resolvida: true })} rotulo={`Resolver: ${c.texto}`} pequena />
            <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-ink-2">{c.texto}</span>
            <button type="button" onClick={() => db.brainDump.delete(c.id)} className="quiet-transition rounded p-0.5 text-ink-3 opacity-0 group-hover:opacity-100 hover:text-danger-text focus-visible:opacity-100" aria-label="Apagar captura">
              <Trash2 size={12} strokeWidth={1.6} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

const RUIDOS: { tipo: TipoRuido; rotulo: string; nota?: string }[] = [
  { tipo: "marrom", rotulo: "Ruído marrom" },
  { tipo: "chuva", rotulo: "Chuva suave" },
  { tipo: "binaural", rotulo: "Binaural 40 Hz", nota: "Use fone. Evidência científica limitada." },
];

function Ruido() {
  const [volumes, setVolumes] = useState<Record<TipoRuido, number>>({ marrom: 0, chuva: 0, binaural: 0 });
  return (
    <section>
      <TituloSecao>Ruído ambiente</TituloSecao>
      <div className="flex flex-col gap-3">
        {RUIDOS.map((r) => (
          <div key={r.tipo}>
            <div className="flex items-baseline justify-between">
              <label htmlFor={`ruido-${r.tipo}`} className="text-[12.5px] text-ink">
                {r.rotulo}
              </label>
              <span className="tabular text-[11.5px] text-ink-2">{Math.round(volumes[r.tipo] * 100)}%</span>
            </div>
            <input
              id={`ruido-${r.tipo}`}
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volumes[r.tipo]}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolumes((s) => ({ ...s, [r.tipo]: v }));
                definirVolume(r.tipo, v);
              }}
              className="range mt-1 w-full"
            />
            {r.nota && <p className="mt-0.5 text-[11.5px] text-ink-2">{r.nota}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
