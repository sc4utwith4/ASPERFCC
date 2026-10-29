# Matemática e Raciocínio Lógico — padrões de cobrança da FCC

> Base para as 50 questões (`src/data/questions/matematica-raciocinio-logico/`) e a nota Cornell (`src/data/notas-exemplo/matematica-raciocinio-logico.json`).
>
> **Escopo e método:** ficha curta, escrita sem buscas na web, a partir do Anexo II do edital (taxonomia em `src/data/edital.ts`) e do estilo conhecido das provas FCC de nível médio. Os gabaritos do banco foram conferidos por script em Python (aritmética com `fractions`, lógica por tabela-verdade ou força bruta com `itertools`, calendário com `datetime`). Nenhuma questão foi copiada de prova real.

## 1. Perfil da cobrança

- **Prova sem calculadora.** Os números são "amigáveis": frações que simplificam, porcentagens redondas (10%, 20%, 25%), MMC e MDC de números pequenos. Se uma conta exige mais de 2 ou 3 minutos à mão, o enunciado provavelmente esconde um atalho (fator multiplicativo, contrapositiva, resto da divisão por 7).
- **Contexto administrativo curto:** processos, pastas, servidores, plantões, prazos, prêmios e gratificações. O cenário é só cenário; a matemática é escolar.
- **Alternativas numéricas em ordem crescente**, com distratores que são resultados de erros típicos ou valores intermediários corretos (por exemplo, o total depois da mudança quando o comando pede o total antes).
- **Raciocínio lógico** em cinco famílias: associação de informações, sequências, orientação espacial e temporal, formação de conceitos e lógica dedutiva (negação, equivalência, silogismos, validade).

## 2. Tipos de questão por subtópico

| Subtópico | Tipos frequentes |
|---|---|
| Números inteiros e racionais | Expressões com potência de base negativa, decimais e frações; problemas de "ganha x, perde y" (pontuação); dízimas e conversões. |
| Múltiplos e divisores (MMC e MDC) | "Voltam a coincidir" (MMC); "maior tamanho possível" e "menor número de grupos" (MDC); mesmo resto em várias divisões (N − r é múltiplo comum). |
| Frações | Partes do restante ("gastou 1/3 e depois 2/5 do que sobrou"); trabalho conjunto; comparação e ordenação de frações próximas. |
| Razões, proporções e divisão proporcional | Razão que muda após entrada ou saída de pessoas; divisão direta, inversa e composta (direta a uma grandeza e inversa a outra). |
| Regra de três | Simples inversa (velocidade × tempo, taxa × tempo, pessoas × prazo); composta com três ou quatro grandezas; produtividades diferentes (2 técnicos = 3 estagiários). |
| Porcentagem | Aumentos e descontos sucessivos; valor original a partir do final; recuperação de queda; média ponderada de taxas de grupos diferentes. |
| Estruturas lógicas e associação | Tabelas de dupla entrada com pistas de ordem e exclusão; verdade e mentira; princípio da casa dos pombos (pior caso). |
| Raciocínio sequencial | Sequências numéricas com operações alternadas; sequências de letras pelo alfabeto de 26 letras; padrões cíclicos (resto da divisão); disposições triangulares. |
| Orientação espacial e temporal | Dia da semana de datas futuras; ano bissexto; relógios que adiantam ou atrasam; mesas circulares; rotações de figuras. |
| Raciocínio verbal e formação de conceitos | Elemento intruso (anagramas, critério de letras); códigos letra a letra inferidos de exemplos; grupos de palavras com critério oculto. |
| Lógica dedutiva e argumentação | Negação de todo, algum e nenhum; De Morgan; condicional, contrapositiva e p → q ≡ ¬p ∨ q; "somente se"; silogismos; validade de argumentos. |

## 3. Pegadinhas típicas da FCC

- **Aumento e desconto de mesma taxa não se anulam:** +20% e −20% dão 0,96 do valor; para desfazer −20% é preciso +25%.
- **Taxas não se somam:** dois aumentos de 10% dão 21%; percentuais de grupos de tamanhos diferentes exigem média ponderada (40% × 30% + 60% × 20% = 24%, e não 25%).
- **Regra de três inversa montada como direta:** com volume fixo, menos velocidade significa mais tempo; na composta, prazo e jornada são inversos ao número de pessoas.
- **MMC de "volta a coincidir" confundido com produto ou com múltiplo comum qualquer;** a propriedade MMC × MDC = produto só vale para dois números.
- **Ano bissexto:** um ano de 366 dias avança dois dias da semana; fevereiro tem 29 dias; anos seculares só são bissextos se divisíveis por 400 (2100 não é).
- **Negar "todo" com "nenhum"** (contrária) em vez de "algum... não" (contraditória).
- **Recíproca no lugar da contrapositiva** e **negação da condicional com "se... então"** (o correto é "p e não q").
- **"Somente se" invertido:** "A somente se B" é A → B.
- **Valor intermediário como resposta:** a banca oferece o número de analistas quando o comando pede o total, ou o 9º termo quando pede o 10º.
- **Melhor caso no lugar do pior caso** em questões de "ter certeza".

## 4. Pontos de cautela

- **Arredondamento.** A FCC evita resultados que dependam de arredondamento; quando ele aparece, o enunciado diz a regra ("aproximadamente", "desprezando-se os centavos", "arredondando para o inteiro mais próximo"). No banco, todos os gabaritos são exatos; se um cálculo der dízima, revise os dados antes de supor arredondamento. Atenção a "no mínimo" (arredonda para cima: 7,2 pessoas viram 8) e "no máximo" (arredonda para baixo).
- **Sentido horário × anti-horário em mesas circulares.** "À direita de" depende de para onde a pessoa olha. Com todos voltados para o centro, a direita de cada pessoa fica no sentido anti-horário visto de cima; com todos de costas para o centro, inverte. Questões bem formuladas fixam a convenção ("sentados voltados para o centro"); se o enunciado não fixar, a ambiguidade invalida a questão.
- **Contagem de dias.** "Daqui a 45 dias" conta a partir do dia seguinte; "de 1º a 10" inclui os dois extremos (10 dias). Prazo e intervalo diferem em uma unidade.
- **Intervalos numéricos.** "Entre 200 e 300" e "mais de 200 e menos de 300" excluem os extremos; "de 200 a 300" os inclui. Escreva a faixa sem ambiguidade.
- **Alfabeto.** Desde o Acordo Ortográfico de 1990 (vigente no Brasil desde 2009), o alfabeto tem 26 letras, com K, W e Y. Questões de sequência de letras devem dizer isso e indicar se a contagem é circular (depois do Z vem o A).
- **Notação.** Vírgula decimal e ponto de milhar (R$ 1.750,00); sinal de menos tipográfico (−) em números negativos; "1ª linha", "10º termo".
- **Quantificadores em português.** "Alguns" significa "pelo menos um" (pode ser todos); "pelo menos um... não" é a negação de "todo".

## 5. Distribuição final do banco (50 questões)

- **Níveis:** 10 Básico, 25 Intermediário, 15 Avançado.
- **Formatos:** 25 diretas, 20 caso-prático, 5 assertivas.
- **Subtópicos:** Lógica dedutiva 6; Porcentagem 5; Regra de três 5; Estruturas lógicas e associação 5; Orientação espacial e temporal 5; os demais 4 cada.
- **Correta mais longa:** 8 de 50 (16%), sem padrão textual que a denuncie.
