# Pesquisa — Governança de Tecnologia da Informação (`governanca-ti`, prefixo `gov-ti`)

> Base para as 50 questões de `src/data/questions/governanca-ti/` e para a nota `src/data/notas-exemplo/governanca-ti.json`.
> Ambiente: WebSearch (resumos de páginas) e, no GitHub, leitura do texto integral do Decreto 12.069/2024 (espelho do Planalto). O orçamento de buscas da sessão (compartilhado entre agentes) esgotou-se no fim da pesquisa: os pontos marcados **[não confirmado]** ficaram sem segunda fonte e **não** viraram gabarito.
> Regra adotada: só vira gabarito o que está confirmado abaixo. Números e nomes de versão foram conferidos um a um.

---

## 1. Governança de TI e alinhamento estratégico

- **Weill e Ross (2004)**: governança de TI = especificar os **direitos decisórios** e o **modelo de responsabilização** (accountability) para estimular comportamentos desejáveis no uso da TI. Cinco decisões: princípios de TI, arquitetura, infraestrutura, necessidades de aplicações de negócio, investimento e priorização.
- **Governança × gestão**: a governança avalia, direciona e monitora; a gestão planeja, constrói, executa e monitora, conforme a direção dada (COBIT 2019, ISO/IEC 38500). A alta administração pode delegar a execução, mas continua responsável (accountable) pelo uso da TI.
- **Setor público**: Decreto 9.203/2017, art. 2º, I (federal): governança pública = mecanismos de **liderança, estratégia e controle** para **avaliar, direcionar e monitorar** a gestão. Lei 14.133/2021, art. 11, parágrafo único: a **alta administração** responde pela governança das contratações (processos e estruturas, gestão de riscos e controles internos para avaliar, direcionar e monitorar).
- **Modelo de alinhamento estratégico (SAM), Henderson e Venkatraman (IBM Systems Journal, 1993)**: quatro domínios (estratégia de negócio, estratégia de TI, infraestrutura e processos organizacionais, infraestrutura e processos de TI). Duas dimensões: **ajuste estratégico** (externo × interno) e **integração funcional** (negócio × TI). Quatro perspectivas:
  - execução da estratégia: estratégia de negócio → infraestrutura organizacional → infraestrutura de TI;
  - transformação tecnológica: estratégia de negócio → estratégia de TI → infraestrutura de TI;
  - **potencial competitivo**: estratégia de TI → estratégia de negócio → infraestrutura organizacional;
  - nível de serviço: estratégia de TI → infraestrutura de TI → infraestrutura organizacional.
- **BSC de TI (Van Grembergen)**: perspectivas de contribuição corporativa, orientação ao usuário, excelência operacional e orientação futura. Os objetivos são desdobrados dos objetivos estratégicos da organização (cascata do BSC).

Fontes: Weill, P.; Ross, J. *IT Governance* (HBS Press, 2004). Henderson, J. C.; Venkatraman, N. "Strategic alignment", *IBM Systems Journal* 32(1), 1993. Van Grembergen, W.; De Haes, S. *Enterprise Governance of IT* (Springer). Decreto 9.203/2017 e Lei 14.133/2021 (planalto.gov.br).

## 2. Gestão de serviços (ITIL 4): catálogo, incidentes, problemas, mudanças e configuração

- **Incidente**: interrupção não planejada de um serviço ou redução da sua qualidade. Propósito da prática: minimizar o impacto negativo, restaurando a operação normal o mais rápido possível.
- **Problema**: causa, ou causa potencial, de um ou mais incidentes. Fases: identificação, controle do problema e controle de erros. **Erro conhecido**: problema analisado e ainda não resolvido. **Solução de contorno (workaround)**: reduz ou elimina o impacto quando a resolução completa ainda não existe.
- **Mudança**: adição, modificação ou remoção de qualquer coisa que possa afetar serviços, direta ou indiretamente. Prática: **habilitação de mudanças (change enablement)**, chamada de *change control* na publicação Foundation de 2019.
  - **padrão**: baixo risco, bem compreendida, documentada e **pré-autorizada**. O risco é avaliado quando o procedimento é criado ou alterado, não a cada execução. Muitas vezes nasce de uma requisição de serviço;
  - **normal**: precisa ser programada, avaliada e autorizada. A autoridade de mudança varia conforme o tipo e o risco (não precisa ser um CAB);
  - **emergencial**: implementada o quanto antes (corrigir incidente, aplicar correção de segurança). Avaliação e autorização são **expeditas**, podendo haver autoridade própria e documentação concluída depois. Em geral fica fora do cronograma de mudanças.
