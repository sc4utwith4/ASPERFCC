# Edital TCE-GO 2026 — Técnico de Controle Externo, Especialidade TI (código B02)

> Fonte primária: **Edital nº 01/2026** (DOE-GO de 25/08/2026) e **Edital nº 02/2026 — de Retificação** (15/09/2026), Fundação Carlos Chagas.
> Cópias dos PDFs obtidas no repositório público `HederGabriel/Concurso-TCE-GO-2026-Tecnico-de-Controle-Externo` (pasta `Editais/`).
> Este arquivo é a **fonte de verdade** da taxonomia usada em `src/data/edital.ts`.

## 1. Quadro de provas B02 (item 7.1, redação dada pela Retificação 02/2026)

| Prova | Disciplina | Questões | Peso |
|---|---|---:|---:|
| Objetiva — Conhecimentos Gerais | Língua Portuguesa | 10 | 1 |
| | Matemática e Raciocínio Lógico | 10 | 1 |
| | Legislação Institucional | 5 | 1 |
| Objetiva — Conhecimentos Específicos | Engenharia de Software | 4 | 2 |
| | Desenvolvimento de Sistemas | 5 | 2 |
| | Engenharia de Software Assistida por Inteligência Artificial e Sistemas Agentivos | 4 | 2 |
| | DevOps, Plataforma de Desenvolvimento e Engenharia de Entrega | 4 | 2 |
| | Banco de Dados | 4 | 2 |
| | Inteligência Artificial, Ciência de Dados e Automação | 5 | 2 |
| | Segurança da Informação | 4 | 2 |
| | Sistemas Operacionais, Redes e Computação em Nuvem | 5 | 2 |
| | Governança de Tecnologia da Informação | 4 | 2 |
| | Legislação Aplicada à Tecnologia da Informação | 4 | 2 |
| | Língua Inglesa (Leitura Técnica) | 2 | 2 |
| Discursiva | Estudo de Caso | 1 questão prática | — |

- Duração total: **4h30** (objetivas + discursiva, mesmo período). Permanência mínima de 3h.
- Múltipla escolha com **cinco alternativas** (7.2). Questões podem avaliar compreensão, aplicação e análise e "contemplar mais de um objeto de avaliação" (7.3).
- Proibido calculadora, régua, borracha, lápis (8.x / 11.5).
- Prova prevista para **17/01/2027**, em Goiânia/GO (8.1.1).

## 2. Julgamento das objetivas (Capítulo 9)

- Escore padronizado por prova (Gerais e Específicos separadamente), **média 50 e desvio-padrão 10**:
  `NP = [(A − X̄) / σ] × 10 + 50` — A = acertos do candidato; X̄ = média de acertos do grupo; σ = desvio-padrão do grupo (se σ = 0, usa-se 1).
- Nota objetiva = NP_Gerais × 1 + NP_Específicos × 2.
- **Habilitado com ≥ 150 pontos** na soma ponderada (9.5). Como a média de cada NP é 50, 150 equivale a ficar na média ponderada do grupo.
- **Não há desconto por erro.**

### Consequência prática (estimativa, não regra do edital)
O valor de 1 acerto a mais é `10 × peso / σ` da respectiva prova. Como σ tende a crescer com o número de questões (45 vs 25), uma questão de Específicos tende a valer **entre ~1,1× e ~1,5×** uma de Gerais, e não 2×. Português tem 10 das 25 questões de Gerais e ainda é critério de desempate.

## 3. Discursiva — Estudo de Caso (Capítulo 11)

