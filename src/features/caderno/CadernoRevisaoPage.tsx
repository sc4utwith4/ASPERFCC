import { useEffect, useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown, ChevronRight, Dumbbell, X } from "lucide-react";
import { getMateria, MATERIAS, type MateriaSlug } from "@/data/edital";
import { db, type QuestaoRegistro, type Tentativa } from "@/db/db";
import { exposicoesAnteriores, mapaDeQuestoes, registrarTentativa, ultimaLetraCorreta } from "@/db/servicos";
import type { AlternativaId, Nivel } from "@/data/schema";
import { letraDaCorreta, permutarAlternativas, type Letra } from "@/engine/alternativas";
import { prioridadeRevisao, ROTULO_RESULTADO, type Resultado } from "@/engine/classificacao";
import { formatarDiaCurto, hoje, somarDias } from "@/engine/datas";
import { escolherSubModo, type SubModoMutacao } from "@/engine/mutacao";
import { novoId } from "@/engine/rng";
import type { EstadoItem } from "@/engine/srs";
import { escolherEnunciado, textoDoEnunciado } from "@/engine/variantes";
import { Alternador, Botao, Painel, Selo, TituloPagina, Vazio } from "@/components/ui";
import { Resolvedor, type RespostaRegistrada } from "@/features/questao/Resolvedor";
import { SeloFonteOficial } from "@/features/questao/QuestaoView";

type Tipo = "todos" | "ERRO_CONVICTO" | "ERRO" | "ACERTO_FRAGIL";
type Periodo = "7" | "30" | "todos";
const TOM = { ACERTO_SOLIDO: "salvia", ACERTO_FRAGIL: "ambar", ERRO: "terracota", ERRO_CONVICTO: "terracota" } as const;

interface Linha {
  questao: QuestaoRegistro;
  ultima: Tentativa;
  tentativas: number;
  estado?: EstadoItem;
}

export default function CadernoRevisaoPage() {
  const [materia, setMateria] = useState<MateriaSlug | "todas">("todas");
  const [subtopico, setSubtopico] = useState("todos");
  const [tipo, setTipo] = useState<Tipo>("todos");
  const [periodo, setPeriodo] = useState<Periodo>("todos");
  const [nivel, setNivel] = useState<Nivel | "todos">("todos");
  const [incluirGraduados, setIncluirGraduados] = useState(false);
  const [treino, setTreino] = useState<string[] | null>(null);

  const dados = useLiveQuery(async () => {
    const tentativas = await db.tentativas.orderBy("respondidaEm").toArray();
    const ultima = new Map<string, Tentativa>();
    const contagem = new Map<string, number>();
    const comFalha = new Set<string>();
    for (const t of tentativas) {
      ultima.set(t.questaoId, t);
      contagem.set(t.questaoId, (contagem.get(t.questaoId) ?? 0) + 1);
      if (t.resultado !== "ACERTO_SOLIDO") comFalha.add(t.questaoId);
    }
    const estados = new Map<string, EstadoItem>();
    for (const p of await db.pacotes.toArray()) for (const i of p.itens) estados.set(i.questaoId, i.estado === "critico" || estados.get(i.questaoId) === "critico" ? "critico" : i.estado);
    // Entra no caderno toda questão cuja pior resposta não foi um acerto sólido, ou que está em um pacote.
    const candidatos = [...ultima.keys()].filter((id) => comFalha.has(id) || estados.has(id));
    const questoes = await mapaDeQuestoes(candidatos);
    const linhas: Linha[] = candidatos.flatMap((id) => {
      const q = questoes.get(id);
      const u = ultima.get(id);
      return q && u ? [{ questao: q, ultima: u, tentativas: contagem.get(id) ?? 0, estado: estados.get(id) }] : [];
    });
    return linhas;
  }, []);

  const subtopicos = materia === "todas" ? [] : getMateria(materia).subtopicos;
  useEffect(() => setSubtopico("todos"), [materia]);

  const filtradas = useMemo(() => {
    if (!dados) return [];
    const limite = periodo === "todos" ? "" : somarDias(hoje(), -Number(periodo));
    return dados
      .filter((l) => materia === "todas" || l.questao.materiaSlug === materia)
      .filter((l) => subtopico === "todos" || l.questao.subtopico === subtopico)
      .filter((l) => tipo === "todos" || l.ultima.resultado === tipo)
      .filter((l) => !limite || l.ultima.dia >= limite)
      .filter((l) => nivel === "todos" || l.questao.nivel === nivel)
      .filter((l) => incluirGraduados || l.estado !== "graduado")
      .filter((l) => incluirGraduados || l.ultima.resultado !== "ACERTO_SOLIDO" || l.estado === "critico" || l.estado === "ativo")
      .sort((a, b) => (b.estado === "critico" ? 1 : 0) - (a.estado === "critico" ? 1 : 0) || prioridadeRevisao(b.ultima.resultado) - prioridadeRevisao(a.ultima.resultado) || b.ultima.respondidaEm - a.ultima.respondidaEm);
  }, [dados, materia, subtopico, tipo, periodo, nivel, incluirGraduados]);

  if (treino) return <Treino ids={treino} onSair={() => setTreino(null)} />;

  return (
    <>
      <TituloPagina
        titulo="Caderno de Revisão"
        subtitulo="Erros, erros convictos e acertos frágeis (dúvida ou chute). Tudo que não foi certeza consciente fica aqui."
        acoes={
          <Botao variante="primario" icone={<Dumbbell size={14} strokeWidth={1.7} />} disabled={filtradas.length === 0} onClick={() => setTreino(filtradas.slice(0, 30).map((l) => l.questao.id))}>
            Treinar {Math.min(30, filtradas.length)} filtradas
          </Botao>
        }
      />
      <div className="mb-4 flex flex-wrap items-end gap-3" role="group" aria-label="Filtros">
        <Filtro rotulo="Matéria" valor={materia} onChange={(v) => setMateria(v as MateriaSlug | "todas")} opcoes={[["todas", "Todas"], ...MATERIAS.map((m) => [m.slug, m.nomeCurto] as [string, string])]} />
        <Filtro rotulo="Subtópico" valor={subtopico} onChange={setSubtopico} opcoes={[["todos", materia === "todas" ? "Escolha a matéria" : "Todos"], ...subtopicos.map((s) => [s, s] as [string, string])]} desabilitado={materia === "todas"} />
        <Filtro rotulo="Tipo" valor={tipo} onChange={(v) => setTipo(v as Tipo)} opcoes={[["todos", "Todos"], ["ERRO_CONVICTO", "Erro convicto"], ["ERRO", "Erro"], ["ACERTO_FRAGIL", "Acerto frágil"]]} />
        <Filtro rotulo="Período" valor={periodo} onChange={(v) => setPeriodo(v as Periodo)} opcoes={[["7", "Últimos 7 dias"], ["30", "Últimos 30 dias"], ["todos", "Tudo"]]} />
        <Filtro rotulo="Nível" valor={nivel} onChange={(v) => setNivel(v as Nivel | "todos")} opcoes={[["todos", "Todos"], ["Básico", "Básico"], ["Intermediário", "Intermediário"], ["Avançado", "Avançado"]]} />
        <div className="pb-1.5">
          <Alternador ativo={incluirGraduados} onChange={setIncluirGraduados} rotulo="Incluir graduados" />
        </div>
      </div>
      {!dados ? null : filtradas.length === 0 ? (
        <Vazio titulo={dados.length === 0 ? "O caderno está vazio" : "Nada com estes filtros"}>
          {dados.length === 0 ? "Quando você errar ou acertar com dúvida, a questão aparece aqui automaticamente." : "Ajuste os filtros acima."}
        </Vazio>
      ) : (
        <Painel titulo={`${filtradas.length} questões`}>
          <ul className="flex flex-col divide-y divide-line">
            {filtradas.map((l) => (
              <ItemCaderno key={l.questao.id} linha={l} />
            ))}
          </ul>
        </Painel>
      )}
    </>
  );
}

