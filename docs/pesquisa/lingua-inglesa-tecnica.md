# Língua Inglesa (Leitura Técnica): padrões de cobrança da FCC

> Base para os textos (`src/data/textos/lingua-inglesa-tecnica.json`), as 50 questões (`src/data/questions/lingua-inglesa-tecnica/`) e a nota Cornell (`src/data/notas-exemplo/lingua-inglesa-tecnica.json`).
>
> **Limitação do ambiente:** fiz uma busca (WebSearch), que devolve só resumos de páginas, e não abri provas na íntegra. O perfil abaixo junta esses resumos com o padrão já conhecido da banca. Os textos de apoio são originais e foram escritos para esta plataforma.

## 1. Perfil da FCC em inglês instrumental

- Cada questão tem 5 alternativas e uma só correta. A prova traz um ou dois textos densos, com vocabulário técnico. Em provas de TI de tribunais, os textos costumam tratar de tecnologia; uma prova do TRT-11 (Técnico de TI, 2012), por exemplo, usou um texto sobre cobertura 4G. Cerca de 60% das questões são curtas (vocabulário, referência, conectivo), e as outras 40% têm alternativas longas ou exigem a leitura do texto inteiro.
- Também aparecem lacunas no meio do texto a completar com conectivos (however, therefore, although, despite).
- No TCE-GO 2026 são **2 questões de peso 2** (bloco de específicas), então cada erro custa caro.

## 2. Tipos de questão adotados no banco (comandos em português)

| Tipo | Comando típico | Subtópico |
|---|---|---|
| Ideia principal | "O objetivo principal do texto é", "A ideia central da documentação é a de que" | Ideia principal e propósito do texto |
| Scanning | "De acordo com o 2º parágrafo, …", "Segundo o texto, o prazo …" | Localização de informações específicas |
| Vocabulário em contexto | "a palavra X pode ser traduzida, no contexto, por" (alternativas curtas, em português ou em inglês) | Vocabulário técnico de TI |
| Referência | "O pronome 'it', no trecho …, refere-se a" | Inferência, referência e conectivos |
| Conectivo | "O conectivo 'whereas' estabelece uma relação de", "'however' poderia ser substituído por" | Inferência, referência e conectivos |
| Paráfrase e inferência | "pode ser corretamente compreendida como:", "é correto concluir que" (com cenário hipotético) | Documentação / Manuais |
| Assertivas | I a IV sobre o texto + "Está correto o que se afirma em" | vários |
| Lacunas | tradução de trecho com "……" + "Preenchem, correta e respectivamente, as lacunas:" | Vocabulário / Documentação |

## 3. Falsos cognatos e vocabulário explorados

- **actually** (na verdade), t03 · **eventually** (por fim), t01 · **pretend** (fingir), t06 · **assume** (supor), t10
- **issue** (problema; o verbo *to issue* é emitir), t07 · **deprecated** (declarado obsoleto, mas ainda funciona), t01 e t07 · **breach** (violação de dados), t09
- **go unflagged** (passar sem ser sinalizado; *flag* é sinalizar), t04
- Phrasal verbs: **roll back** (reverter), **set up** (configurar/implantar), **phase out** (eliminar gradualmente), em t03 e t07

## 4. Conectivos e marcadores explorados

- Contraste: **whereas** (t02, t08), **however** (t04, t08, t10), **nevertheless** (t06, t08)
- Condição: **unless** (t02, t05, t06, t10), **provided that** (t02, t09), **otherwise** (t07)
- Concessão: **although** (t01, t03)
- Substituição: **rather than** (t04, t09)
- Referência: *which* retomando oração inteira (t03), *it* com antecedente distante (t04, t05), *those* e *its* (t09)
- Modais de especificação (BCP 14: RFC 2119 e RFC 8174): MUST / MUST NOT / SHOULD / MAY (t02); *shall* em política (t09)

## 5. Distribuição do banco (50 questões)

- Subtópicos: Ideia principal 8 · Localização 9 · Vocabulário 9 · Inferência, referência e conectivos 8 · Documentação de software e de APIs 8 · Manuais e artigos técnicos 8.
- Níveis: 10 Básico · 25 Intermediário · 15 Avançado. Formatos: 40 diretas · 5 assertivas · 5 lacunas.
- Cada texto sustenta 5 questões, e cada lote usa 2 textos (t01–t02, t03–t04, …).

## 6. Pontos de cautela

- **Comandos em português.** Provas reais da FCC às vezes trazem os comandos em inglês ("According to the text…", "The word X can be replaced by…"). Aqui seguimos o padrão da plataforma, em português, mas vale treinar a leitura dos dois formatos.
- **Literalidade das citações.** Todo trecho entre aspas curvas (“ ”) nos enunciados e explicações foi conferido por script contra os parágrafos do texto. Glosas em português e palavras das alternativas ficam entre aspas simples (‘ ’). Ao editar um texto, rode a conferência de novo, ou as questões ficam inconsistentes.
- **Títulos não são parágrafos.** Evite citar o título entre aspas curvas: a conferência só olha `paragrafos`.
- **Ambiguidade de referente.** Evitei perguntar sobre pronomes com dois antecedentes plausíveis. Exemplo: em “Contractors' access expires automatically at the end of their contract unless it is formally renewed”, *it* pode ser o acesso ou o contrato, e por isso o trecho não foi usado em questão de referência.
- **Polissemia.** Em vocabulário, os distratores não trazem sentidos que possam ser defendidos no contexto. Por exemplo, ‘assunto’ ficou fora das opções para *issue*.
- **Variantes.** Mudam o comando e o recorte do trecho, mas mantêm o mesmo `textoApoioId` e o mesmo gabarito. Nas lacunas, as variantes preservam as "……".
- **Correta mais longa.** Está em 9 de 50 questões (18%), dentro da faixa de 15–25%. As posições do gabarito ficaram em 10 por alternativa.

## Fontes consultadas

- [Estratégia Concursos, "Inglês dez: perfil da FCC"](https://www.estrategiaconcursos.com.br/blog/ingles-dez-perfil-da-fcc/amp/)
- [Estratégia Concursos, comentário de prova FCC com inglês para TI (TRT-11)](https://www.estrategiaconcursos.com.br/blog/?p=440641)
- [Folha Dirigida/QConcursos, perfil das provas da FCC (TJ-CE)](https://folha.qconcursos.com/n/concurso-tj-ce-perfil-fcc-provas)
- IETF, RFC 2119 e RFC 8174 (BCP 14): palavras-chave de nível de exigência.
