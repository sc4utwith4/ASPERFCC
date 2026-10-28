import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MateriaSlug } from "@/data/edital";
import { CARACTERES_POR_LINHA_PADRAO } from "@/engine/linhas";
import { armazenamentoLocal } from "./armazenamento";

export type Tema = "claro" | "escuro" | "sistema";
export type FonteLeitura = "newsreader" | "source-serif" | "humanista";

interface EstadoUI {
  tema: Tema;
  fonteLeitura: FonteLeitura;
  tamanhoLeitura: 17 | 18;
  /** 0 a 0,35: intensidade do filtro âmbar. */
  temperatura: number;
  zen: boolean;
  navAberta: boolean;
  painelAberto: boolean;
  materiaAtiva: MateriaSlug;
  caracteresPorLinha: number;
  metaDiaria: number;
  tamanhoBloco: number;
  definir: (parcial: Partial<Omit<EstadoUI, "definir" | "alternarZen">>) => void;
  alternarZen: () => void;
}

export const useUI = create<EstadoUI>()(
  persist(
    (set) => ({
      tema: "sistema",
      fonteLeitura: "newsreader",
      tamanhoLeitura: 18,
      temperatura: 0,
      zen: false,
      navAberta: true,
      painelAberto: true,
      materiaAtiva: "banco-de-dados",
      caracteresPorLinha: CARACTERES_POR_LINHA_PADRAO,
      metaDiaria: 25,
      tamanhoBloco: 10,
      definir: (parcial) => set(parcial),
      alternarZen: () => set((s) => ({ zen: !s.zen })),
    }),
    { name: "asperfcc:ui", storage: armazenamentoLocal, version: 1 },
  ),
);

/** Sincroniza atributos do <html> com as preferências. */
export function aplicarPreferenciasNoDocumento(estado: Pick<EstadoUI, "tema" | "fonteLeitura" | "tamanhoLeitura" | "temperatura">): void {
  const raiz = document.documentElement;
  if (estado.tema === "claro") raiz.dataset.theme = "light";
  else if (estado.tema === "escuro") raiz.dataset.theme = "dark";
  else delete raiz.dataset.theme;
  if (estado.fonteLeitura === "newsreader") delete raiz.dataset.readingFont;
  else raiz.dataset.readingFont = estado.fonteLeitura;
  if (estado.tamanhoLeitura === 17) raiz.dataset.readingSize = "17";
  else delete raiz.dataset.readingSize;
  raiz.style.setProperty("--temperature-alpha", String(estado.temperatura));
}