function Filtro({ rotulo, valor, onChange, opcoes, desabilitado }: { rotulo: string; valor: string; onChange: (v: string) => void; opcoes: [string, string][]; desabilitado?: boolean }) {
  const id = `filtro-${rotulo}`;
  return (
    <div className="flex min-w-[140px] flex-col gap-1">
      <label htmlFor={id} className="text-[12px] text-ink-2">
        {rotulo}
      </label>
      <select id={id} value={valor} onChange={(e) => onChange(e.target.value)} disabled={desabilitado} className="h-8 max-w-[240px] rounded-lg border border-line-control bg-elevated px-2 text-[12.5px] text-ink disabled:opacity-50">
        {opcoes.map(([v, r]) => (
          <option key={v} value={v}>
            {r}
          </option>
        ))}
      </select>
    </div>
  );
}

function ItemCaderno({ linha }: { linha: Linha }) {
  const [aberto, setAberto] = useState(false);
  const { questao, ultima } = linha;
  const correta = questao.alternativas.find((a) => a.correta)!;
  return (
    <li className="py-2.5">
      <button type="button" onClick={() => setAberto((a) => !a)} className="flex w-full flex-wrap items-center gap-2 text-left" aria-expanded={aberto}>
        {aberto ? <ChevronDown size={14} className="text-ink-3" /> : <ChevronRight size={14} className="text-ink-3" />}
        <span className="min-w-0 flex-1 text-[13px] text-ink">
          {getMateria(questao.materiaSlug).nomeCurto} · {questao.subtopico} <span className="tabular text-ink-2">· {questao.id}</span>
        </span>
        <span className="flex flex-wrap items-center gap-1.5">
          {linha.estado === "critico" && <Selo tom="terracota">crítico</Selo>}
          {linha.estado === "graduado" && <Selo tom="salvia">graduado</Selo>}
          <Selo tom={TOM[ultima.resultado]}>{ROTULO_RESULTADO[ultima.resultado]}</Selo>
          <span className="tabular text-[12px] text-ink-2">
            {linha.tentativas}× · {formatarDiaCurto(ultima.dia)}
          </span>
        </span>
      </button>
      {aberto && (
        <div className="mt-2 ml-6 flex flex-col gap-2 pb-1">
          <p className="font-serif text-[15px] leading-[1.6] text-ink">{textoDoEnunciado(questao, -1)}</p>
          <p className="text-[13px] text-ink-2">
            <span className="text-accent-text">Correta:</span> {correta.texto} — {correta.explicacaoDetalhada}
          </p>
          <p className="text-[13px] text-ink-2">
            <span className="text-warning-text">Pegadinha:</span> {questao.pegadinhaFCC}
          </p>
          <p className="text-[13px] text-ink-2">
            <span className="text-accent-2-text">Flashcard:</span> {questao.resumoFlashcard.pergunta} → {questao.resumoFlashcard.resposta}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-ink-2">
            <span>{questao.fundamentacao}</span>
            <SeloFonteOficial questao={questao} />
          </div>
        </div>
      )}
    </li>
  );
}

