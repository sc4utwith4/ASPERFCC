# Guia de autoria — questões inéditas no padrão FCC (TCE-GO 2026, Técnico de Controle Externo — TI)

Este guia vale para quem escreve questões para o banco: pessoas, subagentes e o CLI gerador. O schema está em `src/data/schema.ts`, a taxonomia em `src/data/edital.ts` e o texto do edital em `docs/pesquisa/_edital.md`. Uma questão-modelo completa e validada está em `docs/exemplo-questao.json`.

## 0. Regras inegociáveis

1. **Inédita.** Nada copiado de provas, cursinhos ou livros. Textos de apoio (Português e Inglês) também são originais. Provas FCC anteriores servem só como referência de estilo.
2. **Correta e verificável.** Cada afirmação tem fonte real e específica em `fundamentacao` (lei e artigo, norma e controle, guia oficial e seção, RFC). Se você não tem certeza de um fato, não escreva a questão sobre ele: troque o enfoque. Para normativos do TCE-GO, use `docs/pesquisa/_normativos-tce-go.md`. O que não estiver confirmado ali recebe `"revisarFonteOficial": true`.
3. **Uma única correta, sem ambiguidade.** Um examinador que domina o assunto não pode defender duas alternativas.
4. **Sem referência posicional.** As alternativas são embaralhadas no app. Proibido: "todas as anteriores", "nenhuma das alternativas", "as alternativas A e B", "letra C".
5. **Subtópico literal.** `subtopico` precisa ser exatamente um dos nomes de `edital.ts` para a matéria. Todos os subtópicos precisam de pelo menos 2 questões.
6. **IDs e lotes.** Lote N contém os ids `(N−1)×10+1` a `N×10` com o prefixo da matéria (`bd-001` … `bd-010` no lote 1). Arquivo: `src/data/questions/<slug>/lote-NN.json` no formato `{ "materiaSlug", "lote", "questoes": [...] }`.
7. **Valide.** `npm run bank:validate -- --materia <slug> --parcial` durante o trabalho. Ao final, `npm run bank:validate -- --materia <slug>` deve passar com 0 erros.

## 1. Calibragem: banca, cargo e nível

- O cargo é de **nível médio** (Técnico), mas o spec pede questões de alto nível. Distribuição por matéria (50 questões): **10 Básico, 25 Intermediário, 15 Avançado**.
  - Básico: conceito direto, literalidade de norma, definição.
  - Intermediário: aplicação a um caso curto, distinção entre conceitos vizinhos.
  - Avançado: caso com dois ou mais objetos de avaliação (item 7.3 do edital), cálculo em etapas, exceção à regra, armadilha sutil.
- A FCC atual mistura literalidade com aplicação prática. Nas provas recentes de TI, o enunciado com cenário ("Um analista…", "Considere que…") é o formato dominante.

## 2. Formatos (campo `formato`)

Alvo por matéria (exceto Português e Inglês): ~40% `caso-pratico`, ~30% `direta`, ~20% `assertivas`, ~10% `lacunas`.

- **`caso-pratico`**: cenário concreto no contexto do Tribunal (auditoria, fiscalização, prestação de contas, protocolo, sistemas internos, central de serviços), com o comando no final. Exemplo de fecho: "Nesse caso, o técnico deve…", "…é correto concluir que", "O fenômeno observado e a propriedade envolvida são, respectivamente,".
- **`direta`**: "A respeito de X, é correto afirmar que", "No Scrum, segundo o Guia de 2020, …", "Considere o seguinte trecho de código…".
- **`assertivas`**: o enunciado (e cada variante) traz o contexto e termina com "Considere as afirmativas abaixo." (ou "as afirmações a seguir"). As assertivas vão no campo `assertivas` (3 a 5 itens com `texto`, `verdadeira` e `explicacao`, **sem** numeração no texto), e o app as exibe como I, II, III… O comando vai em **`comandoFinal`** (ex.: "Está correto o que se afirma em"), exibido depois da lista. As alternativas são combinações: "I e II, apenas.", "I, II e III.", "II, apenas." etc.
- **`lacunas`**: o enunciado usa "……" para cada lacuna e termina com "Preenchem, correta e respectivamente, as lacunas:". Alternativas no padrão "X − Y − Z".

Não use "INCORRETA/EXCETO" em mais de 10% das questões da matéria. Quando usar, destaque em maiúsculas.