- **Configuração**: item de configuração (IC) é qualquer componente que precise ser gerenciado para entregar um serviço de TI. A prática mantém informação precisa sobre os ICs **e seus relacionamentos** (CMS/CMDB), base da análise de impacto.
- **Ativo de TI**: qualquer componente de valor financeiro que contribua para entregar um produto ou serviço de TI. O ativo tem foco em ciclo de vida, custo, licença e conformidade; o IC tem foco em configuração e relacionamentos.
- **Catálogo de serviços**: a prática fornece uma fonte única de informação consistente sobre todos os serviços e ofertas e a torna disponível ao público pertinente, com visões por público. O "portfólio de serviços" (serviços em planejamento, ativos e desativados) é conceito do ITIL v3; no ITIL 4, o portfólio é prática de gerenciamento geral.
- **Requisição de serviço**: pedido do usuário que inicia ação acordada como parte normal da entrega. **Evento**: mudança de estado com significado para a gestão de um serviço ou IC.

Fontes: AXELOS, *ITIL Foundation: ITIL 4 Edition* (2019), cap. 5. Resumos: https://itsm.tools/change-enablement/ · https://itsm.tools/34-itil-4-management-practices/

## 3. Gestão de portfólio, ativos e continuidade de serviços

- **Portfólio (PMI, Standard for Portfolio Management)**: projetos, programas, portfólios subsidiários e **operações** gerenciados em conjunto para alcançar objetivos estratégicos. A gestão de portfólio seleciona, prioriza, balanceia, inicia, acelera, suspende e encerra componentes conforme alinhamento, valor, risco e restrições de recursos.
- **ITIL 4, gerenciamento de portfólio** (prática geral): garantir o mix certo de programas, projetos, produtos e serviços para executar a estratégia dentro das restrições de financiamento e recursos. **COBIT 2019 APO05** (Portfólio gerenciado).
- **Ativos**: ITIL 4, gerenciamento de ativos de TI (prática de serviço). Planeja e gerencia o ciclo de vida completo dos ativos para maximizar valor, controlar custos, gerir riscos, apoiar decisões de compra, reuso e descarte e cumprir requisitos contratuais e regulatórios (licenças). COBIT 2019 **BAI09** (Ativos gerenciados) e **BAI10** (Configuração gerenciada). Norma: ISO/IEC 19770-1.
- **Continuidade**: ITIL 4, gerenciamento de continuidade de serviço: manter disponibilidade e desempenho em níveis suficientes **em caso de desastre**. Já o gerenciamento de disponibilidade cuida dos níveis acordados na operação normal. COBIT 2019 **DSS04** (Continuidade gerenciada). ISO 22301:2019 (SGCN) e ISO 22300 (vocabulário):
  - **MTPD**: tempo até os impactos se tornarem inaceitáveis;
  - **RTO**: prazo para retomar a atividade ou recuperar recursos. Deve ser **inferior** ao MTPD;
  - **RPO**: ponto até o qual a informação deve ser restaurada, ou seja, a perda máxima de dados admitida. O intervalo de backup tem de ser compatível com ele;
  - **BIA**: análise de impacto no negócio, que fixa esses parâmetros.

## 4. COBIT 2019 (ISACA)

- Publicações centrais: *Introduction and Methodology*, *Governance and Management Objectives*, *Design Guide* e *Implementation Guide*.
- **Governança × gestão**: a governança (conselho, sob liderança do presidente do conselho) avalia necessidades, condições e opções, direciona por priorização e decisão e monitora desempenho e conformidade. Fica no domínio **EDM**. A gestão (diretoria executiva, sob o CEO) planeja, constrói, executa e monitora: **APO, BAI, DSS, MEA**. O MEA é domínio de **gestão**, apesar do "monitorar". A separação já era princípio do COBIT 5.
- **6 princípios do sistema de governança**: prover valor às partes interessadas; abordagem holística; sistema dinâmico; governança distinta da gestão; adaptado às necessidades da organização; de ponta a ponta. **3 princípios do framework**: baseado em modelo conceitual; aberto e flexível; alinhado aos principais padrões. O COBIT 5 tinha 5 princípios.
- **40 objetivos** em 5 domínios: EDM 5, **APO 14**, BAI 11, DSS 6, MEA 4. Eram 37 processos no COBIT 5. Novos: **APO14 Dados gerenciados**, **BAI11 Projetos gerenciados** (BAI01 passou a "Programas gerenciados") e **MEA04 Garantia (assurance) gerenciada**. Cada objetivo relaciona-se a um processo e a componentes associados.
- **7 componentes** (os "habilitadores" do COBIT 5): processos; estruturas organizacionais (inclui a matriz RACI); princípios, políticas e frameworks; informação; cultura, ética e comportamento; pessoas, habilidades e competências; serviços, infraestrutura e aplicações.
- **Áreas de foco**: tema, domínio ou questão de governança atendida por um conjunto de objetivos e componentes. Exemplos: PMEs, cibersegurança, transformação digital, nuvem, privacidade, DevOps. Lista aberta.
- **11 fatores de desenho**: estratégia corporativa; metas corporativas; perfil de risco; questões de I&T; cenário de ameaças; requisitos de conformidade; **papel da TI** (suporte, fábrica, reviravolta, estratégico, inspirado em McFarlan); modelo de sourcing; métodos de implementação de TI; estratégia de adoção de tecnologia; porte.
  - suporte: não crítico para operação nem para inovação;
  - **fábrica**: falha gera impacto imediato na operação, mas a TI não é vetor de inovação;
  - **reviravolta (turnaround)**: vetor de inovação, sem dependência crítica atual;
  - estratégico: crítico para operar e para inovar.
