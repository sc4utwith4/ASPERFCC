import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BookOpenText,
  CalendarCheck,
  ClipboardList,
  Command,
  Database,
  Focus,
  GalleryVerticalEnd,
  Layers,
  LayoutDashboard,
  Moon,
  NotebookPen,
  PanelLeft,
  PanelRight,
  PenLine,
  Radar,
  Settings,
  SlidersHorizontal,
  Sun,
  Timer as TimerIcon,
} from "lucide-react";
import { MATERIAS, type MateriaSlug } from "@/data/edital";
import { db } from "@/db/db";
import { hoje } from "@/engine/datas";
import { pacoteVencido } from "@/engine/srs";
import { useUI, aplicarPreferenciasNoDocumento, type Tema } from "@/stores/ui";
import { BarraFina, Kbd, cx } from "@/components/ui";
import { Dialogo } from "@/components/Dialogo";
import { Timer } from "@/features/workspace/Timer";
import { PainelApoio } from "@/features/workspace/PainelApoio";
import { digitando, useTeclas } from "./atalhos";

interface ItemNav {
  para: string;
  rotulo: string;
  tecla: string;
  icone: ReactNode;
}

const ICONE = { size: 16, strokeWidth: 1.6 } as const;

export const NAVEGACAO: ItemNav[] = [
  { para: "/", rotulo: "Hoje", tecla: "h", icone: <LayoutDashboard {...ICONE} /> },
  { para: "/materias", rotulo: "Matérias", tecla: "m", icone: <Layers {...ICONE} /> },
  { para: "/revisao", rotulo: "Revisão", tecla: "r", icone: <CalendarCheck {...ICONE} /> },
  { para: "/caderno-revisao", rotulo: "Caderno de Revisão", tecla: "c", icone: <ClipboardList {...ICONE} /> },
  { para: "/notas", rotulo: "Notas Cornell", tecla: "n", icone: <NotebookPen {...ICONE} /> },
  { para: "/flashcards", rotulo: "Flashcards", tecla: "f", icone: <GalleryVerticalEnd {...ICONE} /> },
  { para: "/discursiva", rotulo: "Lab. Discursivo", tecla: "d", icone: <PenLine {...ICONE} /> },
  { para: "/radar", rotulo: "Radar do Edital", tecla: "e", icone: <Radar {...ICONE} /> },
  { para: "/simulado", rotulo: "Simulado", tecla: "s", icone: <TimerIcon {...ICONE} /> },
  { para: "/lotes", rotulo: "Banco e backup", tecla: "b", icone: <Database {...ICONE} /> },
  { para: "/config", rotulo: "Configurações", tecla: "o", icone: <Settings {...ICONE} /> },
];