- Corrigidas apenas as discursivas dos habilitados e mais bem classificados na objetiva: **até a 48ª posição** (ampla concorrência), **12ª** (candidatos negros) e todos os PcD habilitados (11.2).
- 01 questão prática; o candidato apresenta as soluções por escrito (11.4). Tema dos Conhecimentos Específicos, disciplinas podem estar inter-relacionadas (11.6). Avalia domínio de conteúdo, experiência prévia e adequação às atribuições do cargo (11.7).
- Escala 0–100; **habilitado com ≥ 50** (11.8–11.9).
- Nota prejudicada proporcionalmente por abordagem tangencial, parcial ou diluída em divagações e/ou colagem de textos da prova (11.10).
- Nota ZERO: fuga ao tema; texto não articulado; identificação do candidato; em branco; ilegível; assinada fora do local; não atender à grade de correção (11.12).
- **O limite de linhas é estabelecido na questão** (11.16). Texto fora do espaço reservado é desconsiderado (11.14). Cópia de textos motivadores ou de fontes públicas pode gerar "redução drástica da nota" (11.15).
- O edital **não** fixa a divisão 70/30 para o estudo de caso (ela existe para a Redação do cargo A01: Tema 70 + Coesão/Norma-padrão 30). A plataforma usa 70 (conteúdo, em 3 pilares) + 30 (coesão e norma-padrão) como convenção de treino.

## 4. Classificação final e desempate (Capítulo 12)

- Nota final B02 = notas ponderadas das objetivas + nota do Estudo de Caso (12.2).
- Desempate B02 (12.4.2.2), após o Estatuto do Idoso: **a) maior nota no Estudo de Caso; b) maior nota na objetiva de Específicos; c) mais acertos em Língua Portuguesa**; d) maior idade; e) função de jurado.

## 5. Cronograma relevante (Anexo III)

| Evento | Data |
|---|---|
| Inscrições | 05/10/2026 a 06/11/2026 |
| Convocação para provas | 11/12/2026 |
| **Provas objetivas e discursivas** | **17/01/2027** |
| Gabarito preliminar | 18/01/2027 (17h) |
| Resultado preliminar objetivas e discursivas | 19/03/2027 |
| Resultado final | 16/06/2027 |

## 6. Vagas e cargo
B02: 10 vagas (1 PcD, 2 negros), nível médio, vencimento inicial R$ 11.862,19. Atribuições: apoio à implementação e suporte de TI, diagnóstico de falhas, segurança física e lógica, treinamento, **apoio às contratações de TI (levantamento de mercado, especificações, análise de propostas)**, operação de sistemas e redação de expedientes (Anexo I, retificado).

## 7. Conteúdo programático (Anexo II — texto do edital, com a retificação aplicada)

> Observação 1 do Anexo II: considera-se a legislação vigente, súmulas e jurisprudência do STJ, STF e TCU até a data de publicação do edital.
> Observação 2: mesmo quando o conteúdo coincide, as provas têm níveis de complexidade diferentes conforme as atribuições do cargo.

### Língua Portuguesa
Redação Oficial. Ortografia e acentuação. Emprego do sinal indicativo de crase. Compreensão e interpretação de textos de gêneros variados. Relação do texto com seu contexto histórico. Denotação e conotação. Discurso direto, discurso indireto e discurso indireto livre. Intertextualidade. Figuras de linguagem. Morfossintaxe. Elementos estruturais e processos de formação de palavras. Sinonímia e antonímia. Pontuação. Pronomes. Concordância nominal e concordância verbal. Flexão nominal e flexão verbal. Vozes do verbo. Correlação de tempos e modos verbais. Regência nominal e regência verbal. Coordenação e subordinação. Conectivos. Redação (confronto e reconhecimento de frases corretas e incorretas; organização e reorganização de orações e períodos; equivalência e transformação de estruturas).

### Matemática e Raciocínio Lógico
Números inteiros e racionais: operações (adição, subtração, multiplicação, divisão, potenciação); expressões numéricas; múltiplos e divisores de números naturais; problemas. Frações e operações com frações. Números e grandezas proporcionais: razões e proporções; divisão em partes proporcionais; regra de três; porcentagem e problemas envolvendo regra de três simples, cálculos de porcentagem, acréscimos e descontos. Raciocínio Lógico: Estrutura lógica de relações arbitrárias entre pessoas, lugares, objetos ou eventos fictícios; dedução de novas informações das relações fornecidas e avaliação das condições usadas para estabelecer a estrutura daquelas relações. Compreensão e elaboração da lógica das situações por meio de: raciocínio verbal; raciocínio matemático; raciocínio sequencial; orientação espacial e temporal; formação de conceitos; discriminação de elementos. Compreensão do processo lógico que, a partir de um conjunto de hipóteses, conduz, de forma válida, a conclusões determinadas.

