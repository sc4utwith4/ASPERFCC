# Legislação Aplicada à TI — pesquisa de base para o banco (`leg-ti`)

> **Como esta pesquisa foi feita.** Buscas na web (WebSearch) em 28/10/2026. Neste ambiente, `planalto.gov.br`, `legisla.casacivil.go.gov.br`, `gnoi.tce.go.gov.br`, `goias.gov.br` e `pt.wikipedia.org` não abrem por fetch direto. Os fatos abaixo vêm de resumos de páginas oficiais e de terceiros devolvidos pela busca, somados ao texto de lei federal estável e amplamente reproduzido (LGPD, Marco Civil, Lei 14.133, MP 2.200-2, Lei 14.063). A cota de buscas do turno se esgotou no fim da pesquisa, e por isso alguns pontos ficaram em "não confirmado".
>
> **Regra do banco:** o que depende de normativo do TCE-GO ou de Goiás e não está confirmado aqui ou em `_normativos-tce-go.md` leva `revisarFonteOficial: true`.

## 1. LGPD: privacy by design e by default

- **Art. 46, caput:** os agentes de tratamento devem adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas de destruição, perda, alteração, comunicação ou qualquer forma de tratamento inadequado ou ilícito.
- **Art. 46, § 1º:** a autoridade nacional pode dispor sobre padrões técnicos mínimos (natureza das informações, características do tratamento, estado atual da tecnologia, especialmente dados sensíveis).
- **Art. 46, § 2º:** as medidas "deverão ser observadas **desde a fase de concepção do produto ou do serviço até a sua execução**". É o dispositivo que a doutrina e o governo federal associam a *privacy by design* (privacidade desde a concepção). Uma IN da CGU (IN 02/2021, citada pela Unicamp) lê o dispositivo como requisito de *privacy by design* ao longo de todo o ciclo de vida.
- **Art. 49:** os sistemas utilizados para o tratamento de dados pessoais devem ser estruturados de forma a atender aos requisitos de segurança, aos padrões de boas práticas e de governança e aos princípios gerais da Lei e às demais normas regulamentares.
- **Art. 6º, III (necessidade), VII (segurança), VIII (prevenção) e X (responsabilização e prestação de contas):** base principiológica de *privacy by design/default*. Prevenção = "adoção de medidas para prevenir a ocorrência de danos"; responsabilização = "demonstração, pelo agente, da adoção de medidas eficazes e capazes de comprovar a observância e o cumprimento das normas [...] e, inclusive, da eficácia dessas medidas".
- **Privacy by default (privacidade por padrão):** a LGPD **não usa a expressão**. O conceito é doutrinário (Ann Cavoukian, 7 princípios fundamentais; resolução da conferência internacional de autoridades de proteção de dados, Jerusalém, 2010) e está **expresso no GDPR, art. 25(2)**: por padrão, só os dados necessários a cada finalidade específica são tratados (quantidade coletada, extensão do tratamento, prazo de conservação e acessibilidade). Na LGPD, decorre sobretudo do princípio da necessidade (art. 6º, III) combinado com os arts. 46, § 2º, e 49.
- **Governo federal:** a SGD publicou o *Guia sobre Privacidade desde a Concepção e por Padrão* (PPSI, v1.0, março/2024; versão PPSI 2.0 datada de agosto/2026), que adota os princípios de Cavoukian ("proativo e não reativo; preventivo, não corretivo" etc.). O MGI aprovou "Orientações para a Privacidade desde a Concepção" (Resolução CPDP/MGI nº 5/2025).
- Norma técnica correlata: ISO 31700-1:2023 (privacy by design para bens e serviços de consumo).

## 2. LGPD: minimização, anonimização e pseudonimização

- **Art. 5º, III — dado anonimizado:** dado relativo a titular que não possa ser identificado, considerando a utilização de meios técnicos razoáveis e disponíveis na ocasião de seu tratamento.
- **Art. 5º, XI — anonimização:** utilização de meios técnicos razoáveis e disponíveis no momento do tratamento, por meio dos quais um dado perde a possibilidade de associação, direta ou indireta, a um indivíduo. (Mesma definição no glossário da minuta do guia da ANPD.)
- **Art. 12:** dados anonimizados **não** são dados pessoais, **salvo** quando o processo de anonimização for revertido utilizando exclusivamente meios próprios, ou quando, **com esforços razoáveis**, puder ser revertido. **§ 1º:** razoabilidade considera fatores objetivos, como custo e tempo para reverter, de acordo com as tecnologias disponíveis, e a utilização exclusiva de meios próprios. **§ 2º:** podem ser considerados dados pessoais os utilizados para formação do perfil comportamental de pessoa natural, se identificada. **§ 3º:** a autoridade nacional pode dispor sobre padrões e técnicas de anonimização.
- **Art. 13, § 4º — pseudonimização:** tratamento por meio do qual um dado perde a possibilidade de associação, direta ou indireta, a um indivíduo, **senão pelo uso de informação adicional mantida separadamente pelo controlador em ambiente controlado e seguro**. Consequência: dado pseudonimizado **continua sendo dado pessoal** (reversível); anonimização bem-feita é irreversível com esforço razoável.
- **ANPD:** minuta de *Guia de Anonimização e Pseudonimização* em consulta pública de 30/01 a 14/03/2024 (com estudo preliminar e estudos técnicos). Sem caráter normativo. A minuta afirma que anonimizar não torna lícito um tratamento inicial ilícito e que atos ilícitos (crimes cibernéticos) não contam como "esforço razoável". **Não encontrei publicação da versão final.**
- **Art. 6º, III — necessidade:** limitação do tratamento ao mínimo necessário para a realização de suas finalidades, com abrangência dos dados pertinentes, proporcionais e não excessivos (= minimização). Distinguir de **adequação** (II: compatibilidade com as finalidades informadas) e **finalidade** (I).
- **Art. 16:** término do tratamento → eliminação, autorizada a conservação para: I – cumprimento de obrigação legal ou regulatória; II – estudo por órgão de pesquisa, garantida, sempre que possível, a anonimização; III – transferência a terceiro, respeitados os requisitos da Lei; IV – **uso exclusivo do controlador, vedado seu acesso por terceiro, e desde que anonimizados os dados**.
- **Art. 18, IV:** direito do titular à anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a Lei.
- Técnica (para casos práticos): hash sem sal de identificador de domínio pequeno (CPF: 11 dígitos, 2 verificadores) é reversível por enumeração; quase-identificadores (CEP, data de nascimento, sexo) permitem reidentificação por cruzamento com bases públicas.