## 3. Alternativas (exatamente 5, ids `opt-1` a `opt-5`)

- Todas plausíveis, com o mesmo registro e tamanho comparável. **A correta não pode ser sistematicamente a mais longa**: o validador barra a matéria acima de 45% e avisa acima de 35%. Varie a posição do detalhe decisivo.
- Cada distrator deve explorar um equívoco real. Repertório típico da FCC:
  - troca de um termo-chave ("deverá" ↔ "poderá", "autenticação" ↔ "autorização", "integridade" ↔ "disponibilidade");
  - prazo, número ou limite alterado (prazo legal, porta, tamanho de campo, máximo do time-box);
  - inversão de causa e efeito ou de quem faz o quê (papéis do Scrum, controlador × operador);
  - generalização indevida ("sempre", "exclusivamente", "em qualquer hipótese");
  - meia-verdade: começo correto e final errado;
  - conceito vizinho de outra versão (ITIL v3 × ITIL 4, PMBOK 6 × 7/8, ISO 27002:2013 × 2022, OWASP 2021 × 2025);
  - "alternativa A atraente": parece completa, mas contém uma exceção errada. Coloque essa armadilha em `opt-1` em parte das questões. O app embaralha na exibição, mas a ordem original serve de registro.
- Proibido: "todas/nenhuma das anteriores", alternativa que só é falsa por erro de digitação, alternativas que se contradizem de forma tão óbvia que eliminam as demais.

## 4. Explicações (`explicacaoDetalhada`)

- Começa com **"CORRETA."** ou **"INCORRETA."** (o validador exige).
- Diz **por que** a alternativa está certa ou errada, com a regra ou o fato e a fonte quando couber, e qual é a armadilha daquele distrator. Faixa recomendada: 2 a 4 frases (≥ 120 caracteres).
- Na correta, explique o conceito por completo, porque esse texto é a aula da questão.

## 5. Campos do Motor Anti-Decoreba

- **`variantesEnunciado`** (2 a 4): reescrevem o contexto (outra unidade, outro sistema, outro enquadramento) **mantendo exatamente o mesmo gabarito e as mesmas alternativas válidas**. Não podem entregar a resposta nem mudar números que alterem o resultado. Em Português e Inglês, variam o comando sobre o mesmo texto ("Conforme o 2º parágrafo…" × "De acordo com o texto…") e mantêm o `textoApoioId`.
- **`versaoInvertidaFalsa`** (só na correta, obrigatória): afirmação **falsa**, autossuficiente e plausível, que inverte o ponto-chave da correta, no mesmo estilo e tamanho. É usada no modo "Versão Invertida", em que o estudante identifica qual é a fiel. No formato `assertivas`, escreva a versão invertida da assertiva verdadeira mais importante, como frase completa. No formato `lacunas`, troque a ordem ou um dos termos.
- **`pegadinhaFCC`**: 1 a 2 frases nomeando a armadilha da questão (o que a banca quer que o candidato confunda).
- **`resumoFlashcard`**: `pergunta` direta sobre o conceito central e `resposta` autossuficiente em 2 a 3 frases. Vira flashcard de revisão.
- **`conceitosChave`**: 1 a 3 rótulos curtos e reutilizáveis ("ACID: isolamento", "Scrum: Sprint", "LGPD: encarregado"). Alimentam o Resumo de Ouro do Debrief, então **reutilize o mesmo rótulo** em questões do mesmo conceito.
- **`fundamentacao`**: fonte específica. Exemplos: "Lei 13.709/2018, art. 46, caput e § 2º"; "Guia do Scrum (2020), seção 'Sprint'"; "ABNT NBR ISO/IEC 27002:2022, controle 8.13"; "RFC 9114 (HTTP/3)"; "OWASP Top 10:2025, A01".
- **`revisarFonteOficial`**: `true` quando o fato depende de normativo do TCE-GO ou de Goiás que não foi lido na íntegra.

## 6. Por matéria

