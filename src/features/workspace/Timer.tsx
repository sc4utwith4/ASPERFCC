import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { formatarDuracao } from "@/engine/datas";
import { useTimer, decorrido, duracaoDaFase } from "@/stores/timer";
import { useUI } from "@/stores/ui";
import { cx } from "@/components/ui";
import { tocarSinalSuave } from "./audio";

export function useAgora(intervaloMs = 1000): number {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), intervaloMs);
    return () => window.clearInterval(id);
  }, [intervaloMs]);
  return agora;
}

/** Valor exibido: regressivo no Pomodoro e na pausa; progressivo no foco do Flowtime. */
export function useLeituraTimer() {
  const agora = useAgora(1000);
  const timer = useTimer();
  const materiaAtiva = useUI((s) => s.materiaAtiva);
  const { verificarFim, somAoFim } = timer;
  useEffect(() => {
    const terminou = verificarFim(agora, materiaAtiva);
    if (terminou && somAoFim) tocarSinalSuave();
  }, [agora, verificarFim, materiaAtiva, somAoFim]);
  const tempo = decorrido(timer, agora);
  const duracao = duracaoDaFase(timer);
  const exibido = duracao === undefined ? tempo : Math.max(0, duracao - tempo);
  return { timer, exibido, tempo, duracao };
}

export function Timer({ compacto = false }: { compacto?: boolean }) {
  const { timer, exibido } = useLeituraTimer();
  const materiaAtiva = useUI((s) => s.materiaAtiva);
  const emFoco = timer.fase === "foco";
  const cor = !timer.rodando ? "bg-ink-3" : emFoco ? "bg-accent" : "bg-warning";
  const rotuloFase = emFoco ? (timer.modo === "flowtime" ? "Flowtime" : "Foco") : "Pausa";

  if (compacto) {
    return (
      <span className="inline-flex items-center gap-2 text-[12px] text-ink-2" aria-live="off">
        <span aria-hidden className={cx("size-1.5 rounded-full", cor)} />
        <span className="dado">{formatarDuracao(exibido)}</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-line bg-surface py-0.5 pr-0.5 pl-2.5">
      <span aria-hidden className={cx("size-1.5 rounded-full quiet-transition", cor)} />
      <button
        type="button"
        onClick={() => timer.definir({ modo: timer.modo === "pomodoro" ? "flowtime" : "pomodoro" })}
        className="quiet-transition ml-1 rounded px-1 text-[11.5px] text-ink-2 hover:text-ink"
        title="Alternar Pomodoro / Flowtime"
      >
        {rotuloFase}
      </button>
      <span className="dado min-w-[52px] text-center text-[13px] text-ink" aria-label={`${rotuloFase}: ${formatarDuracao(exibido)}`}>
        {formatarDuracao(exibido)}
      </span>
      <button type="button" onClick={timer.rodando ? timer.pausar : timer.iniciar} className="quiet-transition rounded-md p-1.5 text-ink-2 hover:bg-elevated hover:text-ink" aria-label={timer.rodando ? "Pausar timer" : "Iniciar timer"}>
        {timer.rodando ? <Pause size={14} strokeWidth={1.7} /> : <Play size={14} strokeWidth={1.7} />}
      </button>
      <button
        type="button"
        onClick={() => timer.avancarFase(materiaAtiva)}
        className="quiet-transition rounded-md p-1.5 text-ink-2 hover:bg-elevated hover:text-ink"
        aria-label={emFoco ? (timer.modo === "flowtime" ? "Encerrar foco e iniciar pausa sugerida" : "Pular para a pausa") : "Encerrar pausa"}
        title={emFoco ? (timer.modo === "flowtime" ? "Encerrar foco (pausa sugerida = 1/5 do tempo)" : "Pular para a pausa") : "Encerrar pausa"}
      >
        <SkipForward size={14} strokeWidth={1.7} />
      </button>
      <button type="button" onClick={timer.zerar} className="quiet-transition rounded-md p-1.5 text-ink-2 hover:bg-elevated hover:text-ink" aria-label="Zerar timer" title="Zerar">
        <RotateCcw size={13} strokeWidth={1.7} />
      </button>
    </div>
  );
}
