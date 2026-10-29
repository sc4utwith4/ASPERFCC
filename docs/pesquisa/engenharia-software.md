# Pesquisa — Engenharia de Software (TCE-GO 2026, Técnico de Controle Externo — TI)

Data: 28/10/2026. Buscas WebSearch usadas: 7 de 8. O conteúdo é sobretudo de livro-texto e de guias oficiais; as buscas serviram para confirmar versões e definições voláteis. O que não foi confirmado na sessão está marcado como "conhecimento prévio".

Edital (Anexo II): fundamentos e ciclo de vida; abordagens preditiva, iterativa, incremental e adaptativa/ágil e combinações; Scrum, Kanban, Lean e XP; requisitos funcionais e não funcionais; histórias de usuário, casos de uso e critérios de aceite; camadas, SOA, microsserviços e eventos; SOLID, DRY, KISS, YAGNI, coesão e acoplamento; UML e BPMN; padrões de projeto; qualidade (desempenho, escalabilidade, disponibilidade, confiabilidade, manutenibilidade); testes (unitário, integração, funcional, regressão, carga, estresse, automação); revisão de código, refatoração e dívida técnica. Fora de escopo: LLMs, agentes e MCP (matéria vizinha).

## 1. Fatos por subtópico

### Fundamentos e ciclo de vida
- Cascata: fases sequenciais, cada uma inicia após a aprovação da anterior; adequado a requisitos estáveis. Modelo em V: cada fase de desenvolvimento tem um nível de teste correspondente.
- Incremental (Pressman): entregas operacionais sucessivas; o 1º incremento costuma ser o núcleo do produto.
- Espiral (Boehm, 1988): orientado a riscos; cada volta tem objetivos/alternativas, avaliação e redução de riscos, desenvolvimento e verificação, planejamento da volta seguinte.
- Prototipação: descartável (esclarece/valida requisitos e é jogada fora) × evolutiva (refinada até virar o produto). Sommerville, cap. 2.

### Abordagens preditiva, iterativa, incremental e adaptativa
- Agile Practice Guide (PMI/Agile Alliance, 2017), cap. 3, Tabela 3-1: preditivo (requisitos fixos, atividades uma vez, entrega única, foco em custo); iterativo (requisitos dinâmicos, atividades repetidas até acertar, entrega única, foco na correção da solução); incremental (atividades uma vez por incremento, entregas menores e frequentes, foco em velocidade); ágil (repete e incrementa, entregas frequentes, foco em valor ao cliente). Híbrido = combinação. PMBOK 7 chama a abordagem ágil de "adaptativa".

### Scrum (Guia do Scrum, nov/2020, tradução PT-BR oficial em scrumguides.org)
- Time Scrum: Product Owner, Scrum Master e Developers; tipicamente 10 pessoas ou menos; sem subtimes nem hierarquia; multifuncional e autogerenciável.
- PO: maximizar o valor; é uma pessoa, não um comitê; gere o Product Backlog (Meta do Produto, itens, ordenação, transparência); pode delegar, mas continua responsável. Só o PO pode cancelar a Sprint (quando a Meta da Sprint fica obsoleta).
- SM: responsável pela eficácia do Time Scrum; líder que serve.
- Developers: criam o plano da Sprint (Sprint Backlog), instilam qualidade aderindo à Definição de Pronto, adaptam o plano diariamente, responsabilizam-se mutuamente.
- Eventos (5): Sprint (até 1 mês, contêiner), Sprint Planning (até 8 h para Sprint de 1 mês; tópicos por quê/o quê/como), Daily Scrum (15 min, para os Developers), Sprint Review (até 4 h), Sprint Retrospective (até 3 h; encerra a Sprint). Refinamento é atividade contínua, não evento. Timeboxes de 8 h e 4 h confirmados por fontes secundárias na busca.
- Artefatos e compromissos: Product Backlog → Meta do Produto; Sprint Backlog → Meta da Sprint; Incremento → Definição de Pronto.
- Item que não atende à DoD não pode ser liberado nem apresentado na Sprint Review; volta ao Product Backlog. DoD organizacional vale como mínimo. Vários Incrementos podem ser criados e entregues antes do fim da Sprint; a Review não é "portão" de liberação.