- **Língua Portuguesa** (`lp`): escreva cerca de 10 textos originais em `src/data/textos/lingua-portuguesa.json` (`{ "materiaSlug", "textos": [{ "id": "lp-t01", "titulo", "idioma": "pt", "genero", "fonte": "Texto inédito escrito para esta plataforma", "paragrafos": [...] }] }`). Use gêneros variados (crônica, ensaio, artigo de opinião, reportagem, texto técnico-administrativo), com 3 a 5 parágrafos e 280 a 450 palavras. Cada texto sustenta 3 a 5 questões de interpretação, semântica no contexto, reescrita, pontuação, concordância etc. Complete com questões gramaticais avulsas (frases próprias). Comandos típicos da FCC: "Considerando-se o contexto, traduz-se adequadamente o sentido de um segmento em:", "Está correta a nova redação de um segmento do texto em:", "A concordância verbal está plenamente observada na frase:", "Mantendo-se o sentido e a correção, o segmento … pode ser substituído por:". Para Redação Oficial, siga o Manual de Redação da Presidência da República (3ª ed., 2018): pronomes de tratamento, fechos, padrão ofício e e-mail.
- **Matemática e RL** (`mat`): sem calculadora, com números "amigáveis". **Confira todo gabarito com um script** (Python ou Node) antes de gravar. A explicação da correta mostra o cálculo passo a passo, e as incorretas indicam o erro típico que leva àquele valor. Inclua cascatas de 2 a 3 etapas nas questões avançadas e problemas de associação lógica, sequências, calendários e argumentação.
- **Legislação Institucional** (`leg-inst`) e **Legislação de TI** (`leg-ti`): misture literalidade (com artigo citado) e aplicação a caso. CF/88, LGPD, Marco Civil, 14.133 e 14.129 são de texto conhecido. Para normativos do TCE-GO e de Goiás, siga o item 0.2. Na dúvida, cobre o princípio que o normativo concretiza.
- **Inglês Técnico** (`ing-tec`): cerca de 10 textos originais em inglês (150 a 300 palavras) em `src/data/textos/lingua-inglesa-tecnica.json`: documentação de API, release notes, postmortem de incidente, especificação no estilo de RFC, abstract de artigo de IA, advisory de segurança, README, documentação de nuvem. Enunciados e alternativas em português (estilo FCC), citando trechos em inglês quando preciso. Toda questão de Inglês tem `textoApoioId`.
- **Específicas de TI**: cobre versões atuais e nomeie a versão. Exemplos: OWASP Top 10:2025, PMBOK 8ª ed., ITIL 4, COBIT 2019, ISO/IEC 38500:2024, ISO/IEC 27001/27002:2022, Guia do Scrum 2020, HTTP/3 (RFC 9114), OAuth 2.0 (RFC 6749) e OIDC Core 1.0, JWT (RFC 7519), MCP. Em comandos e código (SQL, shell, Git, Python, JS), confira a sintaxe.

## 7. Contexto do TCE-GO

Use o Tribunal como cenário (unidades técnicas, auditorias de sistemas, prestação de contas, processos eletrônicos, jurisdicionados, central de serviços de TI, contratações de TIC). **Não invente fatos sobre o Tribunal**: nada de "o TCE-GO usa Oracle 19c" ou "a DTI tem 4 gerências". Cenários são hipotéticos ("Considere que a equipe de TI do Tribunal…").

## 8. Notas Cornell de exemplo (`src/data/notas-exemplo/<slug>.json`)

Uma nota por matéria, sobre um tema de alta incidência, no formato:
`{ "id": "nota-<prefixo>-01", "materiaSlug", "titulo", "subtopico", "pistas": [{ "pergunta", "resposta" }] (6 a 10), "conteudoMarkdown" (400 a 1.500 palavras; use ## títulos, parágrafos, "- " listas, "> " citações, **negrito** e ==destaque==), "sintese" (3 a 5 linhas com as próprias palavras), "fontes": [...] }`.

## 9. Checklist antes de gravar cada lote

- [ ] 10 questões, ids na faixa do lote, `subtopico` literal da taxonomia.
- [ ] Uma correta por questão. Distratores plausíveis. Nenhuma referência posicional.
- [ ] Explicações começam com CORRETA/INCORRETA e dizem o porquê.
- [ ] 2 ou mais variantes que preservam o gabarito. `versaoInvertidaFalsa` na correta.
- [ ] Pegadinha, flashcard, conceitos-chave (reutilizados) e fundamentação específica.
- [ ] Fatos conferidos. Cálculos verificados por script (Matemática).
- [ ] `npm run bank:validate -- --materia <slug> --parcial` sem erros.
