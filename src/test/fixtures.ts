import type { MateriaSlug } from "@/data/edital";
import { getMateria } from "@/data/edital";
import type { Questao } from "@/data/schema";

export function questaoFake(n: number, materiaSlug: MateriaSlug = "banco-de-dados", extra: Partial<Questao> = {}): Questao {
  const materia = getMateria(materiaSlug);
  const corretaIdx = n % 5;
  return {
    id: `${materia.prefixoId}-${String(n).padStart(3, "0")}`,
    materiaSlug,
    subtopico: materia.subtopicos[n % materia.subtopicos.length]!,
    origem: "Inédita padrão FCC",
    nivel: "Intermediário",
    formato: "direta",
    enunciadoBase: `Enunciado base número ${n} sobre um assunto qualquer de teste automatizado.`,
    variantesEnunciado: [
      `Primeira variante do enunciado ${n}, com outro contexto de teste automatizado.`,
      `Segunda variante do enunciado ${n}, com mais um contexto de teste automatizado.`,
    ],
    alternativas: [0, 1, 2, 3, 4].map((i) => ({
      id: `opt-${i + 1}` as Questao["alternativas"][number]["id"],
      texto: `Alternativa ${i + 1} da questão ${n}`,
      correta: i === corretaIdx,
      explicacaoDetalhada: `${i === corretaIdx ? "CORRETA" : "INCORRETA"}. Explicação detalhada da alternativa ${i + 1}, longa o bastante para o schema.`,
      ...(i === corretaIdx ? { versaoInvertidaFalsa: `Versão invertida e falsa da alternativa correta ${n}.` } : {}),
    })),
    pegadinhaFCC: `Pegadinha da questão ${n}: troca sutil de conceito vizinho.`,
    resumoFlashcard: { pergunta: `Pergunta do flashcard ${n}?`, resposta: `Resposta do flashcard ${n}, autossuficiente.` },
    conceitosChave: [`Conceito ${n % 3}`],
    fundamentacao: "Fonte de teste",
    ...extra,
  };
}