- **Desempenho (CPM)**: escala 0–5 baseada no **CMMI**; o COBIT 5 usava ISO/IEC 15504, depois série 33000.
  - **capacidade** → **processo**: nível 3 = propósito atingido de forma organizada, com ativos organizacionais (bem definido); nível 4 = além disso, desempenho **medido quantitativamente**; nível 5 = melhoria contínua;
  - **maturidade** → **área de foco** ou conjunto de objetivos.
- **Cascata de metas**: direcionadores e necessidades das partes interessadas → **13 metas corporativas** → **13 metas de alinhamento** (as "metas relacionadas à TI" do COBIT 5, que tinha 17 + 17) → objetivos de governança e gestão. Os mapeamentos (primários e secundários) servem para priorizar.

Fontes: https://www.isaca.org/resources/news-and-trends/industry-news/2020/cobit-2019-and-cobit-5-comparison · https://www.isaca.org/resources/news-and-trends/industry-news/2020/effective-capability-and-maturity-assessment-using-cobit-2019 · https://www.isaca.org/resources/isaca-journal/issues/2021/volume-6/building-a-maturity-model-for-cobit-2019-based-on-cmmi · https://www.firstreference.com/blog/isaca-traded-cobit-5-for-cobit-2019-part-2/ · https://open-exam-prep.com/study-guides/cobit-2019/tailored-design/eleven-design-factors · https://open-exam-prep.com/study-guides/cobit-2019/components-overview/seven-components-overview · https://open-exam-prep.com/study-guides/cobit-2019/components-overview/focus-areas · https://isaca.org/cobit

## 5. ITIL 4

- **SVS**: entradas oportunidade e demanda; saída valor. Componentes: **princípios orientadores, governança, cadeia de valor de serviço, práticas e melhoria contínua**. As quatro dimensões **não** são componentes do SVS: elas se aplicam a ele todo.
- **Cadeia de valor (6 atividades)**:
  - planejar;
  - melhorar;
  - engajar;
  - projetar e fazer a transição: atender às expectativas de qualidade, custo e prazo;
  - **obter/construir**: componentes disponíveis quando e onde necessários e conforme especificação;
  - entregar e dar suporte.
- **4 dimensões**: organizações e pessoas; informação e tecnologia; parceiros e fornecedores; fluxos de valor e processos. Fatores externos: PESTLE.
- **7 princípios orientadores**: foco no valor; comece onde você está; progrida iterativamente com feedback; colabore e promova visibilidade; pense e trabalhe holisticamente; mantenha simples e prático; otimize e automatize (otimizar **antes** de automatizar).
- **34 práticas = 14 gerais + 17 de gerenciamento de serviços + 3 técnicas**.
  - Gerais: arquitetura, melhoria contínua, segurança da informação, conhecimento, medição e relatórios, mudança organizacional, **portfólio**, **projetos**, relacionamento, riscos, finanças de serviço, estratégia, fornecedores, força de trabalho e talentos.
  - Serviço: disponibilidade, análise de negócio, capacidade e desempenho, habilitação de mudanças, incidentes, **ativos de TI**, monitoramento e eventos, problemas, **liberação**, catálogo, configuração, **continuidade**, desenho de serviço, central de serviços, nível de serviço, requisições, validação e teste.
  - Técnicas: **implantação (deployment)**, infraestrutura e plataforma, desenvolvimento e gerenciamento de software.
- **Serviço**: meio de possibilitar a **cocriação de valor**, facilitando resultados desejados pelos clientes sem que eles gerenciem custos e riscos específicos. **Utilidade** = adequação ao propósito; **garantia** = adequação ao uso (disponibilidade, capacidade, segurança, continuidade).
- **Modelo de melhoria contínua (7 passos)**: qual é a visão? Onde estamos? Onde queremos estar? Como chegamos lá? Agir. Chegamos? Como manter o ritmo? O guia de implementação do COBIT 2019 tem 7 fases parecidas.

Fontes: AXELOS, *ITIL Foundation: ITIL 4 Edition* (2019). https://itsm.tools/34-itil-4-management-practices/ · https://purplegriffon.com/blog/general-management-practices-itil

## 6. ISO/IEC 38500:2024 (3ª edição)

- **Confirmado (prefácio, via prévia BSI/ISO e anúncio do SC 40)**: a edição de 2024 **cancela e substitui a de 2015**. Principais mudanças:
  1. os princípios de governança de TI foram **reelaborados e alinhados aos princípios de governança da ISO 37000**;
  2. o **modelo** foi atualizado para incluir **"engajar as partes interessadas"** (engage stakeholders), ao lado de avaliar, dirigir e monitorar;
  3. um **framework** de governança de TI foi atualizado a partir do **ISO/IEC TR 38502**.