## 3. LGPD: segurança, incidentes e operação de sistemas

- **Art. 47:** os agentes de tratamento **ou qualquer outra pessoa que intervenha em uma das fases do tratamento** obrigam-se a garantir a segurança da informação em relação aos dados pessoais, **mesmo após o seu término**.
- **Art. 48:** o **controlador** deve comunicar à autoridade nacional e ao titular a ocorrência de incidente de segurança que possa acarretar risco ou dano relevante aos titulares. **§ 1º:** prazo razoável definido pela autoridade; conteúdo mínimo: natureza dos dados afetados; informações sobre os titulares; medidas técnicas e de segurança utilizadas (observados segredos comercial e industrial); riscos; motivos da demora, se a comunicação não foi imediata; medidas adotadas ou a adotar. **§ 2º:** a autoridade pode determinar ampla divulgação e medidas para reverter ou mitigar. **§ 3º:** no juízo de gravidade, avalia-se a comprovação de medidas técnicas que tornem os dados **ininteligíveis** para terceiros não autorizados.
- **Resolução CD/ANPD nº 15, de 24/04/2024 (RCIS)**, publicada no DOU de 26/04/2024:
  - **Art. 6º:** comunicação à ANPD em **3 dias úteis**, ressalvado prazo de legislação específica, contados do **conhecimento pelo controlador de que o incidente afetou dados pessoais** (não da data do ataque). A orientação anterior da ANPD recomendava 2 dias úteis.
  - Informações complementares: até **20 dias úteis** da comunicação.
  - Comunicação ao **titular** também em 3 dias úteis, em linguagem simples, direta e individualizada quando possível; divulgação ampla (mín. 3 meses) quando o contato individual for inviável (art. 9º, segundo fontes secundárias).
  - **Critérios de risco ou dano relevante (art. 5º):** puder afetar significativamente interesses e direitos fundamentais **e, cumulativamente**, envolver ao menos um: dados sensíveis; dados de crianças, adolescentes ou idosos; dados financeiros; **dados de autenticação em sistemas**; dados protegidos por sigilo legal, judicial ou profissional; dados em larga escala.
  - **Art. 10:** registro de **todo** incidente, comunicado ou não, por **no mínimo 5 anos** (com exceção para guarda permanente no setor público, § 2º, segundo fonte secundária).
  - Agentes de pequeno porte (Res. CD/ANPD 2/2022): prazos em dobro.
- **Art. 37:** controlador e operador mantêm registro das operações de tratamento, especialmente quando baseado no legítimo interesse. **Art. 38:** a autoridade pode determinar ao controlador que elabore RIPD; **parágrafo único:** conteúdo mínimo = descrição dos tipos de dados coletados, metodologia utilizada para a coleta e para a garantia da segurança das informações e análise do controlador quanto a medidas, salvaguardas e mecanismos de mitigação de risco. **Art. 5º, XVII:** definição de RIPD. Ainda **não há regulamento específico de RIPD** (tema na agenda regulatória; ANPD orienta usar os critérios de alto risco da Res. CD/ANPD 2/2022).
- **Art. 39:** o operador realiza o tratamento segundo as instruções fornecidas pelo controlador. **Art. 42, § 1º, I:** o operador responde solidariamente quando descumprir a legislação ou não seguir as instruções lícitas do controlador, hipótese em que se equipara ao controlador.
- **Art. 41:** o controlador indica o encarregado; identidade e contato divulgados publicamente (§ 1º); atividades (§ 2º): aceitar reclamações e comunicações dos titulares, prestar esclarecimentos e adotar providências; receber comunicações da autoridade e adotar providências; orientar funcionários e contratados; demais atribuições. **Res. CD/ANPD 18/2024:** encarregado pode ser pessoa natural (interna ou externa) ou pessoa jurídica; a indicação é por ato formal; a responsabilidade pela conformidade continua com o agente de tratamento.
- **Art. 20:** direito de solicitar revisão de decisões tomadas **unicamente** com base em tratamento automatizado que afetem interesses do titular; § 1º: informações claras sobre critérios e procedimentos, observados segredos comercial e industrial; § 2º: auditoria da autoridade para aspectos discriminatórios. O **§ 3º, que exigia revisão por pessoa natural, foi vetado** (Lei 13.853/2019), e o Congresso **manteve o veto** em 02/10/2019. A LGPD não exige revisão humana.
- **ANPD agora é agência:** a MP 1.317/2025 foi convertida na **Lei 15.352, de 25/02/2026**, que transformou a ANPD em **Agência Nacional de Proteção de Dados** (autarquia de natureza especial, sob a Lei 13.848/2019). A sigla ANPD foi mantida. Segundo consultorias, os deveres materiais da LGPD (incidentes, encarregado, direitos) não mudaram.