### Legislação Institucional (redação da Retificação 02/2026)
Constituição da República Federativa do Brasil de 1988: Administração Pública; fiscalização contábil, financeira, orçamentária, operacional e patrimonial; controle interno e controle externo. Constituição do Estado de Goiás: disposições relativas ao Tribunal de Contas do Estado de Goiás. Lei Orgânica do Tribunal de Contas do Estado de Goiás (Lei Estadual nº 16.168, de 11/12/2007). Regimento Interno do Tribunal de Contas do Estado de Goiás (Resolução nº 22, de 04/09/2008, e alterações posteriores). Plano de Cargos, Carreiras e Remuneração dos Servidores do Tribunal de Contas do Estado de Goiás (Lei Estadual nº 15.122, de 04/02/2005). Regime Jurídico dos Servidores Públicos Civis do Estado de Goiás (Lei Estadual nº 20.756, de 28/01/2020). Código de Ética dos Servidores do Tribunal de Contas do Estado de Goiás. Políticas institucionais do Tribunal de Contas do Estado de Goiás e resoluções normativas relacionadas à organização, ao funcionamento e à gestão institucional do Tribunal (Resolução Administrativa nº 14/2025, que define a estrutura organizacional com as respectivas competências. Resolução Administrativa nº 17/2024, que dispõe sobre a Política de Segurança da Informação. Resolução Normativa nº 5/2024 que regulamenta o tratamento e a proteção de dados pessoais. Resolução Administrativa nº 24/2024, que dispõe sobre o uso de ferramentas de Inteligência Artificial. Resolução Administrativa nº 5/2024, que dispõe sobre a Política de Gestão de Pessoas. Resolução Administrativa nº 19/2024, que dispõe sobre a Política de Comunicação. Resolução Administrativa nº 15/2024, que dispõe sobre o Sistema de Planejamento e Gestão).

### Engenharia de Software
Fundamentos da engenharia de software; ciclo de vida de software; abordagens de ciclo de vida preditiva, iterativa, incremental e adaptativa/ágil, inclusive suas combinações. Abordagens, métodos e frameworks ágeis: Scrum, Kanban, Lean Software Development e Extreme Programming (XP). Levantamento, especificação, análise, validação e gerenciamento de requisitos funcionais e não funcionais; histórias de usuário, casos de uso e critérios de aceite. Arquitetura de software: padrões arquiteturais, arquitetura em camadas, orientada a serviços (SOA), microsserviços e orientada a eventos; princípios SOLID, DRY, KISS e YAGNI; coesão e acoplamento. Modelagem de sistemas e processos com UML e BPMN. Padrões de projeto de software (Design Patterns), incluindo padrões criacionais, estruturais e comportamentais. Qualidade de software: desempenho, escalabilidade, disponibilidade, confiabilidade e manutenibilidade. Testes de software: unitários, de integração, funcionais, de regressão, de carga e de estresse; testes automatizados. Revisão de código e refatoração; dívida técnica.

### Desenvolvimento de Sistemas
Algoritmos, lógica de programação e estruturas de dados. Programação orientada a objetos e programação funcional. Programação em Java (conceitos básicos). Programação em JavaScript e no ambiente Node.js. Desenvolvimento front-end com React. Programação em Python para automação e desenvolvimento back-end. Desenvolvimento de APIs RESTful; conceitos de GraphQL e WebSockets; formatos JSON e XML. Autenticação, identidade e autorização: OAuth 2.0, OpenID Connect (OIDC) 1.0; tokens e claims; JSON Web Token (JWT). Desenvolvimento web: HTML5, CSS3 e TypeScript. Controle de versão com Git. Documentação de APIs (OpenAPI/Swagger). Gerenciamento de dependências, empacotamento e publicação de aplicações.

