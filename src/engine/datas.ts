/**
 * Datas de estudo são "dias locais" no formato AAAA-MM-DD. Toda a aritmética
 * usa meio-dia local para não sofrer com horário de verão.
 */
export type Dia = string;

const RE_DIA = /^(\d{4})-(\d{2})-(\d{2})$/;

export function diaDe(data: Date): Dia {
  const a = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, "0");
  const d = String(data.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

export function hoje(agora: Date = new Date()): Dia {
  return diaDe(agora);
}

export function dataDe(dia: Dia): Date {
  const m = RE_DIA.exec(dia);
  if (!m) throw new Error(`Dia inválido: ${dia}`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0, 0);
}

export function somarDias(dia: Dia, dias: number): Dia {
  const d = dataDe(dia);
  d.setDate(d.getDate() + dias);
  return diaDe(d);
}

/** Dias corridos de `de` até `ate` (positivo se `ate` é depois). */
export function diferencaDias(de: Dia, ate: Dia): number {
  return Math.round((dataDe(ate).getTime() - dataDe(de).getTime()) / 86_400_000);
}

export function menorDia(a: Dia, b: Dia): Dia {
  return a <= b ? a : b;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function formatarDia(dia: Dia): string {
  const d = dataDe(dia);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function formatarDiaCurto(dia: Dia): string {
  const d = dataDe(dia);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

export function diaDaSemana(dia: Dia): string {
  return SEMANA[dataDe(dia).getDay()]!;
}

export function formatarDuracao(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