## 4. Marco Civil: neutralidade de rede

- **Art. 3º (princípios):** liberdade de expressão; proteção da privacidade; proteção dos dados pessoais, na forma da lei; **preservação e garantia da neutralidade de rede**; preservação da estabilidade, segurança e funcionalidade da rede (medidas técnicas compatíveis com padrões internacionais e boas práticas); responsabilização dos agentes de acordo com suas atividades, nos termos da lei; natureza participativa da rede; liberdade dos modelos de negócios, desde que não conflitem com os demais princípios.
- **Art. 9º, caput:** o responsável pela transmissão, comutação ou roteamento tem o dever de tratar de forma **isonômica** quaisquer pacotes de dados, sem distinção por conteúdo, origem e destino, serviço, terminal ou aplicação.
- **§ 1º:** discriminação ou degradação regulamentada por decreto (art. 84, IV, CF), **ouvidos o CGI.br e a Anatel**, e somente pode decorrer de: I – requisitos técnicos indispensáveis à prestação adequada dos serviços e aplicações; II – priorização de serviços de emergência.
- **§ 2º:** nessas hipóteses, o responsável deve abster-se de causar dano (art. 927 do CC), agir com proporcionalidade, transparência e isonomia, informar previamente e de modo claro suas práticas de gerenciamento e mitigação de tráfego (inclusive de segurança) e oferecer serviços em condições comerciais não discriminatórias.
- **§ 3º:** na provisão de conexão e na transmissão, comutação ou roteamento, é **vedado bloquear, monitorar, filtrar ou analisar o conteúdo dos pacotes**, respeitado o disposto no artigo.
- **Decreto 8.771/2016:** art. 2º, parágrafo único, II — **serviços especializados** (qualidade assegurada, velocidade ou segurança) ficam fora do decreto se não substituírem a internet em seu caráter público e irrestrito **e** forem destinados a grupos específicos com controle estrito de admissão; art. 3º — o tratamento isonômico preserva o caráter público e irrestrito do acesso; art. 4º — discriminação e degradação são **medidas excepcionais**; art. 5º, § 1º — requisitos técnicos indispensáveis: I – segurança de redes (restrição a **spam**, controle de **ataques de negação de serviço**); II – situações excepcionais de **congestionamento** (rotas alternativas, emergências); § 2º — Anatel fiscaliza, consideradas diretrizes do CGI.br; art. 9º — vedadas condutas ou acordos que comprometam o caráter público e irrestrito, que **priorizem pacotes em razão de arranjos comerciais** ou que privilegiem aplicações do próprio responsável ou de seu grupo econômico.
- **Decreto 12.975, de 20/05/2026** (vigência a partir de ~20/07/2026), alterou o Decreto 8.771/2016: inseriu o Capítulo III-A (deveres de provedores de aplicações, moderação, notificação, ANPD como reguladora) e o **art. 15-A** (guarda da **porta lógica de origem** junto ao IP, quando necessária à identificação). É objeto da ADI 7981 e de PDLs. Não encontrei mudança no núcleo da neutralidade.

## 5. Marco Civil: proteção de dados e guarda de registros

- **Art. 5º:** VI – registro de conexão (data e hora de início e término, duração e IP); VIII – registros de acesso a aplicações (data e hora de uso de uma aplicação a partir de um IP).
- **Art. 7º:** VII – não fornecimento a terceiros de dados pessoais, inclusive registros, salvo consentimento livre, expresso e informado ou hipóteses legais; IX – consentimento expresso e destacado; **X – exclusão definitiva dos dados pessoais fornecidos a uma aplicação, a requerimento, ao término da relação, ressalvadas as guardas obrigatórias** (redação dada pela LGPD).
- **Art. 10:** guarda e disponibilização devem preservar intimidade, vida privada, honra e imagem; **§ 1º:** registros só são disponibilizados **mediante ordem judicial**; § 2º: conteúdo de comunicações privadas só por ordem judicial; **§ 3º:** não impede o acesso a **dados cadastrais (qualificação pessoal, filiação e endereço)** por autoridades administrativas com competência legal; § 4º: medidas de segurança informadas de forma clara. Decreto 8.771, art. 11: a autoridade indica o fundamento legal de competência e a motivação; vedados pedidos genéricos.
- **Art. 13:** provedor de conexão (administrador de sistema autônomo) guarda **registros de conexão** sob sigilo, em ambiente controlado e de segurança, por **1 ano**. § 1º: responsabilidade **não pode ser transferida a terceiros**. § 2º: autoridade policial ou administrativa ou o MP podem requerer **cautelarmente** guarda por prazo superior. § 3º: a autoridade tem **60 dias**, contados do requerimento, para ingressar com pedido de autorização judicial. § 4º: o provedor mantém **sigilo** sobre o requerimento, que perde eficácia se o pedido for indeferido ou não protocolado no prazo. § 5º: disponibilização sempre precedida de autorização judicial.
- **Art. 14:** na provisão de conexão, é **vedado guardar os registros de acesso a aplicações**.
- **Art. 15:** provedor de aplicações **constituído como pessoa jurídica, que exerça a atividade de forma organizada, profissionalmente e com fins econômicos**, guarda registros de acesso a aplicações por **6 meses**. § 1º: ordem judicial pode obrigar outros provedores a guardar registros de fatos específicos em período determinado. § 2º: requerimento cautelar a qualquer provedor de aplicações (aplicam-se os §§ 3º e 4º do art. 13). § 3º: disponibilização precedida de autorização judicial.
- **Art. 16:** na provisão de aplicações, vedada a guarda de registros de acesso a outras aplicações sem consentimento prévio e de dados pessoais excessivos em relação à finalidade consentida.
- **Decreto 8.771, art. 13:** padrões de segurança para guarda: controle estrito de acesso; autenticação (ex.: dupla) para individualizar o responsável; **inventário detalhado dos acessos** (momento, duração, identidade do responsável, arquivo acessado); técnicas de inviolabilidade, como **encriptação**. § 2º: reter a **menor quantidade possível** de dados, excluindo-os ao atingir a finalidade ou encerrado o prazo legal.
- **Prazos não mudaram:** não encontrei lei de 2025–2026 alterando os arts. 13 e 15 (PL 1845/2024 em debate). O Decreto 12.975/2026 acrescentou a porta lógica de origem ao conteúdo da guarda (art. 15-A do Decreto 8.771).