### Engenharia de Software Assistida por Inteligência Artificial e Sistemas Agentivos
Fundamentos da inteligência artificial aplicada ao desenvolvimento de software; modelos de linguagem de grande porte (Large Language Models – LLMs). Programação baseada em intenção (Intent-Based Programming) e desenvolvimento orientado a linguagem natural. Engenharia de contexto e engenharia de prompts aplicadas ao desenvolvimento de software. Sistemas agentivos de desenvolvimento: arquitetura e funcionamento de assistentes de codificação em interfaces de terminal (CLI) e integradas a IDE, a exemplo de agentes de codificação como Claude Code e Antigravity CLI, entre ferramentas correlatas ou funcionalmente equivalentes. Ciclo agentivo de desenvolvimento: descoberta e coleta de contexto; planejamento e tomada de decisão; execução de ações em sistema de arquivos e comandos de shell; verificação autônoma de resultados e mecanismos de autocorreção (self-healing). Geração, revisão, documentação e depuração de código assistidas por IA; geração de testes. Gestão de contexto e memória; recuperação aumentada por geração (Retrieval-Augmented Generation – RAG) e bancos vetoriais. Protocolos de interoperabilidade entre agentes e ferramentas, como o Model Context Protocol (MCP). Extensibilidade e automação de fluxos de trabalho especializados (skills e tool use). Avaliação da qualidade do código produzido por IA; alucinações e validação de resultados; segurança, privacidade, propriedade intelectual e ética no desenvolvimento assistido por IA.

### DevOps, Plataforma de Desenvolvimento e Engenharia de Entrega
Integração, entrega e implantação contínuas (CI/CD); pipelines de desenvolvimento; automação de build e de testes. Infraestrutura como código e gerenciamento de configuração. Observabilidade e monitoramento de sistemas: métricas, logs e traces; telemetria, instrumentação, correlação de eventos, alertas e acompanhamento de indicadores técnicos de aplicações e infraestrutura. Controle de versão distribuído com Git; plataformas de hospedagem, colaboração e automação baseadas em Git, incluindo GitHub e GitLab; estratégias de branching, incluindo Git Flow e trunk-based development; pull requests/merge requests e revisão de código. Conteinerização: Docker e Docker Compose; orquestração de containers com Kubernetes. Ambientes de desenvolvimento, homologação e produção. Automação de pipelines: GitHub Actions, GitLab CI/CD, Jenkins e ferramentas correlatas.

### Banco de Dados
Modelagem de dados: modelo entidade-relacionamento, normalização e desnormalização. Linguagem SQL; álgebra relacional; transações e propriedades ACID. Índices e otimização de consultas. Procedures, triggers e views. Bancos relacionais: administração e otimização de PostgreSQL e Oracle Database. Bancos de dados NoSQL: modelos orientados a documentos, chave-valor, famílias de colunas (wide-column) e grafos; características, casos de uso e conceitos gerais; tecnologias como MongoDB e Redis. Noções de bancos de dados vetoriais aplicados à IA (embeddings). Replicação, backup e recuperação; alta disponibilidade. Segurança e governança de dados.

### Inteligência Artificial, Ciência de Dados e Automação
Fundamentos da inteligência artificial. Aprendizado de máquina: aprendizado supervisionado, não supervisionado e por reforço. Redes neurais artificiais e noções de deep learning. Processamento de linguagem natural. Inteligência artificial generativa: conceitos e aplicações. Agentes inteligentes e modelos multimodais. Engenharia de prompts e de contexto; recuperação aumentada por geração (RAG). Aplicações práticas de IA em sistemas de informação e automação de processos. Ética em inteligência artificial: IA responsável, explicabilidade e governança de IA; LGPD aplicada à IA. Fundamentos de ciência de dados: coleta, preparação, limpeza, transformação, exploração e análise de dados; noções de estatística aplicada e avaliação de modelos; fundamentos de Big Data, processamento distribuído e características de volume, velocidade e variedade dos dados. Estratégia Brasileira de Inteligência Artificial.