function Treino({ ids, onSair }: { ids: string[]; onSair: () => void }) {
  const [sessaoId] = useState(() => novoId("sessao"));
  const [mutacao, setMutacao] = useState(false);
  const [iniciado, setIniciado] = useState(false);
  const [indice, setIndice] = useState(0);
  const [preparo, setPreparo] = useState<{ questao: QuestaoRegistro; ordem: AlternativaId[]; varianteIdx: number; letraCorreta: Letra; modo: "padrao" | SubModoMutacao }>();
  const [placar, setPlacar] = useState<Resultado[]>([]);
  const id = ids[indice];

  useEffect(() => {
    if (!iniciado || !id) return;
    let ativo = true;
    setPreparo(undefined);
    void (async () => {
      const [q, exp, ultima] = await Promise.all([db.questoes.get(id), exposicoesAnteriores(id), ultimaLetraCorreta(id)]);
      if (!q || !ativo) return;
      const ordem = permutarAlternativas(q, sessaoId, ultima);
      setPreparo({ questao: q, ordem, varianteIdx: escolherEnunciado(q, Math.max(1, exp)).varianteIdx, letraCorreta: letraDaCorreta(q, ordem), modo: mutacao ? escolherSubModo(q, sessaoId) : "padrao" });
    })();
    return () => {
      ativo = false;
    };
  }, [iniciado, id, sessaoId, mutacao]);

  async function registrar(r: RespostaRegistrada) {
    if (!preparo) return;
    await registrarTentativa({
      questaoId: preparo.questao.id,
      materiaSlug: preparo.questao.materiaSlug,
      contexto: "revisao",
      modo: preparo.modo,
      sessaoId,
      varianteIdx: preparo.varianteIdx,
      ordem: preparo.ordem,
      letraCorreta: preparo.letraCorreta,
      escolhidaId: r.escolhidaId,
      riscadas: r.riscadas,
      confianca: r.confianca,
      acertou: r.acertou,
      resultado: r.resultado,
      tempoMs: r.tempoMs,
      dia: hoje(),
      respondidaEm: Date.now(),
      justificativa: r.justificativa,
    });
    setPlacar((p) => [...p, r.resultado]);
  }

  if (!iniciado) {
    return (
      <div className="mx-auto max-w-[560px]">
        <Painel titulo={`Treino livre · ${ids.length} questões`} descricao="Não altera os pacotes agendados; registra as tentativas para o histórico e o Radar.">
          <Alternador ativo={mutacao} onChange={setMutacao} rotulo="Modo Mutação" descricao="Caça ao erro, versão invertida ou justificativa em cada questão." />
          <div className="mt-4 flex gap-2">
            <Botao variante="primario" onClick={() => setIniciado(true)}>
              Começar
            </Botao>
            <Botao variante="fantasma" onClick={onSair}>
              Voltar ao caderno
            </Botao>
          </div>
        </Painel>
      </div>
    );
  }
  if (!id) {
    const solidos = placar.filter((r) => r === "ACERTO_SOLIDO").length;
    return (
      <div className="mx-auto max-w-[560px]">
        <Painel titulo="Treino concluído">
          <p className="text-[13px] text-ink">
            {solidos} de {placar.length} com acerto sólido.
          </p>
          <Botao className="mt-3" variante="primario" onClick={onSair}>
            Voltar ao caderno
          </Botao>
        </Painel>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-[760px]">
      <div className="mb-4 flex items-center justify-between">
        <span className="tabular text-[12.5px] text-ink-2">
          Treino livre · {indice + 1} de {ids.length}
        </span>
        <Botao variante="fantasma" tamanho="sm" icone={<X size={13} strokeWidth={1.8} />} onClick={onSair}>
          Sair
        </Botao>
      </div>
      {preparo ? (
        <Resolvedor key={preparo.questao.id} questao={preparo.questao} ordem={preparo.ordem} varianteIdx={preparo.varianteIdx} letraCorreta={preparo.letraCorreta} modo={preparo.modo} seed={sessaoId} onRegistrar={registrar} onProxima={() => setIndice((i) => i + 1)} />
      ) : (
        <p className="text-[13px] text-ink-2" role="status">
          Carregando questão…
        </p>
      )}
    </div>
  );
}