- Escopo: princípios orientadores para **membros do órgão de governança** e para quem os apoia (inclusive gestores), sobre o uso eficaz, eficiente e aceitável da TI, atual e futuro. Vale para **todas as organizações** (públicas, privadas, governo, sem fins lucrativos). É norma de **orientação**, não de requisitos certificáveis. A governança de TI é tratada como parte (domínio) da governança organizacional.
- ISO 37000:2021 (governança de organizações): 11 princípios, sendo 1 primário (**propósito**), 4 fundamentais (geração de valor, estratégia, supervisão, accountability) e 6 habilitadores (engajamento de partes interessadas, liderança, dados e decisões, governança de riscos, responsabilidade social, viabilidade e desempenho ao longo do tempo). Resultados: desempenho eficaz, gestão responsável (stewardship) e comportamento ético.
- **Edição de 2015** (base da ABNT NBR ISO/IEC 38500:2018): **6 princípios** (responsabilidade, estratégia, aquisição, desempenho, conformidade, comportamento humano) e modelo **Avaliar-Dirigir-Monitorar**.

Fontes: https://committee.iso.org/sites/jtc1sc40/home/news/content-left-area/News/iso-iec-38500-2024-information-t.html · https://committee.iso.org/sites/jtc1sc40/home/projects/wg-1/published-wg1/content-left-area/isoiec-sc-40-wg-1-develops-the-s/white-paper-on-the-differences-b.html · https://webstore.ansi.org/preview-pages/BSI/preview_30426314.pdf · https://www.iso.org/standard/81684.html · https://standards.iteh.ai/catalog/standards/iso/4a0ca982-9f16-4acd-8a14-0a7a72c46416/iso-iec-38500-2024 · https://committee.iso.org/ISO_37000_Governance

## 7. PMBOK 8ª edição (PMI)

- Lançamento **digital em 13/11/2025** (impresso em jan/2026), em volume único com o *Standard for Project Management*. Há edição em português do Brasil (Perlego).
- **6 princípios**, **7 domínios de desempenho**, **5 áreas de foco** e **40 processos** apresentados de forma **não prescritiva**, com entradas, ferramentas e técnicas e saídas e orientação de adaptação (tailoring).
  - Princípios (rótulos variam nas fontes): visão holística; foco no valor; qualidade incorporada aos processos e entregas; liderança responsável (accountable); sustentabilidade integrada; cultura de equipes empoderadas.
  - Domínios: **Governança, Escopo, Cronograma, Finanças, Partes Interessadas, Recursos, Risco**.
  - Áreas de foco: **Iniciação, Planejamento, Execução, Monitoramento e Controle, Encerramento** (retomam os nomes dos grupos de processos, sem sequência rígida).
  - Vale para abordagens **preditivas, adaptativas e híbridas**.
- Segundo a página do PMI: mantém a base de princípios e domínios da 7ª edição, simplificada. A orientação por processos volta de forma evoluída e não prescritiva, e a cobertura de **IA, PMO e aquisições** foi ampliada.
- Comparação: 6ª edição = 10 áreas de conhecimento, 5 grupos de processos, 49 processos. 7ª = 12 princípios, 8 domínios (partes interessadas, equipe, abordagem de desenvolvimento e ciclo de vida, planejamento, trabalho do projeto, entrega, medição, **incerteza**), sem processos.
- **[não confirmado]** Distribuição dos 40 processos por domínio e área de foco: as fontes divergem (ex.: Governança 9, Escopo 6…). Não foi cobrada.

Fontes: https://www.pmi.org/standards/pmbok · https://www.projectmanagement.com/articles/1134510/pmi-launches-the-pmbok--guide---eighth-edition · https://www.4pmti.com/learn/what-is-pmbok-8th-edition/ · https://www.brainbok.com/blog/pmp/pmbok-guide-7th-vs-8th-edition-what-has-changed · https://blog.goldstandardcertifications.com/pmbok-8-focus-areas-process-groups · https://www.perlego.com/book/5473340/

## 8. Métodos ágeis em projetos de TI

- **Guia do Scrum (2020)**:
  - responsabilidades: Product Owner (maximizar valor; gerir e ordenar o Product Backlog; é uma pessoa, não um comitê), Scrum Master (eficácia do time; estabelecer o Scrum) e Developers (Sprint Backlog, qualidade pela Definição de Pronto). Time de 10 ou menos pessoas;
  - durante a Sprint, nenhuma mudança que ameace a Meta da Sprint; o escopo pode ser esclarecido e renegociado com o PO. **Só o PO pode cancelar a Sprint** (meta obsoleta);
  - eventos: Sprint ≤ 1 mês; Planning ≤ 8 h; Daily 15 min; Review ≤ 4 h; Retrospectiva ≤ 3 h;
  - compromissos: Product Backlog → **Meta do Produto**; Sprint Backlog → **Meta da Sprint**; Incremento → **Definição de Pronto**.
