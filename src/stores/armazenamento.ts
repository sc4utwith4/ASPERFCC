import { createJSONStorage, type StateStorage } from "zustand/middleware";

/** localStorage que nunca lança (aba privada, armazenamento bloqueado, cota cheia). */
const seguro: StateStorage = {
  getItem: (nome) => {
    try {
      return localStorage.getItem(nome);
    } catch {
      return null;
    }
  },
  setItem: (nome, valor) => {
    try {
      localStorage.setItem(nome, valor);
    } catch {
      /* preferência local; o app funciona sem ela */
    }
  },
  removeItem: (nome) => {
    try {
      localStorage.removeItem(nome);
    } catch {
      /* idem */
    }
  },
};

export const armazenamentoLocal = createJSONStorage(() => seguro);
