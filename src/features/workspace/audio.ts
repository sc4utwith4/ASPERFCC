/**
 * Ruído ambiente procedural (Web Audio API, sem arquivos):
 *  - marrom: ruído branco integrado (−6 dB/oitava), bom para mascarar conversa;
 *  - chuva: ruído rosa filtrado com leve modulação;
 *  - binaural 40 Hz: 200 Hz no ouvido esquerdo e 240 Hz no direito (exige fone).
 *    Evidência científica limitada; está aqui porque foi pedido.
 */
export type TipoRuido = "marrom" | "chuva" | "binaural";

interface Canal {
  ganho: GainNode;
  parar: () => void;
}

let contexto: AudioContext | undefined;
const canais = new Map<TipoRuido, Canal>();

function ctx(): AudioContext {
  contexto ??= new AudioContext();
  if (contexto.state === "suspended") void contexto.resume();
  return contexto;
}

function bufferDeRuido(ac: AudioContext, tipo: "marrom" | "rosa"): AudioBuffer {
  const segundos = 4;
  const buffer = ac.createBuffer(2, ac.sampleRate * segundos, ac.sampleRate);
  for (let canal = 0; canal < 2; canal++) {
    const dados = buffer.getChannelData(canal);
    let ultimo = 0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < dados.length; i++) {
      const branco = Math.random() * 2 - 1;
      if (tipo === "marrom") {
        ultimo = (ultimo + 0.02 * branco) / 1.02;
        dados[i] = ultimo * 3.5;
      } else {
        b0 = 0.99886 * b0 + branco * 0.0555179;
        b1 = 0.99332 * b1 + branco * 0.0750759;
        b2 = 0.969 * b2 + branco * 0.153852;
        b3 = 0.8665 * b3 + branco * 0.3104856;
        b4 = 0.55 * b4 + branco * 0.5329522;
        b5 = -0.7616 * b5 - branco * 0.016898;
        dados[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + branco * 0.5362) * 0.11;
        b6 = branco * 0.115926;
      }
    }
  }
  return buffer;
}

function criarCanal(tipo: TipoRuido): Canal {
  const ac = ctx();
  const ganho = ac.createGain();
  ganho.gain.value = 0;
  ganho.connect(ac.destination);
  if (tipo === "binaural") {
    const merger = ac.createChannelMerger(2);
    const esquerdo = ac.createOscillator();
    const direito = ac.createOscillator();
    esquerdo.frequency.value = 200;
    direito.frequency.value = 240;
    esquerdo.connect(merger, 0, 0);
    direito.connect(merger, 0, 1);
    const atenuacao = ac.createGain();
    atenuacao.gain.value = 0.18;
    merger.connect(atenuacao).connect(ganho);
    esquerdo.start();
    direito.start();
    return { ganho, parar: () => { esquerdo.stop(); direito.stop(); ganho.disconnect(); } };
  }
  const fonte = ac.createBufferSource();
  fonte.buffer = bufferDeRuido(ac, tipo === "marrom" ? "marrom" : "rosa");
  fonte.loop = true;
  let saida: AudioNode = fonte;
  let lfo: OscillatorNode | undefined;
  if (tipo === "chuva") {
    const filtro = ac.createBiquadFilter();
    filtro.type = "lowpass";
    filtro.frequency.value = 2400;
    const modulacao = ac.createGain();
    modulacao.gain.value = 0.85;
    lfo = ac.createOscillator();
    lfo.frequency.value = 0.13;
    const profundidade = ac.createGain();
    profundidade.gain.value = 0.15;
    lfo.connect(profundidade).connect(modulacao.gain);
    lfo.start();
    saida = fonte.connect(filtro).connect(modulacao);
  }
  saida.connect(ganho);
  fonte.start();
  return { ganho, parar: () => { fonte.stop(); lfo?.stop(); ganho.disconnect(); } };
}

/** Define o volume (0–1) de um ruído; 0 desliga e libera o canal. */
export function definirVolume(tipo: TipoRuido, volume: number): void {
  const alvo = Math.max(0, Math.min(1, volume));
  let canal = canais.get(tipo);
  if (alvo === 0) {
    if (canal) {
      const ac = ctx();
      canal.ganho.gain.setTargetAtTime(0, ac.currentTime, 0.08);
      const c = canal;
      setTimeout(() => c.parar(), 400);
      canais.delete(tipo);
    }
    return;
  }
  if (!canal) {
    canal = criarCanal(tipo);
    canais.set(tipo, canal);
  }
  canal.ganho.gain.setTargetAtTime(alvo * 0.6, ctx().currentTime, 0.12);
}

export function silenciarTudo(): void {
  for (const tipo of [...canais.keys()]) definirVolume(tipo, 0);
}

/** Sinal curto e suave para fim de fase do timer (duas notas senoidais, volume baixo). */
export function tocarSinalSuave(): void {
  try {
    const ac = ctx();
    const agora = ac.currentTime;
    [523.25, 659.25].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, agora + i * 0.22);
      g.gain.linearRampToValueAtTime(0.06, agora + i * 0.22 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, agora + i * 0.22 + 0.9);
      osc.connect(g).connect(ac.destination);
      osc.start(agora + i * 0.22);
      osc.stop(agora + i * 0.22 + 1);
    });
  } catch {
    /* sem áudio disponível */
  }
}