- **Kanban**: sistema puxado com **limite de WIP** e fluxo visualizado. Medidas: WIP, vazão (throughput), idade do item e tempo de ciclo. **Lei de Little** (fluxo estável): tempo médio de ciclo = WIP médio ÷ vazão média. Não prescreve papéis nem iterações.
- **Híbrido**: combina elementos preditivos (marcos, contrato, aprovações) e adaptativos (iterações e incrementos com feedback). Previsto no PMBOK 7/8 e no *Agile Practice Guide* (PMI/Agile Alliance, 2017).

Fontes: https://scrumguides.org/scrum-guide.html · https://kanbanguides.org/ · Little, J. D. C., *Operations Research*, 1961.

## 9. Contratações de TIC (Lei 14.133/2021)

- **Fases (art. 17)**: preparatória; divulgação do edital; propostas e lances; julgamento; habilitação; recursal; homologação. A habilitação pode anteceder propostas e julgamento por ato motivado, se prevista no edital (§1º). Forma eletrônica preferencial (§2º).
- **Fase preparatória (art. 18)**: compatível com o **PCA** (art. 12, VII) e com as leis orçamentárias. Inclui ETP, TR, orçamento, minutas e **análise de riscos** (inc. X).
  - **ETP** (art. 6º, XX) fundamenta o TR. Elementos no §1º (I a XIII). **Obrigatórios: I, IV, VI, VIII e XIII** (necessidade, quantidades, valor, parcelamento, posicionamento conclusivo). A falta dos demais, inclusive o **levantamento de mercado** (V), exige justificativa (§2º);
  - compra × locação: o ETP compara custos e benefícios (art. 44).
- **TR** (art. 6º, XXIII): objeto, fundamentação, descrição da solução considerando o ciclo de vida, requisitos, modelos de execução e gestão, medição e pagamento, seleção do fornecedor, estimativas e adequação orçamentária.
- **Matriz de riscos** (art. 6º, XXVII): cláusula que define riscos e responsabilidades e caracteriza o equilíbrio econômico-financeiro inicial. **Obrigatória** em obras e serviços de **grande vulto** e nos regimes de contratação **integrada e semi-integrada** (art. 22, §3º).
- **Modalidades (art. 28)**: pregão, concorrência, concurso, leilão e diálogo competitivo. Não se criam nem se combinam modalidades.
  - **pregão**: obrigatório para bens e serviços comuns, com critério menor preço ou maior desconto (art. 6º, XLI; art. 29). Não se aplica a serviços técnicos especializados de natureza predominantemente intelectual;
  - **diálogo competitivo** (art. 32): inovação tecnológica ou técnica, necessidade de adaptar soluções disponíveis, especificação impossível de definir com precisão. Prazos: 25 dias úteis para manifestação de interesse e 60 dias úteis para propostas. Comissão de pelo menos 3 servidores efetivos ou empregados permanentes.
- **Critérios (art. 33)**: menor preço; maior desconto; melhor técnica ou conteúdo artístico; técnica e preço; maior lance; maior retorno econômico.
  - **Técnica e preço** (art. 36): exige ETP que demonstre a relevância da qualidade técnica. Hipóteses incluem "**bens e serviços especiais de TIC**" (§1º, III). A proposta técnica vale **no máximo 70%** (§2º);
  - menor dispêndio pode considerar custos do ciclo de vida (art. 34, §1º).
- **Marca e prova de conceito** (art. 41): indicação de marca só excepcional e justificada (padronização, compatibilidade com plataformas adotadas…). **Amostra ou prova de conceito** pode ser exigida se prevista no edital.
- **Vigência**:
  - serviços e fornecimentos contínuos: até 5 anos (art. 106), prorrogáveis até 10 (art. 107);
  - **operação continuada de sistemas estruturantes de TI: até 15 anos** (art. 114).
- **Gestão e fiscalização**:
  - art. 7º: agentes preferencialmente efetivos e **segregação de funções**, vedada a atuação simultânea em funções mais suscetíveis a riscos (§1º);
  - art. 117: um ou mais fiscais designados, admitidos terceiros para **assisti-los e subsidiá-los**. O fiscal registra as ocorrências (§1º) e informa os superiores sobre o que excede sua competência (§2º);
  - art. 140: recebimento provisório e definitivo.
- **Governança**:
  - art. 11, parágrafo único: alta administração;
  - art. 169: **três linhas de defesa**. 1ª: agentes, licitação e autoridades; 2ª: assessoria jurídica e controle interno do órgão; **3ª: órgão central de controle interno e tribunal de contas**.
