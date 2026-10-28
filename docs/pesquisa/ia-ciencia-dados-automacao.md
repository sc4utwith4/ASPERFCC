# Pesquisa — Inteligência Artificial, Ciência de Dados e Automação (`ia-ciencia-dados-automacao`)

Sessão de 28/10/2026. Foram feitas 9 buscas na web (teto: 12) e 2 downloads do GitHub (Apache Hadoop e Apache Spark). O conteúdo consolidado de livro-texto (ML, redes neurais, PLN, estatística) vem das referências clássicas citadas por subtópico. As contas das questões e da nota Cornell foram conferidas por script em Python.

## Fatos voláteis e institucionais (verificados nesta sessão)

### EBIA × PBIA × marco legal
- **EBIA**: instituída pela **Portaria MCTI nº 4.617, de 6/4/2021**, cujo anexo foi alterado pela **Portaria MCTI nº 4.979, de 13/7/2021**. Tem **9 eixos temáticos**:
  - **3 transversais**: legislação, regulação e uso ético; governança de IA; aspectos internacionais.
  - **6 verticais**: educação/qualificação para um futuro digital; força de trabalho e capacitação; pesquisa, desenvolvimento, inovação e empreendedorismo; aplicação nos setores produtivos; aplicação no poder público; segurança pública.
  - Tem 6 objetivos, entre eles princípios éticos, investimento em P&D, remoção de barreiras à inovação, formação de profissionais, projeção internacional e cooperação público-privada. O TCU fez acompanhamento da execução da EBIA.
  - Fontes: DOU de 15/7/2021 (Portaria 4.979); documento do Senado; artigo E-legis (Câmara); relatório de acompanhamento do TCU.
- **PBIA 2024–2028, "IA para o Bem de Todos"**: prevê cerca de **R$ 23 bilhões** (R$ 23,03 bi em algumas fontes) e tem **5 eixos**, cobrindo infraestrutura e desenvolvimento de IA; difusão, formação e capacitação; IA para melhoria dos serviços públicos; IA para inovação empresarial; e apoio ao processo regulatório e de governança da IA. Não é lei: é um plano do Executivo federal.
  - **Títulos exatos dos eixos: não confirmados nesta sessão no documento oficial.** As fontes secundárias divergem quanto ao 5º eixo, que aparece como "regulamentação" ou como "governança".
  - Fontes: dplnews.com, teletime.com.br, regulations.ai, Cetic.br (PSI a. 18, n. 1).
- **PL 2.338/2023 (marco legal da IA)**: aprovado pelo Senado (dez/2024) e enviado à Câmara (mar/2025). Na Câmara, a comissão especial é presidida pela dep. Luísa Canziani, com relatoria do dep. Aguinaldo Ribeiro. A votação foi adiada várias vezes (dez/2025 → fev/2026 → jun/2026). As fontes mais recentes falam em deixá-la para depois das eleições de out/2026, e a ficha da Câmara indicava "Aguardando Parecer do Relator". **Não é lei.** Por ser volátil, **nenhuma questão depende do PL**.

### Autoridade nacional (LGPD)
- A **MP nº 1.317, de 17/9/2025**, transformou a ANPD em **Agência Nacional de Proteção de Dados** (mesma sigla), autarquia de natureza especial vinculada ao Ministério da Justiça e Segurança Pública. O Senado aprovou o PLV em 24/2/2026.
- O relatório anual 2025 da ANPD indica conversão na **Lei nº 15.352/2026**. **O número e o texto da lei não foram conferidos no Planalto nesta sessão.** As questões usam "autoridade nacional (ANPD)", que é a expressão da LGPD.

### Governança e ética
- **Princípios de IA da OCDE** (2019, atualizados em **maio/2024**): 5 princípios baseados em valores:
  1. crescimento inclusivo, desenvolvimento sustentável e bem-estar;
  2. respeito ao Estado de Direito, aos direitos humanos e aos valores democráticos, incluindo equidade e privacidade;
  3. transparência e explicabilidade;
  4. robustez, segurança e proteção (*safety*);
  5. responsabilização (*accountability*).
  - A recomendação traz ainda 5 recomendações aos governos. A revisão de 2024 tratou de IA generativa, integridade da informação e sustentabilidade. Fonte: oecd.ai/en/ai-principles.