export function Shell() {
  const ui = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const [paleta, setPaleta] = useState(false);
  const [ajuda, setAjuda] = useState(false);
  const prefixoG = useRef<number>(0);

  useEffect(() => {
    aplicarPreferenciasNoDocumento(ui);
  }, [ui]);

  useTeclas((e) => {
    const mod = e.metaKey || e.ctrlKey;
    if ((e.altKey && e.code === "KeyZ") || (e.metaKey && e.key === ".")) {
      e.preventDefault();
      ui.alternarZen();
      return;
    }
    if (mod && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setPaleta((p) => !p);
      return;
    }
    if (digitando(e) || mod || e.altKey) return;
    if (e.key === "?") {
      e.preventDefault();
      setAjuda(true);
      return;
    }
    if (e.key === "g") {
      prefixoG.current = Date.now();
      return;
    }
    if (Date.now() - prefixoG.current < 1200) {
      const item = NAVEGACAO.find((n) => n.tecla === e.key.toLowerCase());
      prefixoG.current = 0;
      if (item) {
        e.preventDefault();
        navigate(item.para);
      }
    }
  });

  useEffect(() => {
    if (window.innerWidth < 1024) ui.definir({ navAberta: false });
    // Fecha a navegação ao trocar de rota em telas pequenas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const zen = ui.zen;

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-elevated focus:px-3 focus:py-2">
        Pular para o conteúdo
      </a>
      {zen ? <BarraZen /> : <Topbar onPaleta={() => setPaleta(true)} />}
      <div className="flex">
        {!zen && ui.navAberta && (
          <>
            <div className="fixed inset-0 top-12 z-20 bg-canvas/70 lg:hidden" onClick={() => ui.definir({ navAberta: false })} aria-hidden />
            <NavLateral />
          </>
        )}
        <main id="conteudo" className={cx("min-w-0 flex-1", zen ? "pt-10" : "")}>
          <div className={cx("mx-auto px-4 py-6 sm:px-6", zen ? "max-w-[860px]" : "max-w-[1120px]")}>
            <Outlet />
          </div>
        </main>
        {!zen && ui.painelAberto && (
          <aside aria-label="Apoio cognitivo" className="fixed top-12 right-0 bottom-0 z-20 w-[300px] overflow-y-auto border-l border-line bg-surface xl:sticky xl:h-[calc(100dvh-48px)]">
            <PainelApoio />
          </aside>
        )}
      </div>
      <div className="temperature-overlay" aria-hidden />
      <PaletaComandos aberta={paleta} onFechar={() => setPaleta(false)} />
      <AjudaAtalhos aberta={ajuda} onFechar={() => setAjuda(false)} />
    </div>
  );
}

function useProgressoDoDia(): { feitas: number; meta: number } {
  const meta = useUI((s) => s.metaDiaria);
  const feitas = useLiveQuery(async () => new Set((await db.tentativas.where("dia").equals(hoje()).toArray()).map((t) => `${t.questaoId}:${t.contexto}`)).size, []) ?? 0;
  return { feitas, meta };
}

function Topbar({ onPaleta }: { onPaleta: () => void }) {
  const ui = useUI();
  const { feitas, meta } = useProgressoDoDia();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas">
      <div className="flex h-12 items-center gap-2 px-3">
        <button type="button" onClick={() => ui.definir({ navAberta: !ui.navAberta })} className="quiet-transition rounded-md p-1.5 text-ink-2 hover:bg-surface hover:text-ink" aria-label={ui.navAberta ? "Recolher navegação" : "Abrir navegação"} aria-expanded={ui.navAberta}>
          <PanelLeft size={17} strokeWidth={1.6} />
        </button>
        <NavLink to="/" className="mr-2 hidden items-center gap-2 text-[13px] font-semibold text-ink sm:flex">
          <BookOpenText size={16} strokeWidth={1.7} className="text-accent-text" />
          Caderno FCC
          <span className="font-normal text-ink-2">TCE-GO · TI</span>
        </NavLink>
        <SeletorMateria valor={ui.materiaAtiva} onChange={(m) => ui.definir({ materiaAtiva: m })} />
        <span className="tabular hidden text-[12px] text-ink-2 md:inline" title="Questões resolvidas hoje / meta diária">
          {feitas}/{meta} hoje
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="hidden sm:block">
            <Timer />
          </div>
          <BotaoIcone rotulo="Modo Zen (Alt+Z)" onClick={ui.alternarZen}>
            <Focus size={16} strokeWidth={1.6} />
          </BotaoIcone>
          <ConfortoVisual />
          <BotaoIcone rotulo="Paleta de comandos (Ctrl+K)" onClick={onPaleta} className="hidden md:inline-flex">
            <Command size={15} strokeWidth={1.6} />
          </BotaoIcone>
          <BotaoIcone rotulo={ui.painelAberto ? "Recolher painel de apoio" : "Abrir painel de apoio"} onClick={() => ui.definir({ painelAberto: !ui.painelAberto })}>
            <PanelRight size={16} strokeWidth={1.6} />
          </BotaoIcone>
        </div>
      </div>
      <BarraFina valor={meta ? feitas / meta : 0} rotulo="Progresso da meta diária" className="absolute bottom-[-1px] left-0" />
    </header>
  );
}

function BarraZen() {
  const sair = useUI((s) => s.alternarZen);
  return (
    <div className="fixed top-0 right-0 left-0 z-30 flex h-9 items-center justify-end gap-3 px-4">
      <Timer compacto />
      <button type="button" onClick={sair} className="quiet-transition flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-ink-2 hover:bg-surface hover:text-ink">
        Sair do Zen <Kbd>Alt</Kbd>
        <Kbd>Z</Kbd>
      </button>
    </div>
  );
}

export function BotaoIcone({ rotulo, onClick, children, className }: { rotulo: string; onClick: () => void; children: ReactNode; className?: string }) {
  return (
    <button type="button" onClick={onClick} aria-label={rotulo} title={rotulo} className={cx("quiet-transition inline-flex rounded-md p-1.5 text-ink-2 hover:bg-surface hover:text-ink", className)}>
      {children}
    </button>
  );
}