## 6. Requisitos de segurança em contratações de TIC

- **Lei 14.133/2021, art. 6º:** XX – **ETP** (primeira etapa do planejamento; caracteriza o interesse público e a melhor solução); XXIII – **termo de referência** (definição do objeto, fundamentação, descrição da solução considerado todo o ciclo de vida, **requisitos da contratação**, modelo de execução, **modelo de gestão**, critérios de medição e pagamento, seleção do fornecedor, estimativas, adequação orçamentária); XXVII – **matriz de riscos** (cláusula contratual definidora de riscos e responsabilidades e caracterizadora do equilíbrio econômico-financeiro inicial).
- **Art. 18, § 1º:** o ETP evidencia o problema e a melhor solução e contém, entre outros: necessidade (I); previsão no plano de contratações anual, indicando alinhamento ao planejamento (II); requisitos da contratação (III); estimativas de quantidades (IV); **levantamento de mercado** (V); estimativa do valor (VI); descrição da solução como um todo (VII); justificativa do parcelamento (VIII); providências prévias, inclusive capacitação de servidores para fiscalização (X); posicionamento conclusivo (XIII). **§ 2º:** obrigatórios ao menos I, IV, VI, VIII e XIII; a ausência dos demais exige justificativa.
- **Art. 12, VII:** plano de contratações anual para racionalizar contratações, garantir alinhamento ao planejamento estratégico e subsidiar as leis orçamentárias.
- **Art. 22:** o edital **poderá** contemplar matriz de alocação de riscos; **§ 3º:** obrigatória em obras e serviços de grande vulto e nos regimes de contratação integrada e semi-integrada.
- **Art. 93:** em projetos ou serviços técnicos especializados, **inclusive software e a documentação técnica associada**, o autor deve **ceder todos os direitos patrimoniais** à Administração, que poderá utilizá-los e alterá-los livremente sem nova autorização; § 1º: obra imaterial de caráter tecnológico, insuscetível de privilégio → inclui o fornecimento de dados, documentos e elementos de informação da tecnologia; **§ 2º: facultado deixar de exigir a cessão** em pesquisa e desenvolvimento científico, tecnológico ou de inovação (Lei 10.973/2004).
- **Boas práticas (referência federal, não vinculante para o TCE-GO):** IN SGD/ME nº 94/2022 (contratações de TIC no SISP; modelo de termo de confidencialidade com base no art. 18, V, "a"); *Guia de Requisitos e Obrigações quanto a Privacidade e à Segurança da Informação* (SGD/PPSI, v3.2, nov/2024), alinhado à LGPD e à ANPD. Cláusulas típicas: confidencialidade (termo de compromisso e de ciência), papel de operador e instruções documentadas, comunicação de incidentes ao controlador, auditoria, restrição a subcontratação, devolução e eliminação de dados ao fim do contrato, transferência de conhecimento, continuidade e plano de saída.
- **ISO/IEC 27002:2022:** 5.19 (segurança nos relacionamentos com fornecedores), 5.20 (segurança nos acordos com fornecedores), 5.21 (cadeia de suprimentos de TIC), 5.22 (monitoramento, análise crítica e gestão de mudanças dos serviços de fornecedores), **5.23 (segurança para uso de serviços em nuvem, controle novo de 2022)**.
- LGPD aplicada: arts. 39, 42, § 1º, I, 46 e 47 (ver seção 3).

## 7. Certificação digital em sistemas informatizados

