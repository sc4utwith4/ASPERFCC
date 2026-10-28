import { useEffect, useRef } from "react";

/** True quando o foco está num campo de texto (atalhos de letra não devem disparar). */
export function digitando(e: KeyboardEvent): boolean {
  const alvo = e.target as HTMLElement | null;
  if (!alvo) return false;
  if (alvo.isContentEditable) return true;
  const tag = alvo.tagName;
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const tipo = (alvo as HTMLInputElement).type;
    return !["checkbox", "radio", "range", "button", "submit"].includes(tipo);
  }
  return false;
}

/** Escuta teclas na janela com o handler mais recente (sem reinscrever a cada render). */
export function useTeclas(handler: (e: KeyboardEvent) => void, ativo = true): void {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!ativo) return;
    const fn = (e: KeyboardEvent) => ref.current(e);
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [ativo]);
}