function SeletorMateria({ valor, onChange }: { valor: MateriaSlug; onChange: (m: MateriaSlug) => void }) {
  return (
    <label className="flex min-w-0 items-center">
      <span className="sr-only">Matéria ativa</span>
      <select value={valor} onChange={(e) => onChange(e.target.value as MateriaSlug)} className="h-8 max-w-[220px] min-w-0 truncate rounded-lg border border-line bg-surface px-2 text-[12.5px] text-ink">
        <optgroup label="Conhecimentos Gerais (peso 1)">
          {MATERIAS.filter((m) => m.bloco === "gerais").map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.nomeCurto}
            </option>
          ))}
        </optgroup>
        <optgroup label="Conhecimentos Específicos (peso 2)">
          {MATERIAS.filter((m) => m.bloco === "especificos").map((m) => (
            <option key={m.slug} value={m.slug}>
              {m.nomeCurto}
            </option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}

function ConfortoVisual() {
  const ui = useUI();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [aberto]);
  const escuroAtivo = ui.tema === "escuro" || (ui.tema === "sistema" && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  const temas: { id: Tema; rotulo: string }[] = [
    { id: "claro", rotulo: "Papel (dia)" },
    { id: "escuro", rotulo: "Ardósia (noite)" },
    { id: "sistema", rotulo: "Sistema" },
  ];
  return (
    <div className="relative" ref={ref}>
      <BotaoIcone rotulo="Conforto visual: tema e filtro de temperatura" onClick={() => setAberto((a) => !a)}>
        {escuroAtivo ? <Moon size={16} strokeWidth={1.6} /> : <Sun size={16} strokeWidth={1.6} />}
      </BotaoIcone>
      {aberto && (
        <div className="absolute top-10 right-0 z-40 w-64 rounded-xl border border-line bg-elevated p-3 shadow-float">
          <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-ink-2">
            <SlidersHorizontal size={13} strokeWidth={1.7} /> Conforto visual
          </p>
          <div className="grid grid-cols-3 gap-1" role="radiogroup" aria-label="Tema">
            {temas.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={ui.tema === t.id}
                onClick={() => ui.definir({ tema: t.id })}
                className={cx("quiet-transition rounded-md border px-1.5 py-1.5 text-[11.5px]", ui.tema === t.id ? "border-accent bg-accent-soft text-accent-text" : "border-line text-ink-2 hover:bg-surface")}
              >
                {t.rotulo}
              </button>
            ))}
          </div>
          <label htmlFor="temperatura" className="mt-3 flex items-baseline justify-between text-[12.5px] text-ink">
            Filtro âmbar (madrugada)
            <span className="tabular text-[11.5px] text-ink-2">{Math.round((ui.temperatura / 0.35) * 100)}%</span>
          </label>
          <input id="temperatura" type="range" min={0} max={0.35} step={0.01} value={ui.temperatura} onChange={(e) => ui.definir({ temperatura: Number(e.target.value) })} className="range mt-1 w-full" />
          <p className="mt-2 text-[11.5px] text-ink-2">Atalho do Modo Zen: Alt+Z ou ⌘+.</p>
        </div>
      )}
    </div>
  );
}