- **MP 2.200-2/2001** (em vigor por força do art. 2º da EC 32/2001): art. 1º — ICP-Brasil instituída para garantir **autenticidade, integridade e validade jurídica** de documentos eletrônicos, das aplicações de suporte e das aplicações habilitadas, e transações eletrônicas seguras; art. 2º — autoridade gestora de políticas (Comitê Gestor) + cadeia: **AC Raiz, AC e AR**; art. 5º, parágrafo único — **vedado à AC Raiz emitir certificados para o usuário final**; art. 6º, parágrafo único — o **par de chaves é gerado sempre pelo próprio titular**, e a chave privada de assinatura é de seu **exclusivo controle, uso e conhecimento**; art. 7º — AR identifica e cadastra usuários, encaminha solicitações às AC e mantém registros; parágrafo único (Lei 14.063/2020): identificação presencial ou por outra forma de segurança equivalente, conforme normas da ICP-Brasil; art. 10, § 1º — declarações em documentos com certificação ICP-Brasil **presumem-se verdadeiras em relação aos signatários** (presunção relativa; hoje lida com o art. 219 do CC/2002); § 2º — admite outro meio de comprovação de autoria e integridade, inclusive certificados não ICP-Brasil, **desde que admitido pelas partes como válido ou aceito pela pessoa a quem for oposto o documento**; art. 13 — **o ITI é a AC Raiz**.
- **Lei 14.063/2020:** art. 2º, parágrafo único, I — o capítulo **não se aplica a processos judiciais**; art. 4º — **simples** (identifica o signatário; anexa ou associa dados), **avançada** (certificados não ICP-Brasil ou outro meio admitido pelas partes; associada ao signatário de maneira unívoca; dados de criação sob controle exclusivo com elevado nível de confiança; modificação posterior detectável), **qualificada** (certificado digital ICP-Brasil, art. 10, § 1º, da MP 2.200-2); § 1º — a qualificada tem o nível mais elevado de confiabilidade; art. 5º — ato do titular de cada Poder ou órgão constitucionalmente autônomo fixa o nível mínimo; § 1º, I — simples em interações de **menor impacto e sem informações protegidas por grau de sigilo**; II — avançada nessas hipóteses e no registro de atos em juntas comerciais; **III — qualificada admitida em qualquer interação eletrônica com ente público, independentemente de cadastramento prévio**; **§ 2º, I — qualificada obrigatória** nos atos assinados por chefes de Poder, Ministros de Estado e titulares de Poder ou órgão constitucionalmente autônomo (também NF-e, com exceções, e transferência/registro de imóveis). STJ (REsp 2.159.442/PR): níveis distintos de força probatória, todos válidos.
- **Carimbo do tempo:** emitido por **Autoridade de Carimbo do Tempo (ACT)** credenciada; é **evidência de que o documento existia na data e hora** nele incluídas; uso **facultativo** (documento assinado com ICP-Brasil é válido com ou sem carimbo); a AC Raiz atua como **Entidade de Auditoria do Tempo (EAT)**, sincronizando os servidores das ACTs com a **Hora Legal Brasileira** (Observatório Nacional); padrão técnico de referência: RFC 3161 (DOC-ICP-11 a 13).
- **Tipos de certificado — atenção:** a **Resolução CG ICP-Brasil nº 211/2024** (DOU 04/11/2024) **extinguiu os tipos A1, A2 e S1 a S4**, criou o **selo eletrônico** para pessoas jurídicas (SE-S em software e SE-H em hardware, inclusive HSM ou nuvem de PSC) e certificados de **aplicações específicas** (AE-S/AE-H). A3 e A4 passam a ser só para pessoas físicas. Há transição: emissão de A1/A3 na cadeia V10 até 31/12/2026 para usos específicos e uso de A1 até a expiração da cadeia V5 (02/03/2029). Historicamente: A1 = chave em software (validade até 1 ano); A3 = chave em hardware criptográfico (token/cartão; validade máxima de 5 anos desde a Resolução 91/2012). **Não usar A1 como tipo vigente sem ressalva.**

## 8. LC estadual 205/2025 (IA em Goiás)

Fatos já verificados em `_normativos-tce-go.md` (objetivos, setor privado livre, intervenção excepcional e subsidiária, revisão humana na administração pública, NEI-IA consultivo e multissetorial, Sandbox Estadual Permanente no cap. VIII, art. 32 e seguintes, vigência na publicação). Acréscimos desta pesquisa:
- Ementa: "Institui a Política Estadual de Fomento à Inovação em Inteligência Artificial no Estado de Goiás"; publicada em 19/05/2025 (suplemento do DOE); originada do **PLP 15/2025**, aprovado por unanimidade na Alego; a lei tem cerca de **79 artigos** (fonte jornalística).
- **Art. 1º (objetivos, parcial):** impulsionar o desenvolvimento tecnológico sustentável [...] e soluções de IA abertas; **proteger direitos fundamentais relativos à IA**; **promover usos seguros e benéficos da IA nas competências do poder público estadual**.
- **Art. 2º:** desenvolvimento e uso de IA têm como **diretriz central a pessoa humana**; fundamentos incluem direitos humanos, privacidade e proteção de dados. Assegurados privacidade, proteção de dados e **transparência** nas interações com decisões automatizadas.
- **Art. 6º:** liberdade do setor privado para desenvolver e operar IA para fins lícitos; intervenção estatal excepcional e subsidiária, em linha com a Lei 13.874/2019 (Liberdade Econômica).
- **Art. 7º:** **auditoria e análise algorítmica limitadas às situações absolutamente necessárias** para fins de governança e controle, sujeitas à **viabilidade técnica** (texto reproduzido no portal GO.IA).
- **Revisão humana:** assegurada a possibilidade de revisão humana de decisões automatizadas da administração pública que afetem direitos significativos; recursos administrativos baseados em conclusões de IA devem contar com **deliberação humana final** (resumo de busca; artigo não identificado).
- **Art. 27:** cria o **NEI-IA** na estrutura da **Secretaria-Geral de Governo (SGG)**, de natureza **consultiva, multissetorial e permanente**; art. 28: instância estratégica de articulação técnica e institucional; art. 29: composição (inciso VII: representante da sociedade civil, titular e suplente, com experiência em direitos digitais ou desenvolvimento sustentável). O NEI-IA elabora diretrizes éticas para desenvolvimento, uso e contratação de IA pelo poder público, propõe e acompanha sandboxes e **regulamenta, coordena e supervisiona o Sandbox**. **Alteração posterior ao edital:** a LC 215, de 10/9/2026, transferiu o NEI-IA para a estrutura da SECTI (notícias da Alego sobre o PL 16854/26 e texto compilado). A prova cobra a redação vigente na publicação do edital (Obs. 1 do Anexo II), com o NEI-IA na SGG.
- **Art. 32:** **Sandbox Estadual Permanente de IA**, ambiente regulatório experimental e permanente para desenvolvimento, testagem e implementação responsável; imprensa cita ambiente para **agentes autônomos** com regras de supervisão humana, transparência e responsabilidade.
- **Art. 49:** **Centro Estadual de Computação Aberta e IA** (infraestrutura para treinamento e pesquisa em IA aberta, em parceria com o CEIA/UFG).
- Preferência por **software aberto e modelos de IA abertos** (open source); NEI-IA monitora essa preferência nos projetos públicos.
- Capítulo sobre **data centers**: biometano como fonte energética prioritária e autorização de incentivos fiscais, creditícios e regulatórios.
- **Não confirmado:** artigo exato da revisão humana; prazo do regimento do NEI-IA (o arquivo de normativos cita 90 dias); "peso adicional" a propostas com software aberto no sandbox (o arquivo de normativos registra, mas esta pesquisa não reconfirmou); existência ou não de classificação de risco de sistemas de IA.

