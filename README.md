# Caderno FCC · TCE-GO 2026 (Técnico de Controle Externo, TI)

Workspace de estudo **local-first** para a prova da FCC de 17/01/2027 (cargo B02). Reúne banco de questões inéditas no padrão da banca, motor anti-decoreba, revisão espaçada, laboratório de estudo de caso e radar do edital. Tudo roda no navegador, e os dados ficam no IndexedDB do seu computador, com backup em JSON.

> Fonte da verdade do conteúdo: Edital nº 01/2026 + Retificação nº 02/2026 (resumo em [`docs/pesquisa/_edital.md`](docs/pesquisa/_edital.md)). As críticas ao briefing e as decisões de projeto estão em [`docs/decisoes.md`](docs/decisoes.md).

## Rodar

Requer Node 22+.

```bash
npm install
```

```bash
npm run dev
```

Abre em http://localhost:5173. No primeiro acesso, o app semeia o banco local, com barra de progresso.

```bash
npm run build && npm run preview
```

Esse é o build de produção, servido em http://localhost:4173.

### Deploy (Vercel)

O app é estático: a Vercel roda `npm run build` e publica `dist/`. O [`vercel.json`](vercel.json) redireciona qualquer rota para o `index.html`, para que recarregar `/materias` não dê 404, e faz cache longo dos arquivos de `/assets/`. Não há backend, e a chave da API nunca entra no deploy.

- **O progresso fica no navegador, separado por domínio.** Use sempre o domínio de produção. Cada URL de preview é outra origem e começa com o banco vazio.
- **Para trocar de aparelho**, use Exportar e Importar JSON na tela **Banco e backup**.
- **Limpar os dados do navegador apaga o progresso.** Faça um backup em JSON toda semana.

## O que tem

| Tela | Para quê |
|---|---|
| **Hoje** | Revisões vencidas, bateria em andamento, ritmo necessário até a prova, flashcards do dia e sugestão por peso real na prova. |
| **Matérias / Resolver** | Blocos de 10, 15, 25 ou 50 questões, ou Maratona. Salva a cada resposta e retoma de onde parou. Mostra "Resolvidas X/50 · Sólidos · Frágeis · Erros". |
| **Daily Debrief** | Diagnóstico FCC com pesos, subtópicos dominados (> 85%) e críticos (< 70%, com n ≥ 3), dossiê de pegadinhas, Resumo de Ouro editável e Cornell de 3 linhas. O botão **Consolidar dia** gera o pacote de revisão (+1/+3/+7/+15/+30). |
| **Revisão** | Três modos por etapa: erros e frágeis (com embaralhamento, enunciado rotacionado e Modo Mutação), flashcards rápidos e simulado cronometrado da bateria. |
| **Caderno de Revisão** | Erros, erros convictos e acertos frágeis, com filtros por matéria, subtópico, tipo, status, período e nível. |
| **Notas Cornell** | Editor com pistas, conteúdo e síntese. Barra de ferramentas discreta com marca-texto sálvia, ocre e ardósia, citação e checklist. As pistas viram flashcards. |
| **Lab. Discursivo** | Estudos de caso inéditos com folha pautada, contador de linhas no padrão FCC (o excedente é marcado como desconsiderado), cronômetro e espelho interativo: 70 pontos em 3 pilares mais 30 de língua. |
| **Radar do Edital** | Matriz das 14 matérias mais a Discursiva (conclusão, baterias, retenção, críticos), "Nova bateria" de variantes e gráficos de evolução diária e minutos de foco. |
| **Simulado** | Prova real: 70 questões na distribuição do edital, 4h30, nota padronizada estimada. |
| **Banco e backup** | Lotes embutidos e importados (com validação), exportação e importação do progresso, erros reportados. |

O painel lateral reúne o micro-backlog (3 a 5 prioridades com subtarefas), o Brain Dump (Enter captura sem sair da tela) e o ruído ambiente procedural (marrom, chuva e binaural 40 Hz).

## Atalhos

