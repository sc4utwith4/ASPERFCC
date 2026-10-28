# Decisões de projeto (e onde o spec original foi corrigido)

O spec veio de dois prompts gerados no Gemini mais instruções complementares. Onde ele divergia do edital ou tinha um ponto fraco, a decisão está registrada aqui.

| # | Spec original | Decisão | Por quê |
|---|---|---|---|
| 1 | Subtópicos listados no prompt (GRASP, MVC, modelagem dimensional, Terraform…) | Taxonomia = **Anexo II retificado**, item a item (`src/data/edital.ts`) | O prompt omitia itens cobrados (PMBOK 8ª ed., ISO/IEC 38500:2024, ENGD 2024–2027, Lei 14.129, OWASP Top 10:2025, HTTP/3, MCP, Claude Code/Antigravity CLI) e incluía itens fora do edital. |
| 2 | "Peso 1 / Peso 2" como multiplicador de pontos | Debrief mostra pontos brutos ponderados **e** NP estimada (média/σ do grupo configuráveis) | A FCC usa escore padronizado (Cap. 9). Um acerto vale `10·peso/σ`; σ cresce com o nº de questões, então uma específica tende a valer ~1,1–1,5× uma geral, e não 2×. |
| 3 | "Percentual líquido de acerto" | Líquido = acertos **sólidos** ÷ total | "Líquido" é conceito Cebraspe (erro anula acerto). A FCC não desconta erro. O útil aqui é descontar o acerto por sorte. |
| 4 | Pacote de revisão com escada fixa +1/+3/+7/+15/+30 | Escada mantida no calendário do pacote, com itens adaptativos | Escada fixa repete o que já foi dominado e não acelera o que continua errado. Itens graduam após 2 acertos sólidos seguidos; reincidência ≥ 2 vira "Erro Crítico"; etapa atrasada reancora na data real; etapa depois da prova é comprimida para D-3. |
| 5 | ACERTO_FRAGIL para acerto com dúvida/chute | Mantido + **ERRO_CONVICTO** (errou com confiança 1) | Erro com certeza é equívoco conceitual: o mais caro e o mais urgente. |
| 6 | Subtópicos Dominados (>85%) × Críticos (<70%) | Classificação só com n ≥ 3 acumulado | Com 50 questões por matéria e blocos de 10, um subtópico pode ter 1 questão no dia. 0% ou 100% com n = 1 é ruído. |
| 7 | "Gerar Nova Bateria de 50 Questões" | "Nova Bateria de **Variantes**" (mesmo pool, novo seed, enunciados rotacionados, Modo Mutação, ordem por menor domínio). Questões novas entram por lote JSON ou pelo CLI gerador | Sem conteúdo novo não existe questão nova. A UI não promete o que não entrega. |
| 8 | SRS sem relação com a data da prova | Radar calcula o ritmo: fechar o 1º ciclo até **18/12/2026** para a etapa +30 caber antes de 17/01/2027 | São 81 dias entre o início do projeto e a prova. |
| 9 | Questões "Inéditas / Adaptadas FCC Recente" | Todas **inéditas padrão FCC** | Cadernos FCC trazem "Direitos Reservados". Provas anteriores serviram só para calibrar estilo. |
| 10 | Banco gerado por IA tratado como verdade | `fundamentacao` obrigatória, validador, botão "Reportar erro" e selo "conferir no texto oficial" | IA erra. Normativos do TCE-GO não puderam ser lidos na íntegra neste ambiente (ver `pesquisa/_normativos-tce-go.md`). |
| 11 | `/src/data/questions/<slug>.json` (um arquivo com 50) | `src/data/questions/<slug>/lote-NN.json` (10 por lote), via `import.meta.glob` | Evita truncamento na escrita, permite lotes futuros e faz code-split por matéria. |
| 12 | Binaural 40 Hz como recurso de foco | Implementado, rotulado "evidência limitada" | A literatura sobre batimentos binaurais e atenção é inconclusiva. Ruído marrom para mascarar distração tem base melhor. |
| 13 | Espelho discursivo 70/30 | 70 (3 pilares de conteúdo) + 30 (coesão e norma-padrão), com autoavaliação guiada | O edital não fixa 70/30 para o estudo de caso (só para a Redação do A01) e define o limite de linhas na questão. A divisão é convenção de treino. Não há correção automática por IA no app: palavras-chave são sugestão, e quem confirma é o estudante. |
| 14 | Flashcards com Difícil/Bom/Fácil | SM-2 simplificado: **Difícil = reaprender** (volta para 1 dia) | Sem um botão "Errei", um card esquecido marcado como "Difícil" ganharia intervalo maior. |
| 15 | — | **Extra:** Simulado Prova Real (70 questões na distribuição do edital + estudo de caso, 4h30, NP estimada) | Treina exatamente o formato do dia da prova com o motor já existente. |