## 9. RN 13/2016: Comitê Estratégico de TI (CETI)

Ver `_normativos-tce-go.md` (verificado): colegiado **consultivo, permanente**, com responsabilidades estratégicas e executivas (art. 1º); competências (art. 2º, parcial): coordenar estratégias, diretrizes e políticas de TI; analisar planos e indicadores de desempenho; **validar o orçamento** de TI; **priorizar ações e investimentos**; acompanhar projetos e conflitos de recursos. Composição por portaria (Portaria 59/2023, alterada pela 197/2023). O CETI aprova o PDTI por **Ordem de Serviço**. Nada novo confirmado nesta pesquisa (texto compilado não lido).

## 10. RA 14/2024: Política de Governança Organizacional

- Fonte: portal do TCE-GO (documento "RA nº 14 – Política de Governança" e página "Governança no TCE-GO"), via resumo de busca. **Não lido na íntegra → selo.**
- Inspirada na **Resolução TCU nº 320/2020** (benchmarking).
- Governança organizacional = "mecanismos de **liderança, estratégia e controle** postos em prática para **avaliar, direcionar e monitorar** a atuação da gestão" (mesma tríade do Decreto federal 9.203/2017, art. 2º, I, e do Referencial Básico de Governança do TCU).
- Cria/integra o **Sistema de Governança Organizacional (SGO/TCE-GO)**: conjunto de instrumentos e estruturas envolvidos, direta ou indiretamente, na avaliação, no direcionamento e no monitoramento da organização.
- Mecanismos citados no portal: Política de Gestão de Pessoas, PDDC, Sistema de Planejamento e Gestão, Código de Ética, segregação de funções.
- Manual do SGI: Tribunal Pleno como instância de governança (órgão diretivo) e Presidência como instância máxima de representação da Alta Direção.
- Princípio correlato: ISO/IEC 38500 (avaliar–dirigir–monitorar) e COBIT 2019 (governança: EDM; gestão: APO, BAI, DSS, MEA).

## 11. RA 17/2024: Política de Segurança da Informação

Ver `_normativos-tce-go.md` (verificado): aprovada em 19/09/2024, publicada em 24/09/2024; **art. 2º**: diretrizes, objetivos e responsabilidades para **disponibilidade, integridade, confidencialidade e autenticidade**, aplicável a **todas as unidades**; revogou a política de 2022; Portaria 56/2025 atribui ao **Comitê de Segurança da Informação** promover e atualizar a PSI; existe **Manual de Segurança da Informação** com normas específicas. Nada novo confirmado nesta pesquisa.

## 12. RA 14/2025: estrutura e competências da Diretoria de TI

- Fonte: GNOI, ato 25999, via resumo de busca. **Não lido na íntegra → selo.**
- A RA 14/2025 define a estrutura organizacional (anexos I e II): órgãos colegiados (Tribunal Pleno, Primeira e Segunda Câmaras), órgãos do corpo diretivo (Presidência, Vice-Presidência, Corregedoria-Geral) etc.
- A **Diretoria de Tecnologia da Informação** aparece na **Secretaria Executiva da Presidência**, com quatro unidades vinculadas: **Serviço de Sistemas de Informação**, **Serviço de Suporte Técnico de TI**, **Serviço de Infraestrutura e Segurança de TI** e **Serviço de Inteligência Artificial**.
- Finalidade: assessorar as unidades em TI e gerir a infraestrutura tecnológica, os sistemas corporativos e o suporte técnico. Competências (§ 2º, parcial): planejar, dirigir e controlar a política de TI, engenharia de software, segurança da informação, infraestrutura e suporte.
- Antecedente: RA 19/2022 (lista de competências semelhante), alterada pela RA 23/2024 para criar a unidade de serviços de IA (`_normativos-tce-go.md`).

## 13. PDTI 2025–2026

- Fato do edital: aprovado pela **Ordem de Serviço nº 001/2025-CETI**. PDTI 2023–2024: OS 002/2023-CETI.
- Conceito (SISP, Guia de PDTIC): instrumento de **diagnóstico, planejamento e gestão** dos recursos e processos de TI para atender às necessidades tecnológicas e de informação do órgão em determinado período.
- Encadeamento com contratações: Lei 14.133, art. 12, VII (plano de contratações anual alinhado ao planejamento estratégico) e art. 18, § 1º, II (ETP demonstra a previsão no plano de contratações anual).
- **Conteúdo do PDTI 2025–2026 (objetivos, metas, inventário de necessidades): não confirmado.** Não cobrar.

