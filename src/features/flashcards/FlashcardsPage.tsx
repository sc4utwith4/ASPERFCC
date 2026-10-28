import { useState } from "react";
import { useSearchParams } from "react-router";
import { useLiveQuery } from "dexie-react-hooks";
import { getMateria, isMateriaSlug, MATERIAS, type MateriaSlug } from "@/data/edital";
import { db, type Flashcard } from "@/db/db";
import { avaliarFlashcard } from "@/db/servicos";
import { formatarDiaCurto, hoje, somarDias } from "@/engine/datas";
import { proximosIntervalos, type Avaliacao } from "@/engine/flashcardSrs";
import { Botao, Metrica, Painel, TituloPagina, Vazio } from "@/components/ui";
import { SessaoFlashcards } from "./SessaoFlashcards";

export default function FlashcardsPage() {
  const [params, setParams] = useSearchParams();
  const filtro = params.get("materia");
  const materia: MateriaSlug | "todas" = filtro && isMateriaSlug(filtro) ? filtro : "todas";
  const dia = hoje();
  const todos = useLiveQuery(() => db.flashcards.toArray(), []);
  const [sessao, setSessao] = useState<Flashcard[] | null>(null);
  const [fim, setFim] = useState<Record<Avaliacao, number>>();

  if (!todos) return null;
  const doFiltro = todos.filter((c) => materia === "todas" || c.materiaSlug === materia);
  const vencidos = doFiltro.filter((c) => c.estado.vencimento <= dia).sort((a, b) => a.estado.vencimento.localeCompare(b.estado.vencimento));
  const semana = doFiltro.filter((c) => c.estado.vencimento > dia && c.estado.vencimento <= somarDias(dia, 7)).length;
  const porId = new Map(todos.map((c) => [c.id, c]));

  if (sessao) {
    return (
      <>
        <TituloPagina titulo="Flashcards" subtitulo={`${sessao.length} cartões nesta sessão`} acoes={<Botao variante="fantasma" onClick={() => setSessao(null)}>Encerrar</Botao>} />
        <SessaoFlashcards
          cartoes={sessao.map((c) => ({ id: c.id, frente: c.frente, verso: c.verso, contexto: `${getMateria(c.materiaSlug).nomeCurto} · ${c.origem === "questao" ? `questão ${c.refId}` : "nota Cornell"}` }))}
          intervalos={(id) => {
            const c = porId.get(id);
            return c ? proximosIntervalos(c.estado, dia) : undefined;
          }}
          onAvaliar={(id, a) => avaliarFlashcard(id, a)}
          onFim={(c) => {
            setFim(c);
            setSessao(null);
          }}
        />
      </>
    );
  }

  return (
    <>
      <TituloPagina
        titulo="Flashcards"
        subtitulo="Active recall com repetição espaçada. Cartões vêm das pistas das notas Cornell e do resumo das questões erradas ou frágeis."
        acoes={
          <>
            <label htmlFor="materia-cards" className="sr-only">
              Matéria
            </label>
            <select id="materia-cards" value={materia} onChange={(e) => setParams(e.target.value === "todas" ? {} : { materia: e.target.value })} className="h-8 rounded-lg border border-line-field bg-elevated px-2 text-[12.5px]">
              <option value="todas">Todas as matérias</option>
              {MATERIAS.map((m) => (
                <option key={m.slug} value={m.slug}>
                  {m.nomeCurto}
                </option>
              ))}
            </select>
          </>
        }
      />
      {fim && (
        <p className="mb-4 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink-2" role="status">
          Sessão concluída: {fim.facil} fáceis, {fim.bom} bons, {fim.dificil} difíceis (voltam amanhã).
        </p>
      )}
      {doFiltro.length === 0 ? (
        <Vazio titulo="Nenhum flashcard ainda">Cartões nascem quando você consolida um dia (questões erradas e frágeis) e quando escreve pistas nas notas Cornell.</Vazio>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Painel titulo="Para hoje" className="lg:col-span-2">
            <div className="grid grid-cols-3 gap-4">
              <Metrica rotulo="Vencidos" valor={vencidos.length} />
              <Metrica rotulo="Próximos 7 dias" valor={semana} />
              <Metrica rotulo="Total" valor={doFiltro.length} />
            </div>
            <Botao variante="primario" className="mt-4" disabled={vencidos.length === 0} onClick={() => setSessao(vencidos.slice(0, 40))}>
              {vencidos.length ? `Revisar ${Math.min(40, vencidos.length)} cartões` : "Nada vencido hoje"}
            </Botao>
          </Painel>
          <Painel titulo="Por matéria">
            <ul className="flex flex-col gap-1">
              {MATERIAS.map((m) => {
                const total = todos.filter((c) => c.materiaSlug === m.slug);
                if (!total.length) return null;
                return (
                  <li key={m.slug} className="flex justify-between text-[12.5px]">
                    <span className="text-ink">{m.nomeCurto}</span>
                    <span className="tabular text-ink-2">
                      {total.filter((c) => c.estado.vencimento <= dia).length}/{total.length}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Painel>
          <Painel titulo="Próximos vencimentos" className="lg:col-span-3">
            <ul className="flex flex-col divide-y divide-line">
              {doFiltro
                .filter((c) => c.estado.vencimento > dia)
                .sort((a, b) => a.estado.vencimento.localeCompare(b.estado.vencimento))
                .slice(0, 8)
                .map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-3 py-1.5 text-[12.5px]">
                    <span className="min-w-0 truncate text-ink">{c.frente}</span>
                    <span className="tabular shrink-0 text-ink-2">{formatarDiaCurto(c.estado.vencimento)}</span>
                  </li>
                ))}
            </ul>
          </Painel>
        </div>
      )}
    </>
  );
}