- **IN SGD/ME nº 94/2022** (SISP, **referência federal**; em 2026 ainda citada como vigente):
  - três fases: planejamento da contratação, seleção do fornecedor, gestão do contrato;
  - equipe de planejamento: integrantes requisitante, técnico e administrativo;
  - gestão: gestor do contrato (preferencialmente da área requisitante), fiscais técnico (área de TIC), requisitante e administrativo;
  - art. 3º, I: veda mais de uma solução de TIC em um único contrato (salvo art. 12, §§2º-3º);
  - art. 4º: quem provê a solução **não** pode ser quem a avalia, mensura ou apoia a fiscalização;
  - art. 5º, I: veda subordinação de empregados da contratada;
  - art. 6º: alinhamento ao PDTIC e à estratégia de governo digital.

Fontes: Lei 14.133/2021 (https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14133.htm) · https://www.gov.br/governodigital/pt-br/contratacoes-de-tic/legislacao/processo-de-contratacao-de-solucoes-de-tic-regido-pela-lei-ndeg-14-133-de-2021 · https://www.dti.cefetmg.br/procedimento-de-contratacao-de-tic/ · parecer referencial AGU (https://www.gov.br/agu/pt-br/composicao/procuradoria-geral-federal-1/subprocuradoria-federal-de-consultoria-juridica/equipe-de-licitacoes-e-contratos-elic-1/modelos-minutas-e-pareceres-1/pareceres-parametrizados-1/ID815710.docx) · https://cdn.cebraspe.org.br/concursos/CAPES_23/arquivos/PADRAORESPOSTA_947005A04___CARGO_5.PDF

## 10. Lei 14.129/2021 (Governo Digital)

- **Art. 2º**: aplica-se à administração direta federal (Executivo, Legislativo e Judiciário, **inclusive o TCU**, e MPU) e à indireta federal que preste serviço público. **Estados e Municípios só se adotarem os comandos por ato normativo próprio** (inc. III e §2º).
- **Art. 3º (princípios e diretrizes, 26 incisos)**: desburocratização e serviços digitais acessíveis por dispositivo móvel; plataforma única; transparência; linguagem clara; simplificação e autosserviço; **vedação de exigir prova de fato já comprovado** (XIII); **interoperabilidade e dados abertos** (XIV); **presunção de boa-fé** (XV); **permanência do atendimento presencial** conforme características, relevância e público-alvo do serviço (XVI); proteção de dados (LGPD); **governo como plataforma** (XXIII); tecnologias e formatos abertos.
- **Art. 4º (definições)**:
  - **autosserviço**: acesso a serviço digital sem mediação humana;
  - **Base Nacional de Serviços Públicos**;
  - **dados abertos**: formato aberto, legíveis por máquina, licença aberta;
  - **governo como plataforma**: infraestrutura tecnológica que facilita o uso de dados de acesso público e promove a interação entre agentes, para inovação, atividade econômica e serviços;
  - **laboratório de inovação**: espaço aberto à participação e à colaboração da sociedade;
  - **plataformas de governo digital**: ferramentas e serviços comuns, em regra centralizados e compartilhados;
  - registros de referência;
  - transparência ativa.
- **Processo eletrônico**: art. 6º (atos em meio eletrônico, com exceções); art. 7º (assinatura eletrônica proporcional ao risco); **art. 8º**: ato tempestivo até **23h59** do último dia (Brasília). Se o sistema ficar indisponível por motivo técnico, o prazo **prorroga-se automaticamente até 23h59 do 1º dia útil seguinte à resolução** (§2º).
- **Art. 14**: tecnologias de amplo acesso, sem prejuízo do atendimento presencial, preferencialmente por autosserviço. **Art. 15**: a ENGD, editada pelo Executivo federal, observa os princípios do art. 3º.
- **Componentes**: Base Nacional de Serviços Públicos, Cartas de Serviços ao Usuário e Plataformas de Governo Digital. Estas têm, no mínimo, ferramenta de solicitação e acompanhamento e **painel de monitoramento de desempenho** (art. 20).
- **Número suficiente para identificação** (seção própria): **CPF ou CNPJ basta** para identificar o cidadão ou a pessoa jurídica nos bancos de dados de serviços públicos, com inscrição gratuita. Os cadastros devem ter campo para o número, vedada a exigência de outro número para esse fim.
- Capítulos sobre governo como plataforma (abertura de dados, interoperabilidade), **laboratórios de inovação** (resultados de uso livre, com licenças livres não restritivas) e governança, gestão de riscos, controle e auditoria.
- **[cautela]** A numeração dos artigos sobre CPF, laboratórios e governança (provavelmente arts. 27–28, 44–45 e 47–49) não foi conferida no texto integral. As questões citam a seção ou o capítulo, não o número.

Fonte: Lei 14.129/2021 (https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14129.htm). Texto não lido na íntegra neste ambiente; dispositivos citados nas questões limitados aos de redação bem conhecida.

## 11. ENGD 2024–2027 (Decreto 12.069, de 21/06/2024, DOU 24/06/2024)

**Lido na íntegra** (espelho do Planalto no GitHub: `arthrod/planalto_dot2dict`, `legislacao_expandida/html/DEC_12069_2024.html`). Fundamento: arts. 15 e 16 da Lei 14.129/2021.