- **ISO/IEC 42001:2023**: requisitos para estabelecer, implementar, manter e melhorar continuamente um **sistema de gestão de IA (AIMS)** em uma organização. Segue a estrutura harmonizada das normas de sistema de gestão (ciclo de melhoria contínua). O Anexo A tem **38 controles**, e o Anexo B traz orientação de implementação. Há declaração de aplicabilidade e avaliação de impacto de sistemas de IA.
  - **Versão ABNT NBR: não confirmada nesta sessão.**
- **TCE-GO**: a RA 24/2024 (uso de IA) e a LC-GO 205/2025 são usadas apenas com os fatos de `_normativos-tce-go.md`: precisão e veracidade, proteção de dados, adoção responsável, revisão humana de decisões automatizadas na administração estadual, NEI-IA e sandbox.

### Big Data (fontes primárias no GitHub)
- `apache/hadoop`, `hdfs-default.xml`: `dfs.blocksize` = 134217728 (**128 MB**) e `dfs.replication` = **3**.
- `apache/spark`, README: "unified analytics engine for large-scale data processing", com Spark SQL, pandas API on Spark, MLlib, GraphX e **Structured Streaming**.

## Conteúdo consolidado por subtópico (fontes de referência)

| Subtópico | Pontos usados nas questões | Fontes |
|---|---|---|
| Fundamentos de IA | 4 abordagens (agir/pensar como humano, racionalmente); Teste de Turing (1950); IA simbólica × conexionista; sistemas especialistas (base de conhecimento + motor de inferência; encadeamento para frente × para trás); termo cunhado na proposta de Dartmouth (1955/1956) | Russell & Norvig, *IA*, 4ª ed., caps. 1–2; Turing (1950) |
| Aprendizado | supervisionado (classificação × regressão), não supervisionado (k-means, PCA), reforço (agente, ambiente, recompensa, política); overfitting × underfitting; regularização; treino/validação/teste; validação cruzada; vazamento de dados | Géron, *Mãos à obra*; Sutton & Barto (2018); scikit-learn, "Common pitfalls" e "Cross-validation" |
| Redes neurais | perceptron e XOR (Minsky & Papert, 1969); ReLU, sigmoide, tanh, softmax; retropropagação (regra da cadeia); gradiente descendente e taxa de aprendizado; CNN; RNN/LSTM (portas); Transformer (autoatenção, paralelismo) | Goodfellow et al., *Deep Learning* (2016); Hochreiter & Schmidhuber (1997); Vaswani et al. (2017) |
| PLN | tokenização (inclusive por subpalavras); stemming × lematização; stopwords; embeddings estáticos (word2vec) × contextuais (BERT); NER; análise de sentimento | Jurafsky & Martin, *SLP* 3ª ed.; Mikolov et al. (2013); Devlin et al. (2019) |
| IA generativa e agentes | LLM prevê o próximo token; temperatura; alucinação; fine-tuning × RAG; tipos de agente (reativo simples, baseado em modelo, em objetivos, em utilidade, com aprendizado); modelos multimodais | Russell & Norvig, cap. 2; Lewis et al. (2020) |
| Prompts e RAG | zero-shot, few-shot (aprendizado em contexto), cadeia de raciocínio, papel, delimitadores, formato de saída; engenharia de contexto (o que entra na janela); RAG (chunking, embeddings, banco vetorial, recuperação, geração com citação) | Brown et al. (2020); Wei et al. (2022); Lewis et al. (2020) |
| Aplicações e automação | RPA (regras, interface, dados estruturados) × IA (dados não estruturados, probabilística); automação inteligente; detecção de anomalias não supervisionada como indício, não prova; limiar de confiança com humano no circuito | van der Aalst et al. (2018), *BISE*; Liu et al. (2008), Isolation Forest |
| Ética e governança | XAI local × global; LIME (modelo substituto local) × SHAP (valores de Shapley); vieses histórico, de representação e por *proxy*; viés de automação; supervisão humana | Ribeiro et al. (2016); Lundberg & Lee (2017); OCDE (2024); ISO/IEC 42001:2023 |
| LGPD aplicada à IA | art. 5º II (sensíveis), XI (anonimização); art. 6º (finalidade, necessidade, não discriminação); arts. 7º, 11 e 23 (bases legais; poder público); art. 12 (dado anonimizado e reversão); art. 13, § 4º (pseudonimização); **art. 20** (revisão de decisão automatizada; critérios, ressalvado o segredo comercial e industrial; auditoria da autoridade nacional) | Lei 13.709/2018 |
| Ciência de dados | CRISP-DM (6 fases); valores ausentes (mediana × média); duplicatas; outliers (Tukey, 1,5 × IIQ); min-max × z-score | Chapman et al. (2000), CRISP-DM 1.0; Tukey (1977) |
| Estatística e avaliação | média, mediana, moda; correlação × causalidade (r e r²); matriz de confusão; precisão, revocação, F1 (média harmônica), acurácia; ROC/AUC; MAE × RMSE | Montgomery & Runger; scikit-learn, "Model evaluation" |
| Big Data | 3 Vs de Laney (2001): volume, velocidade, variedade; modelos de 5 Vs acrescentam veracidade e valor; HDFS, MapReduce, YARN, Spark; batch × streaming; data lake (schema-on-read) × data warehouse (schema-on-write, Inmon) | Laney (2001); Dean & Ghemawat (2004); Zaharia et al. (2012) |