### Kanban, Lean e XP
- Kanban Guide (2020, kanbanguides.org): práticas — definir e visualizar o fluxo, gerenciar ativamente os itens, melhorar o fluxo; métricas mínimas — WIP, vazão (throughput), idade do item (work item age), tempo de ciclo (cycle time). Não prescreve papéis nem iterações de duração fixa. Limite de WIP → sistema puxado.
- Lei de Little (sistema estável): tempo médio de ciclo = WIP médio ÷ vazão média.
- Lean Software Development (Poppendieck, 2003; 22 "ferramentas de pensamento"): eliminar desperdícios; amplificar o aprendizado; decidir o mais tarde possível; entregar o mais rápido possível; empoderar a equipe; construir integridade; ver o todo. (Lista confirmada parcialmente na busca; nomes completos por conhecimento prévio.)
- XP (Beck, 1ª ed.): jogo do planejamento, pequenos releases, metáfora, design simples, testes (test-first/TDD), refatoração, programação em par, propriedade coletiva, integração contínua (várias vezes ao dia), semana de 40 h/ritmo sustentável, cliente presente, padrões de codificação. Valores: comunicação, simplicidade, feedback, coragem e respeito (2ª ed.). YAGNI vem do XP.

### Engenharia de requisitos (Sommerville, cap. 4)
- Funcional: serviço/comportamento. Não funcional: restrição/qualidade (produto, organizacional, externo/legal); falha em RNF pode inutilizar o sistema; deve ser verificável (mensurável).
- Elicitação: entrevista, observação/etnografia (conhecimento tácito; fraca para inovação), cenários, workshops (JAD), prototipação. Validação: validade, consistência, completude, realismo, verificabilidade; técnicas: revisões, protótipos, geração de casos de teste.
- Verificação ("construindo o produto corretamente?") × validação ("construindo o produto certo?") — Boehm.
- Gerência: baseline, pedido de mudança, análise de impacto apoiada por rastreabilidade (bidirecional), decisão de comitê de controle de mudanças.

### Histórias de usuário, casos de uso e critérios de aceite
- Formato Connextra "Como <papel>, quero <objetivo>, para <benefício>". 3 Cs (Ron Jeffries): cartão, conversa, confirmação. INVEST (Bill Wake, 2003): Independente, Negociável, Valiosa, Estimável, Pequena (Small), Testável.
- Critério de aceite em Gherkin/BDD: Dado (contexto) / Quando (ação/evento) / Então (resultado observável).
- UML: «include» = comportamento obrigatório comum; seta do caso base para o incluído. «extend» = comportamento opcional/condicional em ponto de extensão; seta do caso que estende para o caso base.

### Arquitetura
- Camadas: fechadas (estritas) só usam a camada imediatamente inferior; camada lógica (layer) ≠ camada física (tier).
- SOA: serviços corporativos reutilizáveis, contratos, frequentemente com ESB. Microsserviços (Lewis & Fowler, 2014): implantação independente, organização por capacidades de negócio, "smart endpoints and dumb pipes", governança e dados descentralizados (banco por serviço), automação de infraestrutura, design para falhas. Trade-off: consistência eventual; transações distribuídas via saga (transações locais + compensações, sem isolamento ACID entre serviços).
- Eventos: pub/sub desacopla produtor de consumidores (inclusive no tempo); vários assinantes recebem o mesmo evento; entrega "pelo menos uma vez" exige consumidores idempotentes; consistência eventual.

### SOLID, DRY, KISS, YAGNI, coesão e acoplamento
- SRP (um motivo para mudar), OCP (aberto para extensão, fechado para modificação — Meyer), LSP (subtipos substituíveis sem quebrar clientes — Liskov), ISP (cliente não depende de métodos que não usa), DIP (módulos de alto e baixo nível dependem de abstrações).
- DRY (Hunt & Thomas): todo conhecimento com representação única, inequívoca e autorizada. KISS: simplicidade. YAGNI: não implementar por antecipação. Meta: alta coesão, baixo acoplamento.

### UML e BPMN
- UML 2.5.1 (OMG, 2017): 14 diagramas. Estruturais (7): classes, objetos, componentes, estrutura composta, pacotes, implantação, perfil. Comportamentais (7): casos de uso, atividades, máquina de estados e interação (sequência, comunicação, visão geral de interação, tempo).
- BPMN 2.0.2 (= ISO/IEC 19510:2013): eventos (início, intermediário, fim), atividades (tarefa, subprocesso), gateways (exclusivo — um caminho; inclusivo — um ou mais, convergência espera só os ativados; paralelo — todos; baseado em eventos; complexo). Fluxo de sequência só dentro de uma pool (pode cruzar lanes); fluxo de mensagem só entre pools (participantes).

### Padrões de projeto (GoF, 1994: 23 padrões)
- Criacionais (5): Abstract Factory, Builder, Factory Method, Prototype, Singleton.
- Estruturais (7): Adapter, Bridge, Composite, Decorator, Facade, Flyweight, Proxy.
- Comportamentais (11): Chain of Responsibility, Command, Interpreter, Iterator, Mediator, Memento, Observer, State, Strategy, Template Method, Visitor.

