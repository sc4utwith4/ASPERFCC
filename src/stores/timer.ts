import { create } from "zustand";
import { persist } from "zustand/middleware";
import { db } from "@/db/db";
import type { MateriaSlug } from "@/data/edital";
import { diaDe } from "@/engine/datas";
import { armazenamentoLocal } from "./armazenamento";

/**
 * Timer de foco. Pomodoro: contagem regressiva (padrão 50/10). Flowtime:
 * cronômetro progressivo, sem interromper o raciocínio; ao parar, sugere
 * pausa de 1/5 do tempo focado. Tudo baseado em timestamps: sobrevive a
 * recarregar a página e a abas em segundo plano.
 */
export type ModoTimer = "pomodoro" | "flowtime";
export type FaseTimer = "foco" | "pausa";

interface EstadoTimer {
  modo: ModoTimer;
  fase: FaseTimer;
  rodando: boolean;
  focoMin: number;
  pausaMin: number;
  inicioCorrida?: number;
  acumuladoMs: number;
  pausaSugeridaMs?: number;
  somAoFim: boolean;
  iniciar: () => void;
  pausar: () => void;
  zerar: () => void;
  /** Flowtime: encerra o foco atual e inicia a pausa sugerida. Pomodoro: pula para a próxima fase. */
  avancarFase: (materiaSlug?: MateriaSlug) => void;
  /** Chamado pelo relógio da interface quando a fase termina. */
  verificarFim: (agora: number, materiaSlug?: MateriaSlug) => FaseTimer | undefined;
  definir: (p: Partial<Pick<EstadoTimer, "modo" | "focoMin" | "pausaMin" | "somAoFim">>) => void;
}

export function decorrido(s: Pick<EstadoTimer, "acumuladoMs" | "rodando" | "inicioCorrida">, agora = Date.now()): number {
  return s.acumuladoMs + (s.rodando && s.inicioCorrida ? agora - s.inicioCorrida : 0);
}

export function duracaoDaFase(s: Pick<EstadoTimer, "modo" | "fase" | "focoMin" | "pausaMin" | "pausaSugeridaMs">): number | undefined {
  if (s.fase === "pausa") return s.modo === "flowtime" ? (s.pausaSugeridaMs ?? s.pausaMin * 60_000) : s.pausaMin * 60_000;
  return s.modo === "pomodoro" ? s.focoMin * 60_000 : undefined;
}

export function pausaFlowtime(focadoMs: number): number {
  const sugerida = Math.round(focadoMs / 5 / 60_000) * 60_000;
  return Math.min(30 * 60_000, Math.max(3 * 60_000, sugerida));
}

async function registrarFoco(inicio: number, fim: number, duracaoMs: number, modo: ModoTimer, materiaSlug?: MateriaSlug) {
  if (duracaoMs < 60_000) return;
  try {
    await db.sessoesFoco.add({ dia: diaDe(new Date(inicio)), inicio, fim, duracaoMs, modo, materiaSlug });
  } catch (e) {
    console.error("Não foi possível registrar a sessão de foco", e);
  }
}

export const useTimer = create<EstadoTimer>()(
  persist(
    (set, get) => ({
      modo: "pomodoro",
      fase: "foco",
      rodando: false,
      focoMin: 50,
      pausaMin: 10,
      acumuladoMs: 0,
      somAoFim: true,
      iniciar: () => {
        if (get().rodando) return;
        set({ rodando: true, inicioCorrida: Date.now() });
      },
      pausar: () => {
        const s = get();
        if (!s.rodando) return;
        set({ rodando: false, acumuladoMs: decorrido(s), inicioCorrida: undefined });
      },
      zerar: () => set({ rodando: false, fase: "foco", acumuladoMs: 0, inicioCorrida: undefined, pausaSugeridaMs: undefined }),
      avancarFase: (materiaSlug) => {
        const s = get();
        const agora = Date.now();
        const tempo = decorrido(s, agora);
        if (s.fase === "foco") {
          void registrarFoco(agora - tempo, agora, tempo, s.modo, materiaSlug);
          set({ fase: "pausa", rodando: true, inicioCorrida: agora, acumuladoMs: 0, pausaSugeridaMs: s.modo === "flowtime" ? pausaFlowtime(tempo) : undefined });
        } else {
          set({ fase: "foco", rodando: false, inicioCorrida: undefined, acumuladoMs: 0, pausaSugeridaMs: undefined });
        }
      },
      verificarFim: (agora, materiaSlug) => {
        const s = get();
        const duracao = duracaoDaFase(s);
        if (!s.rodando || duracao === undefined || decorrido(s, agora) < duracao) return undefined;
        const terminou = s.fase;
        if (terminou === "foco") {
          void registrarFoco(agora - duracao, agora, duracao, s.modo, materiaSlug);
          set({ fase: "pausa", rodando: true, inicioCorrida: agora, acumuladoMs: 0 });
        } else {
          set({ fase: "foco", rodando: false, inicioCorrida: undefined, acumuladoMs: 0, pausaSugeridaMs: undefined });
        }
        return terminou;
      },
      definir: (p) => set((s) => ({ ...p, ...(p.modo && p.modo !== s.modo ? { fase: "foco" as const, rodando: false, acumuladoMs: 0, inicioCorrida: undefined, pausaSugeridaMs: undefined } : {}) })),
    }),
    {
      name: "asperfcc:timer",
      storage: armazenamentoLocal,
      version: 1,
      partialize: ({ modo, fase, rodando, focoMin, pausaMin, inicioCorrida, acumuladoMs, pausaSugeridaMs, somAoFim }) => ({ modo, fase, rodando, focoMin, pausaMin, inicioCorrida, acumuladoMs, pausaSugeridaMs, somAoFim }),
    },
  ),
);