| Tecla | Ação |
|---|---|
| `A`–`E` | marcar alternativa |
| `Shift` + `A`–`E` (ou botão direito, ou toque longo) | riscar ou desriscar |
| `1` · `2` · `3` | confiança: certeza · dúvida entre 2 · chute |
| `Enter` | confirmar / próxima |
| `R` | rascunho |
| `Espaço` · `1`–`3` | virar o flashcard · Difícil, Bom ou Fácil |
| `Alt+Z` ou `⌘+.` | Modo Zen |
| `Ctrl/⌘+K` | paleta de comandos |
| `g` + letra | ir para: `h` Hoje · `m` Matérias · `r` Revisão · `c` Caderno · `n` Notas · `f` Flashcards · `d` Discursiva · `e` Radar · `s` Simulado · `b` Banco · `o` Config |
| `?` | ajuda |

Os atalhos ficam desligados enquanto você digita.

## Motor anti-decoreba (resumo)

- **Embaralhamento por sessão**: semente = hash(sessão + questão). A letra correta não repete a da última exposição.
- **Rotação de enunciado**: a 1ª exposição usa o enunciado base, e as revisões alternam `variantesEnunciado`.
- **Modo Mutação**: caça ao erro, versão invertida (original × `versaoInvertidaFalsa`) ou justificativa escrita.
- **Confiança 1/2/3**: acertar com 2 ou 3 é **acerto frágil** e vai para o Caderno de Revisão. Errar com 1 é **erro convicto**, de prioridade máxima.
- **SRS híbrido**:
  - escada fixa por pacote (+1/+3/+7/+15/+30);
  - itens que graduam após 2 acertos sólidos seguidos;
  - reancoragem quando a etapa atrasa;
  - compressão para D-3 quando a escada não cabe antes da prova.
- **Nota da FCC**: escore padronizado por prova (`NP = 50 + 10·(A − média)/σ`), com média e σ do grupo editáveis em Configurações. Um acerto em Específicos vale cerca de 1,1–1,5× um de Gerais, e não 2×. O motivo está em `docs/decisoes.md`.

## Banco de questões

**Estado atual:**
- 700 questões inéditas: 14 matérias × 50, todas com `bank:validate` sem erros nem avisos;
- 12 estudos de caso com espelho;
- 14 notas Cornell de exemplo, que geram flashcards;
- 20 textos-base originais: 10 em português e 10 em inglês técnico;
- 1 questão com o selo "conferir no texto oficial" (leg-inst-040). Eram 26: as outras 25 foram conferidas em 29/10/2026 (ver [`docs/pesquisa/_normativos-tce-go.md`](docs/pesquisa/_normativos-tce-go.md)).

- Arquivos: `src/data/questions/<materia>/lote-NN.json`, com 10 questões por lote, ids `prefixo-001…` e faixa fixa por lote.
- Textos de apoio de Português e Inglês: `src/data/textos/<materia>.json`.
- Estudos de caso: `src/data/casos/caso-NN.json`.
- Notas de exemplo: `src/data/notas-exemplo/`.
- Schema único (Zod) em [`src/data/schema.ts`](src/data/schema.ts). Campos principais: `variantesEnunciado`, `explicacaoDetalhada` por alternativa, `versaoInvertidaFalsa`, `pegadinhaFCC`, `resumoFlashcard`, `fundamentacao` e o selo `revisarFonteOficial`.
- Guia de autoria (regras FCC, formatos, checklist): [`docs/autoria.md`](docs/autoria.md).

```bash
npm run bank:validate                        # banco inteiro: ≥ 50 por matéria, cobertura, duplicatas, vieses
npm run bank:validate -- --materia banco-de-dados --parcial
npm run bank:stats -- --materia banco-de-dados
npm run bank:new-lote -- banco-de-dados      # esqueleto do próximo lote
```

O validador reprova:
- id fora da faixa e subtópico fora do edital;
- alternativa posicional ("todas as anteriores", "letra A");
- explicação que não começa com CORRETA ou INCORRETA;
- correta sem versão invertida;
- gabarito de assertivas que não bate com as afirmativas verdadeiras;
- enunciados quase idênticos;
- viés de tamanho (a correta como a mais longa em mais de 45% das questões, sem contar as de assertivas).