### Atributos de qualidade
- ISO/IEC 25010:2023 (2ª ed., nov/2023): 9 características — adequação funcional, eficiência de desempenho, compatibilidade, capacidade de interação, confiabilidade, segurança, manutenibilidade, flexibilidade e proteção (safety). Confirmado na busca: 9 características, 2ª edição. Subcaracterísticas (conhecimento prévio): confiabilidade → isenção de falhas (antes "maturidade"), disponibilidade, tolerância a falhas, recuperabilidade; manutenibilidade → modularidade, reusabilidade, analisabilidade, modificabilidade, testabilidade.
- Disponibilidade = MTBF/(MTBF+MTTR). Série: produto das disponibilidades. Paralelo (redundância ativa): 1 − Π(1 − Ai). 99,9% em mês de 30 dias = 43,2 min; ao ano (365 d) = 8,76 h. Contas conferidas por script (python3).

### Testes
- Pirâmide (Cohn, 2009): muitos testes de unidade na base, poucos de ponta a ponta/UI no topo. Carga (carga esperada/pico) × estresse (além da capacidade, ponto de ruptura e recuperação). Regressão: reexecução após mudança. Caixa-preta (especificação: partição de equivalência, valor-limite) × caixa-branca (estrutura: comandos, decisões). 100% de decisões ⇒ 100% de comandos; o inverso não vale (ISTQB CTFL 4.0).
- TDD (Beck): vermelho → verde → refatorar, teste primeiro. BDD (Dan North): comportamento em linguagem de negócio, Dado/Quando/Então.

### Revisão de código, refatoração e dívida técnica
- Refatoração (Fowler, 2ª ed., 2018): mudança na estrutura interna para facilitar entendimento e modificação, sem alterar o comportamento observável. Maus cheiros: código duplicado, função longa, classe grande, inveja de recursos (feature envy → mover função), cirurgia com espingarda (shotgun surgery), generalidade especulativa etc.
- Dívida técnica: Cunningham (1992). Quadrante de Fowler (2009): deliberada × inadvertida e imprudente × prudente ("agora sabemos como deveríamos ter feito" = inadvertida e prudente).
- Revisão: inspeção formal (Fagan, papéis definidos), walkthrough, revisão por pares em pull request, programação em par como revisão contínua.

## 2. Fontes
- Schwaber & Sutherland, *Guia do Scrum* (2020), versão PT-BR — https://scrumguides.org/docs/scrumguide/v2020/2020-Scrum-Guide-PortugueseBR-3.0.pdf
- Vacanti & Coleman, *The Kanban Guide* (2020) — https://kanbanguides.org
- Kanban University, definição de lead time — https://kanban.university/tag/lead-time/
- Poppendieck, *Lean Software Development: An Agile Toolkit* (2003) — https://www.oreilly.com/library/view/-/0321150783/
- ISO/IEC 25010:2023 — https://www.iso.org/standard/78176.html
- Sommerville, *Engenharia de Software*, 10ª ed.; Pressman & Maxim, *Engenharia de Software*, 9ª ed.; Beck, *Extreme Programming Explained*; Fowler, *Refactoring* (2ª ed.); Gamma et al., *Design Patterns* (1994); OMG UML 2.5.1 e BPMN 2.0.2; PMI, *Agile Practice Guide* (2017); Lewis & Fowler, "Microservices" (2014); Cohn, *Succeeding with Agile* (2009); ISTQB CTFL 4.0.

## 3. Pontos de cautela
- **Lead time × cycle time**: não há definição única. O Kanban Guide (2020) só define cycle time (início → fim). A Kanban University revisou sua definição de lead time (compromisso → entrega × pedido → recebimento). Nas questões, usar a acepção usual (lead time desde o pedido; cycle time desde o início do trabalho) e deixá-la explícita.
- **ISO/IEC 25010**: a edição 2023 renomeou características (usabilidade → capacidade de interação; portabilidade → flexibilidade) e criou "proteção" (safety). Cobrar só o que vale nas duas edições (disponibilidade, tolerância a falhas e recuperabilidade sob confiabilidade) ou nomear a edição.
- **Lean**: o livro de 2006 reformula a lista (construir qualidade, criar conhecimento, adiar comprometimento, respeitar as pessoas, otimizar o todo). Nomear a obra de 2003.
- **Scrum 2020**: "Developers" substituiu "Time de Desenvolvimento"; "responsabilidades" (accountabilities) substituiu "papéis"; Definition of Ready não existe no Guia; refinamento não é evento.
- **XP**: as práticas mudam entre a 1ª e a 2ª edição; cobrar as consagradas (TDD, par, CI, refatoração, pequenos releases, design simples).
- **Disponibilidade**: deixar explícita a base (mês de 30 dias × ano de 365 dias).