### Segurança da Informação
Princípios da segurança da informação: confidencialidade, integridade, disponibilidade, autenticidade e não repúdio. Gestão de riscos, de vulnerabilidades e de incidentes de segurança. Classificação da informação. Controle de acesso: autenticação, autorização e gestão de identidades (IAM). Criptografia simétrica e assimétrica; infraestrutura de chaves públicas; certificados e assinatura digital. Segurança em aplicações: OWASP Top 10:2025; boas práticas de codificação segura (DevSecOps); segurança em APIs, em containers e em ambientes de nuvem. Backup, continuidade de negócios e recuperação de desastres. Malware, ransomware, phishing e engenharia social. Firewalls, antivírus, IDS/IPS; testes de invasão e análise de vulnerabilidades. Conceito de Zero Trust. Família de normas ABNT NBR ISO/IEC 27000 (gestão da segurança da informação).

### Sistemas Operacionais, Redes e Computação em Nuvem
Sistemas operacionais Windows e Linux: administração básica; gerenciamento de processos, memória e sistemas de arquivos. Comandos básicos de shell (Linux) e do Windows PowerShell; automação por scripts. Serviços de diretório: Active Directory e LDAP. Virtualização e containers. Redes de computadores: arquitetura TCP/IP, endereçamento IPv4 e IPv6, DNS e DHCP; protocolos HTTP/2, HTTP/3 e HTTPS, SMTP, FTP e SSH; VPN, balanceamento de carga, proxies e firewalls; noções de redes sem fio. Computação em nuvem: modelos IaaS, PaaS e SaaS; computação serverless; escalabilidade e alta disponibilidade; integração entre ambientes locais e nuvem; monitoramento de infraestrutura.

### Governança de Tecnologia da Informação
Governança de TI: estratégia e alinhamento com os objetivos institucionais. Gestão de serviços de TI: catálogo de serviços, gerenciamento de incidentes, problemas, mudanças e configuração. Gestão de portfólio e de ativos de TI; continuidade de serviços. Boas práticas e modelos de referência: COBIT 2019, ITIL v4 e ISO/IEC 38500:2024. Gestão de projetos: fundamentos do PMBOK 8ª edição e de métodos ágeis aplicados a projetos de TI. Contratação de soluções de tecnologia da informação e comunicação (Lei nº 14.133/2021 aplicada às contratações de TIC). Governo digital e transformação digital no setor público: Lei nº 14.129/2021 (Lei do Governo Digital); Estratégia Nacional de Governo Digital – ENGD 2024–2027, instituída pelo Decreto nº 12.069/2024, consideradas suas recomendações e atualizações vigentes.

### Legislação Aplicada à Tecnologia da Informação
Aplicação técnica da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018) no desenvolvimento e na operação de sistemas: privacy by design e by default, minimização de dados, anonimização e pseudonimização. Marco Civil da Internet (Lei nº 12.965/2014): princípios de neutralidade de rede, proteção de dados e guarda de registros de conexão e de acesso. Requisitos de segurança da informação em contratações de soluções de TIC. Certificação digital e sua aplicação em sistemas informatizados. Lei Complementar estadual nº 205, de 19 de maio de 2025. Normativos e instrumentos institucionais do Tribunal de Contas do Estado de Goiás relacionados à governança, ao planejamento, à segurança da informação e à tecnologia da informação: Resolução Normativa nº 13/2016, que institui o Comitê Estratégico de Tecnologia da Informação (CETI), considerando seu texto compilado; Resolução Administrativa nº 14/2024, que dispõe sobre a Política de Governança Organizacional; Resolução Administrativa nº 17/2024, que dispõe sobre a Política de Segurança da Informação; Resolução Administrativa nº 14/2025, no que se refere à estrutura e às competências da Diretoria de Tecnologia da Informação e de suas unidades vinculadas; Plano Diretor de Tecnologia da Informação (PDTI) 2025–2026, aprovado pela Ordem de Serviço nº 001/2025-CETI.

### Língua Inglesa (Leitura Técnica)
Compreensão de textos técnicos e científicos em língua inglesa relacionados à tecnologia da informação. Estratégias de leitura: identificação da ideia principal e localização de informações específicas. Vocabulário técnico da área de Tecnologia da Informação. Interpretação de manuais, documentação de software, artigos técnicos e documentação de APIs.