## Contas conferidas por script (python3)
- Matriz VP = 40, FP = 10, FN = 20, VN = 930: precisão 0,80; revocação 0,6667; F1 0,7273; acurácia 0,97; especificidade 0,9894; média aritmética de P e R 0,7333 (distrator).
- Nota Cornell, VP = 45, FP = 15, FN = 5, VN = 935: P = 0,75; R = 0,90; F1 = 0,8182; acurácia 0,98; o classificador "tudo negativo" teria 0,95. Com limiar mais alto (VP = 35, FP = 5, FN = 15, VN = 945): P = 0,875; R = 0,70; F1 = 0,7778.
- Série 5, 3, 40, 2, 6, 3, 4: média 9; mediana 4; moda 3. Sem ordenar, o elemento central seria 2 (distrator).
- Erros (2, −2, 2, −2) × (0, 0, 0, 8): MAE 2 nos dois; RMSE 2 × 4; MSE de B = 16; erro médio de A = 0.
- Valor 70 com mín. 20, máx. 120, média 50 e desvio-padrão 10: min-max 0,5 e z = 2,0. Distratores: 0,7; 0,583; 0,2.
- Q1 = 200 e Q3 = 360: IIQ 160; limite superior 600 e inferior −40. Com 1 × IIQ o limite seria 520; com 3 × IIQ, 840.
- r = 0,8: r² = 0,64.

## Pontos de cautela
- **EBIA**: o nome do 1º eixo vertical varia entre fontes ("Educação" × "Qualificações para um futuro digital"). As questões cobram eixos de nome estável (aplicação no poder público, segurança pública, setores produtivos, PD&I) e a divisão 3 transversais + 6 verticais.
- **PBIA**: os títulos exatos dos 5 eixos não foram conferidos no documento oficial. As questões usam só "melhoria dos serviços públicos", "cerca de R$ 23 bilhões" e "2024–2028", que foram confirmados por várias fontes.
- **PL 2.338/2023**: status volátil e fora das questões. Classificação de risco e sanções não existem na EBIA nem no PBIA, que não são normas sancionadoras.
- **ANPD**: nova denominação confirmada; número da lei de conversão não conferido no texto oficial.
- **LGPD, art. 20**: a redação vigente **não** exige que a revisão seja feita por pessoa natural, porque o § 3º incluído pela Lei 13.853/2019 foi vetado. Já a LC-GO 205/2025 assegura a possibilidade de revisão humana na administração estadual. As questões sobre o art. 20 perguntam "segundo a LGPD" para evitar choque com a norma estadual.
- **Big Data**: a quantidade de Vs depende do modelo (3, 5, 7 ou mais). As questões sempre nomeiam o modelo (3 Vs de Laney; 5 Vs).
- **ISO/IEC 42001**: cobrada só em nível conceitual (sistema de gestão de IA). Não se cobra número de controles.
- **Vizinha "Eng. de Software Assistida por IA"**: não há questões sobre LLM para programar, MCP ou agentes de codificação. Agentes aparecem só na tipologia clássica de Russell & Norvig.