function NavLateral() {
  const dia = hoje();
  const vencidos = useLiveQuery(async () => (await db.pacotes.toArray()).filter((p) => pacoteVencido(p, dia)).length, [dia]) ?? 0;
  return (
    <nav aria-label="Principal" className="fixed top-12 bottom-0 left-0 z-30 w-[212px] shrink-0 overflow-y-auto border-r border-line bg-canvas px-2 py-3 lg:sticky lg:h-[calc(100dvh-48px)]">
      <ul className="flex flex-col gap-0.5">
        {NAVEGACAO.map((item) => (
          <li key={item.para}>
            <NavLink
              to={item.para}
              end={item.para === "/"}
              className={({ isActive }) =>
                cx("quiet-transition group flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px]", isActive ? "bg-surface font-medium text-ink" : "text-ink-2 hover:bg-surface hover:text-ink")
              }
            >
              <span className="text-ink-2 group-aria-[current=page]:text-accent-text">{item.icone}</span>
              <span className="flex-1 truncate">{item.rotulo}</span>
              {item.para === "/revisao" && vencidos > 0 ? (
                <span className="tabular rounded-full bg-warning-soft px-1.5 text-[11px] font-medium text-warning-text" aria-label={`${vencidos} revisões vencidas`}>
                  {vencidos}
                </span>
              ) : (
                <span className="hidden text-[10.5px] text-ink-3 group-hover:inline" aria-hidden>
                  g {item.tecla}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

interface Comando {
  id: string;
  rotulo: string;
  grupo: string;
  executar: () => void;
}

function PaletaComandos({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  const navigate = useNavigate();
  const ui = useUI();
  const [busca, setBusca] = useState("");
  const [indice, setIndice] = useState(0);
  const comandos = useMemo<Comando[]>(
    () => [
      ...NAVEGACAO.map((n) => ({ id: `nav-${n.para}`, rotulo: `Ir para ${n.rotulo}`, grupo: "Navegação", executar: () => navigate(n.para) })),
      ...MATERIAS.map((m) => ({ id: `mat-${m.slug}`, rotulo: `Estudar ${m.nome}`, grupo: "Matérias", executar: () => { ui.definir({ materiaAtiva: m.slug }); navigate(`/materias/${m.slug}`); } })),
      { id: "zen", rotulo: "Alternar Modo Zen", grupo: "Workspace", executar: ui.alternarZen },
      { id: "tema-claro", rotulo: "Tema Papel (dia)", grupo: "Workspace", executar: () => ui.definir({ tema: "claro" }) },
      { id: "tema-escuro", rotulo: "Tema Ardósia (noite)", grupo: "Workspace", executar: () => ui.definir({ tema: "escuro" }) },
      { id: "painel", rotulo: "Mostrar/ocultar painel de apoio", grupo: "Workspace", executar: () => ui.definir({ painelAberto: !ui.painelAberto }) },
      { id: "simulado", rotulo: "Iniciar Simulado Prova Real", grupo: "Ações", executar: () => navigate("/simulado") },
    ],
    [navigate, ui],
  );
  const filtrados = comandos.filter((c) => c.rotulo.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(busca.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")));
  useEffect(() => {
    if (aberta) {
      setBusca("");
      setIndice(0);
    }
  }, [aberta]);
  function executar(c: Comando | undefined) {
    if (!c) return;
    onFechar();
    c.executar();
  }
  return (
    <Dialogo aberto={aberta} onFechar={onFechar} titulo="Paleta de comandos" largura="md">
      <input
        autoFocus
        value={busca}
        onChange={(e) => {
          setBusca(e.target.value);
          setIndice(0);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setIndice((i) => Math.min(filtrados.length - 1, i + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setIndice((i) => Math.max(0, i - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            executar(filtrados[indice]);
          }
        }}
        placeholder="Buscar comando, matéria ou tela…"
        aria-label="Buscar comando"
        className="field"
      />
      <ul className="mt-3 max-h-[50dvh] overflow-y-auto" role="listbox" aria-label="Comandos">
        {filtrados.map((c, i) => (
          <li key={c.id} role="option" aria-selected={i === indice}>
            <button type="button" onClick={() => executar(c)} onMouseEnter={() => setIndice(i)} className={cx("flex w-full items-center justify-between rounded-md px-2.5 py-2 text-left text-[13px]", i === indice ? "bg-surface text-ink" : "text-ink-2")}>
              {c.rotulo}
              <span className="text-[11px] text-ink-2">{c.grupo}</span>
            </button>
          </li>
        ))}
        {filtrados.length === 0 && <li className="px-2.5 py-2 text-[13px] text-ink-2">Nenhum comando encontrado.</li>}
      </ul>
    </Dialogo>
  );
}

const ATALHOS: { grupo: string; itens: [string, string][] }[] = [
  {
    grupo: "Resolução de questões",
    itens: [
      ["A a E", "Marcar alternativa"],
      ["Shift + A a E", "Riscar ou desriscar (também botão direito)"],
      ["1 · 2 · 3", "Confiança: certeza · dúvida entre 2 · chute"],
      ["Enter", "Confirmar resposta / próxima questão"],
      ["R", "Abrir ou fechar o rascunho"],
    ],
  },
  { grupo: "Flashcards", itens: [["Espaço", "Virar o cartão"], ["1 · 2 · 3", "Difícil · Bom · Fácil"]] },
  {
    grupo: "Workspace",
    itens: [
      ["Alt + Z  ou  ⌘ + .", "Modo Zen"],
      ["Ctrl/⌘ + K", "Paleta de comandos"],
      ["g e uma letra", "Ir para: h Hoje · m Matérias · r Revisão · c Caderno · n Notas · f Flashcards · d Discursiva · e Radar · s Simulado · b Banco · o Config."],
      ["?", "Esta ajuda"],
    ],
  },
];

function AjudaAtalhos({ aberta, onFechar }: { aberta: boolean; onFechar: () => void }) {
  return (
    <Dialogo aberto={aberta} onFechar={onFechar} titulo="Atalhos de teclado" largura="lg">
      <div className="grid gap-5 sm:grid-cols-2">
        {ATALHOS.map((g) => (
          <section key={g.grupo}>
            <h3 className="mb-2 text-[12px] font-semibold tracking-[0.04em] text-ink-2 uppercase">{g.grupo}</h3>
            <dl className="flex flex-col gap-1.5">
              {g.itens.map(([tecla, acao]) => (
                <div key={tecla} className="grid grid-cols-[130px_1fr] gap-3 text-[13px]">
                  <dt>
                    <Kbd>{tecla}</Kbd>
                  </dt>
                  <dd className="text-ink-2">{acao}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Dialogo>
  );
}