## Pontos de cautela

1. **Prazo de incidente:** 3 dias úteis contados do **conhecimento de que o incidente afetou dados pessoais** (RCIS, art. 6º). Distratores típicos: 72 horas (GDPR), 2 dias úteis (orientação antiga), contagem a partir do ataque, 20 dias úteis (é o prazo de complementação).
2. **Revisão de decisão automatizada:** a LGPD **não** exige revisão humana (veto mantido). A LC-GO 205/2025 assegura a **possibilidade de revisão humana** na administração pública estadual para decisões que afetem direitos significativos. Não generalizar a regra goiana para todo o país.
3. **Privacy by default** não aparece com esse nome na LGPD. Não afirmar que a LGPD o define expressamente; ancorar em art. 6º, III, art. 46, § 2º, e art. 49, e citar o GDPR, art. 25, como fonte expressa.
4. **Pseudonimizado continua dado pessoal.** Anonimizado deixa de ser, **salvo** reversão por meios próprios ou com esforços razoáveis (art. 12).
5. **Art. 15 do Marco Civil:** a obrigação de 6 meses alcança o provedor de aplicações **pessoa jurídica, organizado, profissional e com fins econômicos**. Os demais podem ser obrigados por ordem judicial (§ 1º) ou receber requerimento cautelar (§ 2º).
6. **Dados cadastrais × registros:** dados cadastrais (qualificação pessoal, filiação, endereço) podem ser requisitados por autoridade administrativa competente; registros e conteúdo exigem ordem judicial.
7. **Decreto 12.975/2026** alterou o Decreto 8.771/2016 (porta lógica, deveres de plataformas) e está sob questionamento no STF. **Não basear gabarito** nas novidades desse decreto.
8. **Art. 19 do Marco Civil** foi declarado parcial e progressivamente inconstitucional pelo STF (Temas 987 e 533, jun/2025). Fora do escopo dos subtópicos; não cobrar.
9. **A1 extinto:** Resolução CG ICP-Brasil nº 211/2024. Questões sobre A1/A3 só com ressalva da transição; preferir MP 2.200-2, Lei 14.063 e carimbo do tempo.
10. **ANPD → Agência Nacional de Proteção de Dados** (Lei 15.352/2026). Usar "ANPD" ou "autoridade nacional".
11. **IN SGD/ME 94/2022** é do SISP (Executivo federal): para o TCE-GO serve como boa prática, não como norma vinculante.
12. **Normativos do TCE-GO:** não citar números de artigo de RA 14/2024, RA 14/2025 e PDTI. Os nomes das unidades da DTI vêm de resumo de busca do GNOI (selo).
13. **LC 205/2025:** não afirmar a existência ou a ausência de classificação de risco de IA.

## Fontes

LGPD e ANPD
- RCIS (cópia do DOU): https://www.lgpd.ms.gov.br/wp-content/uploads/2024/05/REGULAMENTO-DE-COMUNICACAO-DE-INCIDENTE-DE-SEGURANCA-ABRIL-2024-ANPD-.pdf
- https://www.mattosfilho.com.br/unico/regulamento-incidente-seguranca/
- https://lefosse.com/noticias/alerta/client-alert-anpd-aprova-regulamento-de-comunicacao-de-incidente-de-seguranca/
- https://www.mayerbrown.com/pt/insights/publications/2024/05/anpd-approves-data-breach-notifying-regulation
- https://tagdlaw.com.br/anpd-comunicacao-de-incidentes-de-seguranca/
- https://www.globalsuitesolutions.com/pt/comunicacao-de-incidente-anpd/
- https://confidata.com.br/blog/comunicacao-incidente-seguranca-anpd
- https://www.gov.br/governodigital/pt-br/privacidade-e-seguranca/ppsi/guia_privacidade_concepcao.pdf
- https://www.gov.br/governodigital/pt-br/privacidade-e-seguranca/ppsi-2.0/arquivos/guia-sobre-privacidade-desde-a-concepcao-e-por-padrao-v1-1-310826.pdf
- https://www.gov.br/gestao/pt-br/assuntos/noticias/2026/janeiro/orientacoes-para-privacidade-desde-a-concepcao.pdf
- https://privacidade.unicamp.br/arquivo/uploads/instrucao-normativa-privacidade-cgu-02-2021-1660923
- https://www.convert.com/eu-gdpr/article-25-gdpr/
- https://www.mattosfilho.com.br/unico/anonimizacao-pseudonimizacao-direitos-titulares/
- https://www.mayerbrown.com/pt/insights/publications/2024/02/anonymization-and-pseudonymization-anpd-kicks-off-public-consultation-on-preliminary-study
- https://cesconbarrieu.com.br/anpd-abre-consulta-a-sociedade-sobre-proposta-de-guia-de-anonimizacao-e-pseudonimizacao-para-protecao-de-dados-pessoais/
- https://www.mattosfilho.com.br/unico/anpd-resolucao-encarregado/
- https://cesconbarrieu.com.br/anpd-publica-regulamento-sobre-a-atuacao-do-encarregado-de-dados-pessoais-2/
- https://www.mattosfilho.com.br/unico/anpd-relatorio-protecao-dados-pessoais/
- https://tagdlaw.com.br/perguntas-e-respostas-anpd-sobre-o-ripd-dpia/
- https://teletime.com.br/02/10/2019/congresso-mantem-veto-e-lgpd-fica-sem-revisao-humana-de-decisoes-automatizadas/
- https://serpro.gov.br/lgpd/noticias/2019/congresso-aprecia-veto-ao-artigo-20-da-lgpd
- Lei 15.352/2026: https://legis.senado.leg.br/norma/42835651/publicacao/42841343
- https://cesconbarrieu.com.br/mp-no-1-317-2025-avanca-no-congresso-e-consolida-transformacao-da-anpd-em-agencia-reguladora/
- https://www.aurum.com.br/blog/lgpd-comentada/art-46-a-49-lgpd