Ele avisa sobre o viés inverso (a correta quase nunca é a mais longa) e sobre a distribuição de nível fora do alvo.

Também dá para importar um lote pela tela **Banco e backup**, com o mesmo relatório de validação.

> **Selo "conferir no texto oficial"**: o GNOI do TCE-GO não pôde ser lido neste ambiente. Fatos sobre normativos do Tribunal vieram de fontes secundárias e, quando não foram confirmados, a questão leva o selo e não depende do detalhe duvidoso para ter gabarito. As fichas em `docs/pesquisa/` listam fontes e pontos de cautela. Use **Reportar erro** em qualquer questão: os reportes ficam salvos e são exportáveis.

## Gerador de lotes (Claude API)

Expande o banco com novos lotes que só entram se passarem no validador.

```bash
export ANTHROPIC_API_KEY=...                 # ou use um perfil do `ant auth login`
```

```bash
npm run gerar -- --materia banco-de-dados --dry-run    # planeja e grava o prompt, sem custo
```

```bash
npm run gerar -- --materia banco-de-dados --lotes 2    # interativo (streaming)
```

```bash
npm run gerar -- --materia todas --batch               # 1 lote por matéria, Batches API (50% mais barato)
```

```bash
npm run gerar -- --retomar-batch msgbatch_...          # processa um batch criado antes
```

- **Modelo e chamada**: `claude-opus-5-5`, com saída estruturada (schema da matéria, subtópicos como enum), esforço `high` e cache de 1 h no prompt de sistema (guia, exemplo, ficha de pesquisa).
- **Fallback**: `fallbacks: "default"` vem **ligado**. Se o classificador de segurança recusar um tema (ex.: ransomware), a API refaz o pedido no modelo recomendado. Desligue com `--sem-fallback`. O modo batch não aceita fallback, e as recusas são refeitas no modo interativo.
- **Pipeline**: plano do lote (próximo número, subtópicos menos cobertos, enunciados já existentes), validação completa e até 2 rodadas de reparo com os problemas devolvidos ao modelo.
  - Lote aprovado: vai para `lote-NN.json` com `procedencia: "gerador-ia"`.
  - Lote reprovado: vai para `rascunhos/`, com relatório.
- **Custo**: o custo estimado de cada lote aparece no fim, pela tabela do Opus 5.5 (US$ 4 / 20 por milhão de tokens, cache de 1 h a US$ 8, leitura de cache a US$ 0,20). Ordem de grandeza: US$ 0,50–1,10 por tentativa de 10 questões; o batch custa metade.
- A chave nunca vai para o navegador: o gerador é um script Node.

## Qualidade

```bash
npm run typecheck && npm run lint && npm test   # unidade: motores, validador, gerador (cliente simulado), contraste, guardas de design
```

```bash
npm run test:e2e                                # Playwright: fluxo completo, revisão com relógio falso, conforto visual, backup, 390 px
```

```bash
npm run contraste                               # mede o contraste WCAG dos tokens e atualiza docs/contraste.md
```

O design segue o sistema **Zero Eye-Strain**, com o tema claro Warm E-Ink e o escuro Low-Blue Warm Slate e os hex exatos do briefing:
- Inter na interface, Newsreader na leitura e JetBrains Mono com tabular-nums nos dados.
- Movimento de 150–220 ms com `cubic-bezier(0.22, 1, 0.36, 1)` e sem loops.

Um teste de guarda reprova preto e branco puros, gradientes, animações em loop, sombras pesadas e easing elástico. As razões de contraste medidas estão em [`docs/contraste.md`](docs/contraste.md): o texto principal mede 14,2:1 no claro e 12,6:1 no escuro.

## Estrutura

```
src/app        shell, rotas, atalhos, paleta de comandos
src/engine     motores puros e testados (embaralhamento, mutação, SRS, nota FCC, linhas, ritmo, espelho)
src/db         Dexie (IndexedDB), seeder, serviços, backup
src/data       edital (taxonomia do Anexo II), schema, validador, banco embutido
src/features   telas
scripts        validador, estatísticas, gerador, contraste
docs           pesquisa por matéria, guia de autoria, decisões, contraste
tests/e2e      Playwright
```
