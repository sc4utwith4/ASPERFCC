import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { PROVA } from "@/data/edital";
import { db, gravarConfig } from "@/db/db";
import { dataDaProva, premissasGrupo } from "@/db/servicos";
import { limparExemplos } from "@/db/seeder";
import { formatarNumero, PREMISSAS_PADRAO, valorMarginal, type PremissasGrupo } from "@/engine/pontuacao";
import { useTimer } from "@/stores/timer";
import { useUI, type FonteLeitura } from "@/stores/ui";
import { Alternador, Botao, Painel, TituloPagina } from "@/components/ui";
import { Dialogo } from "@/components/Dialogo";

export default function ConfigPage() {
  const ui = useUI();
  const timer = useTimer();
  const dataProva = useLiveQuery(() => dataDaProva(), []);
  const premissas = useLiveQuery(() => premissasGrupo(), []);
  const [apagarTudo, setApagarTudo] = useState(false);
  const [aviso, setAviso] = useState<string>();
  if (!dataProva || !premissas) return null;
  const marginal = valorMarginal(premissas);

  const definirPremissa = (chave: keyof PremissasGrupo, valor: number) => void gravarConfig("premissas", { ...premissas, [chave]: valor });

  return (
    <>
      <TituloPagina titulo="Configurações" subtitulo="Preferências ficam neste navegador. Dados de estudo podem ser exportados em Banco e backup." />
      {aviso && (
        <p className="mb-4 rounded-lg border border-line bg-surface px-3 py-2 text-[13px]" role="status">
          {aviso}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Painel titulo="Prova e ritmo">
          <Campo rotulo="Data da prova" ajuda={`Edital: ${PROVA.dataProva.split("-").reverse().join("/")}`}>
            <input type="date" value={dataProva} onChange={(e) => e.target.value && void gravarConfig("dataProva", e.target.value)} className="field h-8 max-w-[200px] py-0" />
          </Campo>
          <Campo rotulo="Meta diária de questões" ajuda="Usada na barra fina da topbar e no cálculo de ritmo.">
            <input type="number" min={5} max={200} value={ui.metaDiaria} onChange={(e) => ui.definir({ metaDiaria: Math.max(5, Number(e.target.value) || 25) })} className="field tabular h-8 max-w-[120px] py-0" />
          </Campo>
        </Painel>

        <Painel titulo="Premissas da nota padronizada" descricao="Média e desvio-padrão de acertos do grupo. Só se conhecem depois da prova; ajuste conforme referências de concursos FCC parecidos.">
          <div className="grid grid-cols-2 gap-3">
            <CampoNumero rotulo="Média · Gerais (de 25)" valor={premissas.mediaGerais} onChange={(v) => definirPremissa("mediaGerais", v)} />
            <CampoNumero rotulo="Desvio · Gerais" valor={premissas.sigmaGerais} onChange={(v) => definirPremissa("sigmaGerais", v)} />
            <CampoNumero rotulo="Média · Específicos (de 45)" valor={premissas.mediaEspecificos} onChange={(v) => definirPremissa("mediaEspecificos", v)} />
            <CampoNumero rotulo="Desvio · Específicos" valor={premissas.sigmaEspecificos} onChange={(v) => definirPremissa("sigmaEspecificos", v)} />
          </div>
          <p className="mt-3 text-[12.5px] text-ink-2">
            Com estas premissas, 1 acerto em Específicos vale {formatarNumero(marginal.especifica, 2)} pontos e 1 em Gerais vale {formatarNumero(marginal.geral, 2)} ({formatarNumero(marginal.razao, 2)}×).
          </p>
          <Botao tamanho="sm" variante="fantasma" className="mt-2" onClick={() => void gravarConfig("premissas", PREMISSAS_PADRAO)}>
            Restaurar padrão
          </Botao>
        </Painel>

        <Painel titulo="Leitura">
          <Campo rotulo="Fonte de leitura">
            <select value={ui.fonteLeitura} onChange={(e) => ui.definir({ fonteLeitura: e.target.value as FonteLeitura })} className="field h-8 max-w-[260px] py-0">
              <option value="newsreader">Newsreader (serifada editorial)</option>
              <option value="source-serif">Source Serif 4 (serifada)</option>
              <option value="humanista">Source Sans 3 (sans humanista)</option>
            </select>
          </Campo>
          <Campo rotulo="Tamanho do texto de leitura">
            <select value={ui.tamanhoLeitura} onChange={(e) => ui.definir({ tamanhoLeitura: Number(e.target.value) as 17 | 18 })} className="field h-8 max-w-[160px] py-0">
              <option value={17}>17 px</option>
              <option value={18}>18 px</option>
            </select>
          </Campo>
          <p className="reading mt-3 rounded-lg border border-line bg-elevated p-3">O controle externo da administração pública é exercido com o auxílio do Tribunal de Contas, a quem compete apreciar as contas prestadas anualmente.</p>
        </Painel>

        <Painel titulo="Timer de foco">
          <div className="grid grid-cols-2 gap-3">
            <CampoNumero rotulo="Foco (min) · Pomodoro" valor={timer.focoMin} onChange={(v) => timer.definir({ focoMin: Math.max(5, v) })} />
            <CampoNumero rotulo="Pausa (min) · Pomodoro" valor={timer.pausaMin} onChange={(v) => timer.definir({ pausaMin: Math.max(1, v) })} />
          </div>
          <div className="mt-3">
            <Alternador ativo={timer.somAoFim} onChange={(v) => timer.definir({ somAoFim: v })} rotulo="Sinal suave ao fim de cada fase" descricao="Duas notas curtas e baixas, sem alarme." />
          </div>
          <p className="mt-3 text-[12.5px] text-ink-2">No Flowtime não há contagem regressiva: ao encerrar o foco, a pausa sugerida é 1/5 do tempo focado (entre 3 e 30 min).</p>
        </Painel>

        <Painel titulo="Dados de exemplo e limpeza" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Botao
              onClick={async () => {
                await limparExemplos();
                setAviso("Exemplos removidos: notas Cornell de exemplo, os flashcards delas, backlog e brain dump de exemplo.");
              }}
            >
              Limpar exemplos
            </Botao>
            <Botao variante="perigo" onClick={() => setApagarTudo(true)}>
              Apagar todos os dados deste navegador
            </Botao>
          </div>
        </Painel>
      </div>
      <Dialogo
        aberto={apagarTudo}
        onFechar={() => setApagarTudo(false)}
        titulo="Apagar todos os dados?"
        largura="sm"
        rodape={
          <>
            <Botao variante="fantasma" onClick={() => setApagarTudo(false)}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              onClick={async () => {
                await db.delete();
                window.location.assign("/");
              }}
            >
              Apagar e recomeçar
            </Botao>
          </>
        }
      >
        <p className="text-[13px] text-ink-2">Tentativas, baterias, revisões, notas, flashcards e discursivas serão apagados. Exporte um backup antes se quiser guardar.</p>
      </Dialogo>
    </>
  );
}

function Campo({ rotulo, ajuda, children }: { rotulo: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 flex flex-col gap-1">
      <span className="text-[12.5px] text-ink">{rotulo}</span>
      {children}
      {ajuda && <span className="text-[12px] text-ink-2">{ajuda}</span>}
    </label>
  );
}

function CampoNumero({ rotulo, valor, onChange }: { rotulo: string; valor: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] text-ink-2">{rotulo}</span>
      <input type="number" step={0.5} value={valor} onChange={(e) => onChange(Number(e.target.value))} className="field tabular h-8 py-0" />
    </label>
  );
}
