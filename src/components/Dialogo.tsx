import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cx } from "./ui";

/** Diálogo modal nativo (<dialog>): foco preso, Esc fecha, sem bibliotecas. */
export function Dialogo({ aberto, onFechar, titulo, children, largura = "md", rodape }: { aberto: boolean; onFechar: () => void; titulo: ReactNode; children: ReactNode; largura?: "sm" | "md" | "lg"; rodape?: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);
  return (
    <dialog
      ref={ref}
      onClose={onFechar}
      onCancel={(e) => {
        e.preventDefault();
        onFechar();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onFechar();
      }}
      className={cx("dialogo m-auto w-[calc(100%-32px)] rounded-xl border border-line bg-elevated p-0 text-ink shadow-float", largura === "sm" ? "max-w-sm" : largura === "lg" ? "max-w-3xl" : "max-w-lg")}
    >
      {aberto && (
        <div className="flex max-h-[85dvh] flex-col">
          <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
            <h2 className="text-[14px] font-semibold">{titulo}</h2>
            <button type="button" onClick={onFechar} className="quiet-transition rounded-md p-1 text-ink-2 hover:bg-surface hover:text-ink" aria-label="Fechar">
              <X size={16} strokeWidth={1.6} />
            </button>
          </header>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {rodape && <footer className="flex justify-end gap-2 border-t border-line px-5 py-3">{rodape}</footer>}
        </div>
      )}
    </dialog>
  );
}