Marco Civil e Decreto 8.771/2016
- https://bdjur.stj.jus.br/jspui/bitstream/2011/82830/marco_civil_internet.pdf
- https://escola.mpu.mp.br/plataforma-aprender/acervo-educacional/conteudo/201cinvestigacao-de-crimes-ciberneticos/textoc-3.pdf
- https://www.migalhas.com.br/depeso/380308/reflexoes-sobre-o-art-10-do-marco-civil-da-internet--lei-12-965-14
- https://www2.camara.leg.br/legin/fed/decret/2016/decreto-8771-11-maio-2016-783094-normaatualizada-pe.html
- https://legis.senado.leg.br/norma/414662/publicacao/15632848
- https://www.legjur.com/legislacao/art/dec_00087712016-13
- https://tecnoblog.net/195446/decreto-marco-civil-zero-rating/
- Decreto 12.975/2026: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/d12975.htm ; https://www.migalhas.com.br/depeso/458172/decreto-12-975-26-por-que-o-ip-ja-nao-basta-para-identificar-o-usuario ; https://www.coad.com.br/home/noticias-detalhe/138311/partido-questiona-no-stf-decreto-que-altera-regulamentacao-do-marco-civil-da-internet
- STF, art. 19: https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/stf-muda-regime-de-responsabilizacao-das-plataformas

Contratações de TIC
- https://www.legjur.com/legislacao/art/lei_00141332021-93
- https://www.conjur.com.br/2022-jul-19/edcarlos-alves-lima-matriz-riscos-lei-14133//?print=1
- Guia de Requisitos e Obrigações (SGD/PPSI v3.2): https://nova-intranet.tce.pb.gov.br/wp-content/uploads/2025/09/13guia_requisitos_obrigacoes.pdf
- https://tic.fiocruz.br/storage/images/5116c20b-1735-4b65-87f7-13e6800d5def.pdf
- https://www.dqsglobal.com/en/explore/blog/fortifying-the-supply-chain-a-guide-to-controls-a.5.19-a.5.23

Certificação digital
- https://www2.camara.leg.br/legin/fed/medpro/2001/medidaprovisoria-2200-2-24-agosto-2001-391394-normaatualizada-pe.html
- https://www.juruadocs.com/legislacao/art/mpv_000220022001-10
- https://planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14063.htm
- https://www.legjur.com/legislacao/art/LEI_00140632020-5
- https://rsdata.com.br/wp-content/uploads/2020/09/LEI-No-14.063-DE-23-DE-SETEMBRO-DE-2020-DOU-Imprensa-Nacional.pdf
- https://www.irib.org.br/?p=159036
- https://mailman.iti.gov.br/images/repositorio/legislacao/documentos-principais/11/DOC-ICP-11_v.1.0.pdf
- https://mailman.iti.gov.br/images/repositorio/legislacao/resolucoes/em-vigor/Resolucao_58.pdf
- https://mailman.iti.gov.br/images/repositorio/legislacao/documentos-principais/04/DOC-ICP-04_-_Versao_6.4.pdf
- https://repositorio.iti.gov.br/resolucoes/Resolucao211_pauta_modernizante.htm
- https://blog.tecnospeed.com.br/resolucao-cg-icp-brasil-no-211-novos-certificados-digitais-e-extincao-dos-modelos-a1-e-a2/

LC-GO 205/2025
- https://legisla.casacivil.go.gov.br/api/v2/pesquisa/legislacoes/110694/pdf
- https://goias.gov.br/governo/go-ia/politica-estadual-de-fomento-a-inovacao-em-inteligencia-artificial/
- https://goias.gov.br/governo/go-ia/sandbox-estadual-permanente-de-inteligencia-artificial/
- https://goias.gov.br/governo/?p=84490
- https://goias.gov.br/governo/?p=86004
- https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/tributario-ij/goias-regulamenta-uso-de-inteligencia-artificial
- https://walmarandrade.com.br/lei-complementar-205-2025-goias/
- https://juridico.ai/noticias/goias-regulamenta-inteligencia-artificial-lei-complementar-205/
- https://portalcontexto.com/lei-institui-politica-publica-para-fomento-e-inovacao-em-inteligencia-artificial/
- https://teletime.com.br/16/05/2025/goias-sai-na-frente-e-aprova-politica-estadual-de-fomento-a-data-centers/

TCE-GO
- https://portal.tce.go.gov.br/governanca-no-tce-go
- https://portal.tce.go.gov.br/documents/117455/0/RA+n%C2%BA+14+-+Politica+de+Governan%C3%A7a/905914f0-afed-4366-ad4d-297627428130
- https://portal.tce.go.gov.br/documents/117455/1539573/Manual%20do%20Sistema%20de%20Gest%C3%A3o%20Integrado%20(SGI)/62197fb9-5b6c-42a4-afb8-ca37eef269b9
- RA 14/2025: https://gnoi.tce.go.gov.br/atoNormativo/Publicado/25999
- RA 19/2022: https://gnoi.tce.go.gov.br/atoNormativo/Publicado?id=15480
- Portaria 56/2025: https://gnoi.tce.go.gov.br/atoNormativo/Publicado?id=24312
- https://portal.tce.go.gov.br/tecnologia-da-informacao2