- **Art. 2º**: a ENGD articula e direciona as estratégias de transformação digital da União, dos Estados, do DF e dos Municípios, observado o art. 2º da Lei 14.129. **Art. 3º**: contribuir para os ODS (Agenda 2030).
- **Art. 4º (definições)**:
  - **governo digital**: abordagem de gestão voltada à transformação das organizações públicas, apoiada em tecnologias digitais, para entregar valor público;
  - **transformação digital de governo**;
  - **infraestruturas públicas digitais (IPD)**: soluções estruturantes de aplicação transversal, com padrões de rede para o interesse público, princípios de **universalidade e interoperabilidade**, uso por setores público e privado, integrando canais físicos e digitais.
- **Art. 5º**: integra o marco da Lei 14.129 (art. 15) e da E-Digital (Decreto 9.319/2018, eixo "cidadania e transformação digital do Governo").
- **Art. 6º**: **reeditada a cada quatro anos**, com vigência coincidente com o **PPA**, e **revista ao menos dois anos após sua edição**. A SGD/MGI articula, com participação de entes, sociedade civil, academia e setor privado.
- **Art. 8º, objetivo geral**: "Estado mais **inclusivo, eficaz, proativo, participativo e sustentável**", por meio de três vias:
  - soluções que reconheçam desigualdades e barreiras de acesso;
  - adaptação de processos com inovação, tecnologia, reúso seguro de dados e melhor aplicação de recursos;
  - transparência, acesso à informação, participação social e desenvolvimento sustentável.
- **Art. 9º, 10 objetivos específicos**:
  1. gestão e governança com colaboração federativa;
  2. serviços inclusivos, acessíveis e proativos, em canais integrados, atentos à experiência do usuário;
  3. **identificação única e nacional associada à Carteira de Identidade Nacional**;
  4. resiliência e maturidade tecnológica (privacidade, proteção de dados, segurança da informação e cibernética);
  5. reúso constante e ético de dados (análises, interoperabilidade, personalização);
  6. infraestrutura moderna, segura, escalável e robusta, com sustentabilidade;
  7. ecossistema de inovação e tecnologias emergentes;
  8. eficiência por racionalização e compartilhamento de soluções;
  9. abertura e transparência;
  10. **competências** em governo digital e inovação (atração e retenção de talentos).
- **Art. 10, prioridades 2024–2027**:
  - estratégias de governo digital em todos os entes;
  - autenticação gov.br e Serviço de Identificação do Cidadão;
  - apoio aos Municípios (Estados, consórcios etc.);
  - processo administrativo eletrônico baseado no **Processo Eletrônico Nacional**;
  - capacitação continuada;
  - saúde e educação;
  - compartilhamento seguro de dados (LGPD).
- **Rede Gov.br**:
  - natureza colaborativa e **adesão voluntária** (art. 11). Governança: SGD, órgão colegiado consultivo (art. 19) e entes aderentes (art. 12);
  - a SGD edita **recomendações e iniciativas prioritárias** (art. 13, III; 1ª versão pelo art. 20);
  - quem adere pode acessar **gratuitamente** ferramentas da Plataforma gov.br e as IPD, quando disponíveis, e se compromete a **publicar estratégia própria em consonância com a ENGD** e a **seguir as recomendações** (art. 15, §1º).
- IPD (arts. 16–18): universalização, padrões interoperáveis e seguros, compartilhamento seguro de dados, integração de canais e mapeamento prévio de riscos. **IPD de Identificação Civil** = Serviço de Identificação do Cidadão + Plataforma gov.br.
- **Art. 21**: o Executivo federal publicaria, em **90 dias**, a **Estratégia de Governo Digital da administração pública federal** 2024–2027. Ela veio como **Estratégia Federal de Governo Digital (EFGD), Decreto 12.198/2024**, segundo os PTDs oficiais. Os **seis princípios** ("governo centrado no cidadão e inclusivo; integrado e colaborativo; inteligente e inovador; confiável e seguro; transparente, aberto e participativo; eficiente e sustentável") são da **EFGD**, e não constam do Decreto 12.069.
- **Art. 23**: revogou dispositivos do Decreto 10.332/2020 (EGD 2020–2022) e do Decreto 11.260/2022. Vigência na publicação (art. 24).
- **Recomendações vigentes**: Portaria SGD/MGI nº 4.248/2024 (1ª versão), substituída pela **Portaria SGD/MGI nº 5.395, de 01/07/2026**: 10 objetivos com recomendações a todos os entes e diretrizes sobre **IA** (governança proporcional ao risco, mapeamento de casos de uso). Há tabela comparativa oficial 2024 × 2026. **[parcialmente confirmado: notícia e URL oficial da tabela; texto não lido]**. Não virou gabarito.

Fontes: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/decreto/d12069.htm · https://www2.camara.leg.br/legin/fed/decret/2024/decreto-12069-21-junho-2024-795831-publicacaooriginal-172182-pe.html · https://atlaspublico.com.br/noticias/governo-atualiza-recomendacoes-da-estrategia-nacional-de-66782 · https://www.gov.br/governodigital/pt-br/estrategias-e-governanca-digital/estrategianacional/revisao_engd_2026/engd_tabela_comparativa_2024_2026.pdf · https://www.gov.br/governodigital/pt-br/estrategias-e-governanca-digital/planos-de-transformacao-digital/ptds-vigentes/mgi_ptd_2025_2027_docdiretivo_repactuacao_assinado-copia_tarjada.pdf

---

## Pontos de cautela (onde a banca e os materiais erram)

1. **ISO/IEC 38500:2024 não é a de 2015.** Os "6 princípios (responsabilidade… comportamento humano)" e o modelo apenas Avaliar-Dirigir-Monitorar são da 2ª edição (2015, base da ABNT NBR ISO/IEC 38500:2018). A 3ª edição alinhou os princípios à ISO 37000 e incluiu "engajar as partes interessadas". Fontes secundárias divergem sobre a **contagem** de princípios da 2024 (11 ou 12) e muitos sites ainda listam os seis antigos. **Não cobrar número de princípios da 2024.** A norma é de orientação, não certificável.
2. **PMBOK 8 ≠ 7 ≠ 6.** 8ª: 6 princípios, 7 domínios (com **Risco** e **Finanças**), 5 áreas de foco, 40 processos não prescritivos. 7ª: 12 princípios, 8 domínios (com **Incerteza** e **Medição**), sem processos. 6ª: 10 áreas, 5 grupos, 49 processos. Os rótulos exatos dos princípios da 8ª variam nas traduções: cobrar a ideia, não o rótulo. Não cobrar a distribuição dos 40 processos.
3. **ITIL 4 × ITIL v3 × ITIL (Version 5).**
   - "Funções", "ciclo de vida (estratégia, desenho, transição, operação, melhoria)" e "portfólio = funil + catálogo + desativados" são do v3;
   - no ITIL 4, "change control" (Foundation 2019) virou **change enablement**, e o CAB não é obrigatório;
   - a PeopleCert lançou o **ITIL Version 5** em jan–fev/2026 (ciclo de vida de produto e serviço, foco em IA). O edital cobra **ITIL 4**: nomeie a versão e não diga que o ITIL 4 é "a versão mais recente".
4. **COBIT 2019 × COBIT 5.**
   - 6 + 3 princípios (não 5); 40 objetivos (não 37 processos); "componentes" (não "habilitadores"); "metas de alinhamento" (não "metas relacionadas à TI"); 13 + 13 metas (não 17 + 17);
   - escala CMMI (não ISO/IEC 15504/33000);
   - **MEA é gestão**, e EDM é a única governança;
   - capacidade vale para **processos**, maturidade para **áreas de foco**.
5. **Fator "papel da TI"**: fábrica (crítica para operar, não para inovar) × reviravolta (inovação sem dependência operacional crítica) é a armadilha clássica.
6. **ENGD × EFGD.** O Decreto 12.069/2024 (nacional, Rede Gov.br, adesão voluntária) **não lista "princípios"**: tem objetivo geral, 10 objetivos específicos e 7 prioridades. Os seis princípios "governo centrado no cidadão e inclusivo…" são da estratégia **federal** (Decreto 12.198/2024). Também não confundir com a EGD 2020–2022 (Decreto 10.332/2020).
7. **Lei 14.129 em Estados**: só se aplica a Estados e Municípios que a adotarem por ato normativo próprio. **Não foi verificado** se Goiás adotou, então as questões usam órgão federal ou "ente que adotou a lei".
8. **IN SGD/ME 94/2022** vale para o SISP (Executivo federal). Para o TCE-GO e jurisdicionados estaduais, é **referência de boas práticas**, não norma cogente. A IN 01/2019 foi substituída e não deve ser cobrada.
9. **Lei 14.133**:
   - técnica e preço com no máximo **70%** para a técnica;
   - matriz de riscos obrigatória só em grande vulto ou contratação integrada e semi-integrada;
   - sistemas estruturantes de TI até **15 anos**;
   - tribunal de contas na **3ª linha**;
   - terceiros apenas **assistem** o fiscal;
   - **5 modalidades** (tomada de preços e convite extintos);
   - valores de dispensa são atualizados anualmente por decreto: não foram cobrados.
10. **Incidente × problema × erro conhecido × workaround** e **ativo × IC**: as trocas de rótulo são a pegadinha mais frequente. Catálogo de serviços ≠ portfólio ≠ CMDB.
11. **Continuidade**: RTO < MTPD. O RPO mede **perda de dados** e não tempo de retorno. Continuidade cuida de desastre; disponibilidade, da operação normal.
12. **TCE-GO**: nenhum fato sobre estrutura, sistemas ou adesões do Tribunal foi afirmado. Os cenários são hipotéticos.
