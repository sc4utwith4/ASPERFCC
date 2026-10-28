# Pesquisa — Segurança da Informação (slug `seguranca-informacao`, prefixo `seg-info`)

> Pesquisa feita em 28/10/2026 para o banco de 50 questões inéditas no padrão FCC (TCE-GO 2026, Técnico de Controle Externo — TI, código B02).
>
> **Como ler este arquivo.** Cada fato traz a forma de verificação:
> - **[primária]**: lido no texto do próprio emissor (repositório oficial no GitHub, código oficial, texto legal publicado pela Câmara/Senado);
> - **[secundária]**: confirmado por resumo de terceiro confiável (fabricante, consultoria, órgão público que cita a norma);
> - **[conhecimento prévio]**: fato estável da literatura, não reconferido aqui porque o orçamento de buscas web da sessão se esgotou. Só entrou em questão quando é consenso de livro-texto.
>
> Limitações do ambiente: WebFetch/curl só alcançam GitHub e npm; o restante veio por WebSearch. Normas ISO/ABNT são pagas: números de controles e nomes de cláusulas foram conferidos em índices publicados (catálogos, adoções idênticas como AS/NZS), não no texto integral.

## 1. Princípios: confidencialidade, integridade, disponibilidade, autenticidade e não repúdio

- **Definições da LAI (Lei 12.527/2011, art. 4º)** [primária — Câmara dos Deputados]: VI disponibilidade (informação que pode ser conhecida e utilizada por indivíduos, equipamentos ou sistemas autorizados); VII autenticidade (informação produzida, expedida, recebida ou modificada por determinado indivíduo, equipamento ou sistema); VIII integridade (informação não modificada, inclusive quanto à origem, trânsito e destino). O art. 6º, II, impõe a proteção da informação "garantindo-se sua disponibilidade, autenticidade e integridade".
- **ISO/IEC 27000:2018 (termos e definições)** [conhecimento prévio]: confidencialidade = informação não disponibilizada nem revelada a indivíduos, entidades ou processos não autorizados; integridade = exatidão e completude; disponibilidade = acessível e utilizável sob demanda por entidade autorizada; autenticidade = a entidade é o que alega ser; não repúdio = capacidade de provar a ocorrência de um evento ou ação alegada e as entidades que o originaram.
- **PSI do TCE-GO (RA 17/2024, art. 2º)**: diretrizes para disponibilidade, integridade, confidencialidade e autenticidade (ver `_normativos-tce-go.md`). As questões usam o Tribunal só como cenário.
- Mecanismo × propriedade: hash sem chave → detecta alteração, não autentica a origem; **HMAC** → integridade + autenticidade da origem entre quem compartilha a chave, **sem** não repúdio; **assinatura digital** → integridade + autenticidade + não repúdio, **sem** confidencialidade; cifra com chave pública do destinatário → confidencialidade.

Fontes: https://www2.camara.leg.br/legin/fed/lei/2011/lei-12527-18-novembro-2011-611802-publicacaooriginal-134287-pl.html · https://www.iso27001security.com/html/27000.html

## 2. Gestão de riscos, de vulnerabilidades e de incidentes

### Riscos — ISO/IEC 27005:2022 (ABNT NBR ISO/IEC 27005:2023)
- A edição brasileira é de **maio/2023** e adota a ISO/IEC 27005:2022 [secundária: catálogo Target/normas.com.br; Estratégia Concursos]. Título ABNT: "Segurança da informação, segurança cibernética e proteção à privacidade — Orientações para gestão de riscos de segurança da informação".
- A 2022 alinhou o texto à ISO/IEC 27001:2022 e à ISO 31000:2018, introduziu cenários de risco e distinguiu identificação **baseada em eventos** e **baseada em ativos**; tem 10 seções e 1 anexo (a de 2018 tinha 12 seções e 6 anexos) [secundária: iso27001security.com; Drata].
- **Opções de tratamento (seção 8.2)**: **modificar** (alterar probabilidade e/ou consequência; ex.: implementar controles), **reter** (aceitar por decisão informada), **evitar** (não iniciar/encerrar a atividade que origina o risco) e **compartilhar** (dividir com terceiros; ex.: seguro, contrato) [secundária].
- ISO/IEC 27001:2022, 6.1.3: plano de tratamento e aceitação dos riscos residuais pelos **proprietários dos riscos** [conhecimento prévio].

### Vulnerabilidades — CVE, CWE, CVSS
- **CVSS v4.0** (FIRST, nov./2023): quatro grupos de métricas — **Base, Threat, Environmental e Supplemental**. O grupo **Temporal** da v3.x foi renomeado para **Threat**; as métricas **Supplemental não alteram o escore** [secundária]. Nomenclatura de escores: CVSS-B, CVSS-BT, CVSS-BE, CVSS-BTE.
- Faixas qualitativas: **None 0,0; Low 0,1–3,9; Medium 4,0–6,9; High 7,0–8,9; Critical 9,0–10,0** [primária: função `qualScore` do calculador oficial, github.com/FIRSTdotorg/cvss-v4-calculator, app.js].
- CVE identifica uma vulnerabilidade específica (formato CVE-AAAA-NNNN…), atribuída por CNAs; CWE classifica **tipos** de fraqueza [conhecimento prévio].
- **NVD em 2026**: o NIST anunciou (abr./2026) que passa a enriquecer (CVSS, CWE, CPE) prioritariamente CVEs de maior risco, como as do catálogo **KEV** da CISA [secundária: Help Net Security, 16/04/2026]. CISA estendeu o contrato da MITRE para operar o programa CVE em 2025 [secundária].
- Escore base não é medida de risco da organização: priorização combina gravidade, exploração ativa (KEV/EPSS), exposição e criticidade do ativo.

### Incidentes — NIST SP 800-61 e ISO/IEC 27035
- **NIST SP 800-61 Rev. 3** foi publicada em **03/04/2025** e **substitui a Rev. 2** (2012). Título: "Incident Response Recommendations and Considerations for Cybersecurity Risk Management: A CSF 2.0 Community Profile" [primária: anúncio NIST/CSRC citado nos resultados].
- A Rev. 3 organiza as recomendações pelas **seis Funções do CSF 2.0** (Govern, Identify, Protect, Detect, Respond, Recover; CSF 2.0 de 26/02/2024, que acrescentou **Govern**). No novo modelo, Govern, Identify e Protect sustentam a **preparação** (atividades amplas de gestão de riscos, não parte da resposta em si); Detect, Respond e Recover concentram a **resposta**; a **melhoria contínua/lições aprendidas** fica na categoria **Improvement (ID.IM)** de Identify e retroalimenta as demais. O NIST admite que a organização use o modelo de ciclo de vida que lhe convier [secundária: Industrial Cyber; resumos do texto].
- Ciclo clássico da **Rev. 2** (para reconhecer em distratores): Preparação; Detecção e Análise; Contenção, Erradicação e Recuperação; Atividade Pós-Incidente [conhecimento prévio].
- **ISO/IEC 27035-1:2023** (princípios e processo; parte 2:2023 planejamento e preparação; parte 3 operações de resposta): abordagem estruturada para detectar, relatar, avaliar e responder a incidentes e aplicar lições aprendidas; resumos citam cinco fases (planejar e preparar; detectar e relatar; avaliar e decidir; responder; aprender lições) [secundária].
- **ISO/IEC 27002:2022**: 5.24 planejamento e preparação da gestão de incidentes; 5.25 avaliação e decisão sobre eventos; 5.26 resposta a incidentes; 5.27 aprendizado com incidentes; 5.28 **coleta de evidências**; 6.8 relato de eventos [secundária: índice da AS/NZS ISO/IEC 27002:2022, adoção idêntica].

Fontes: https://www.estrategiaconcursos.com.br/blog/seguranca-informacao-iso-27005-2023/ · https://www.iso27001security.com/html/27005 · https://github.com/FIRSTdotorg/cvss-v4-calculator · https://www.first.org/cvss/v4.0/specification-document · https://helpnetsecurity.com/2026/04/16/nist-national-vulnerability-database-nvd-enrichment · https://csrc.nist.gov/news/2025/nist-revises-sp-800-61 · https://www.nist.gov/news-events/news/2025/04/nist-revises-sp-800-61-incident-response-recommendations-and-considerations · https://industrialcyber.co/nist/nist-publishes-sp-800-61-rev-3-overhauling-incident-response-guidance-for-csf-2-0/ · https://blog.ansi.org/iso-iec-27035-1-2023-information-security-management/ · https://store.standards.org.au/product/as-nzs-iso-iec-27002-2022

## 3. Classificação da informação

- **LAI, art. 24, § 1º** [primária]: prazos máximos de restrição, **contados da data de produção**: **ultrassecreta 25 anos; secreta 15 anos; reservada 5 anos**. § 3º: o termo final pode ser um **evento**, desde que ocorra antes do prazo máximo. § 4º: vencido o prazo ou ocorrido o evento, a informação torna-se **automaticamente** de acesso público. § 2º: regra própria para informações que ponham em risco a segurança do Presidente e do Vice e familiares (reservadas até o fim do mandato).
- **LAI, art. 31, § 1º, I** [primária]: informações pessoais relativas à intimidade, vida privada, honra e imagem têm acesso restrito **independentemente de classificação de sigilo** e pelo prazo máximo de **100 anos** a contar da produção.
- **LAI, art. 1º, parágrafo único, I** [primária]: subordinam-se à lei os órgãos da administração direta dos Poderes Executivo, Legislativo, **incluindo as Cortes de Contas**, e Judiciário e do Ministério Público.
- **ISO/IEC 27002:2022**: 5.12 classificação da informação (segundo necessidades de confidencialidade, integridade e disponibilidade e requisitos das partes interessadas; responsabilidade do **proprietário** da informação; revisão periódica, evitando super ou subclassificação); 5.13 **rotulagem**; 5.10 uso aceitável e manuseio [secundária para numeração; conhecimento prévio para o conteúdo]. Esquemas organizacionais típicos: público, interno, restrito/confidencial, secreto.
- Não usado: competência para classificar (art. 27) é federal e Goiás tem regulamento próprio (não lido).

Fontes: https://www.legjur.com/legislacao/art/lei_00125272011-24 · https://www.legjur.com/legislacao/art/lei_00125272011-31 · https://isms.online/iso-27002/control-5-12-classification-of-information

## 4. Controle de acesso e gestão de identidades (IAM)

- Identificação (alegar identidade) → **autenticação** (comprovar) → **autorização** (o que pode fazer) → **auditoria/responsabilização** (registrar) [conhecimento prévio].
- **MFA** exige evidências de pelo menos **dois fatores distintos**: algo que se sabe, algo que se tem, algo que se é. Localização e outros sinais de risco informam a decisão, mas **não substituem** um fator. NIST SP 800-63B-4 classifica SMS/telefone como autenticador **restrito**; passkeys com verificação do usuário são resistentes a phishing [primária: OWASP Multifactor Authentication Cheat Sheet, que cita a SP 800-63B-4].
- NIST SP 800-63B-4 (2025): senha como fator único com mínimo de 15 caracteres; sem regras de composição; sem troca periódica obrigatória (só diante de indício de comprometimento); verificação contra listas de senhas vazadas [secundária].
- **RBAC** (permissões associadas a papéis; modelo NIST/ANSI INCITS 359: núcleo, hierárquico, com restrições — segregação de funções estática e dinâmica) × **ABAC** (NIST SP 800-162: atributos do sujeito, do objeto, da operação e do ambiente avaliados por políticas) [secundária].
- **OAuth 2.0 (RFC 6749)** é arcabouço de **autorização** delegada; **OpenID Connect Core 1.0** acrescenta camada de identidade e o **ID Token (JWT)**; **SAML 2.0 (OASIS)** troca **asserções XML** entre IdP e SP; federação pressupõe relação de confiança entre domínios [secundária].
- ISO/IEC 27002:2022: 5.15 controle de acesso; 5.16 gestão de identidade; 5.17 informações de autenticação; 5.18 direitos de acesso (provisão, revisão periódica, ajuste e remoção, inclusive na movimentação); 8.2 direitos de acesso privilegiado; 8.5 autenticação segura [secundária].

Fontes: https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html · https://www.enzoic.com/blog/nist-sp-800-63b-rev4/ · https://www.ubisecure.com/education/differences-between-saml-oauth-openid-connect · https://openid.net/specs/openid-connect-core-1_0.html · https://datatracker.ietf.org/doc/html/rfc6749 · https://opensecurityarchitecture.org/frameworks/iso-27002-2022

## 5. Criptografia simétrica e assimétrica

- **Simétrica**: mesma chave secreta para cifrar e decifrar; rápida; problema da distribuição de chaves. **AES** (FIPS 197): bloco de 128 bits, chaves de 128/192/256 bits. **DES** (chave efetiva de 56 bits) obsoleto. **3DES/TDEA**: NIST SP 800-131A Rev. 2 tornou a cifração com TDEA de três chaves **desautorizada após 31/12/2023** (decifração de legado permitida) [secundária, citando a SP].
- **Assimétrica**: par de chaves (pública/privada). **RSA** (fatoração), **ECC** (logaritmo discreto em curvas elípticas; mesma segurança com chaves menores — ~128 bits de segurança: RSA-3072 ≈ ECC-256, NIST SP 800-57) [conhecimento prévio].
- **Diffie-Hellman** (1976): acordo de chave, não cifra dados nem assina; sem autenticação das partes é vulnerável a **intermediário (MITM)**; DH/ECDH **efêmero** dá **sigilo futuro (forward secrecy)**; o TLS 1.3 restringe a troca de chaves a (EC)DHE efêmero [secundária].
- **Hash**: MD5 com colisões práticas desde 2004; **SHA-1** com a primeira colisão prática pública em 2017 (SHAttered, Google/CWI); o NIST anunciou (dez./2022) a retirada do SHA-1 de todas as aplicações até **31/12/2030**. SHA-2 e SHA-3 (FIPS 202, 2015) são os recomendados [secundária/primária NIST].
- **Criptografia híbrida (envelope digital)**: dados cifrados com chave simétrica de sessão; essa chave cifrada com a chave pública do destinatário.
- OWASP Top 10:2025, A04: armazenar senhas com funções adaptativas com sal e fator de trabalho (Argon2, yescrypt, scrypt, PBKDF2-HMAC-SHA-512); TLS ≥ 1.2 com forward secrecy; HSTS; preparar-se para criptografia pós-quântica [primária].

Fontes: https://www.nist.gov/node/1557541 · https://csrc.nist.gov/news/2022/nist-transitioning-away-from-sha-1-for-all-apps · https://www.securityweek.com/first-sha-1-collision-attack-conducted-google-cwi/ · https://summerschool-croatia.cs.ru.nl/2019/slides/jager1.pdf · https://github.com/OWASP/Top10/blob/master/2025/docs/en/A04_2025-Cryptographic_Failures.md

## 6. Infraestrutura de chaves públicas, certificados e assinatura digital

- **Assinatura digital**: resumo (hash) do documento cifrado/assinado com a **chave privada do signatário**; verificação com a **chave pública** dele (obtida do certificado). Garante integridade, autenticidade e não repúdio; **não** garante confidencialidade.
- **Certificado X.509 v3 (RFC 5280)**: vincula a chave pública à identidade do titular; contém versão, número de série, algoritmo, emissor, validade, titular, chave pública e extensões; é assinado pela **AC emissora com a chave privada dela**; **não contém a chave privada** do titular [conhecimento prévio].
- **Revogação**: **LCR/CRL** (lista publicada periodicamente pela AC com os certificados revogados — RFC 5280) e **OCSP** (consulta online de status — RFC 6960) [conhecimento prévio].
- **ICP-Brasil (MP 2.200-2/2001)** [primária/secundária, texto consolidado no LegJur e Senado]:
  - art. 13: o **ITI é a AC Raiz**; art. 5º, parágrafo único: é **vedado à AC Raiz emitir certificados para o usuário final**;
  - art. 6º: as AC emitem, expedem, distribuem, revogam e gerenciam certificados e disponibilizam listas de revogados; parágrafo único: o par de chaves é gerado pelo próprio titular e a chave privada de assinatura fica sob seu **exclusivo controle, uso e conhecimento**;
  - art. 7º (redação da Lei 14.063/2020): as **AR** identificam e cadastram usuários e encaminham solicitações às AC; a identificação é **presencial ou por outra forma que garanta nível de segurança equivalente**;
  - art. 10, § 1º: declarações em documento eletrônico com certificação ICP-Brasil **presumem-se verdadeiras** em relação aos signatários (art. 219 do Código Civil); § 2º: outros meios de comprovação de autoria e integridade são admitidos se aceitos pelas partes ou pela pessoa a quem for oposto o documento.
- **Lei 14.063/2020, art. 4º** [primária — Câmara]: assinatura **simples**, **avançada** (certificados não emitidos pela ICP-Brasil ou outro meio aceito pelas partes, vinculada univocamente ao signatário, sob seu controle exclusivo, com detecção de alterações) e **qualificada** (certificado ICP-Brasil, art. 10, § 1º, da MP 2.200-2), esta com o **nível mais elevado de confiabilidade** (§ 1º).

Fontes: https://www.legjur.com/legislacao/htm/mpv_000220022001 · https://legis.senado.leg.br/norma/559102/publicacao/15758145 · https://www2.camara.leg.br/legin/fed/lei/2020/lei-14063-23-setembro-2020-790659-publicacaooriginal-161547-pl.html

## 7. OWASP Top 10:2025 e codificação segura (DevSecOps)

### Lista final [primária: github.com/OWASP/Top10, pasta 2025, README "OWASP Top 10 2025 - RELEASED ... (Final)"]
| Código | Nome oficial (en) | Tradução oficial (pt-BR) |
|---|---|---|
| A01:2025 | Broken Access Control | Controle de Acesso Quebrado |
| A02:2025 | Security Misconfiguration | Configuração Insegura |
| A03:2025 | Software Supply Chain Failures | Falhas na Cadeia de Suprimentos de Software |
| A04:2025 | Cryptographic Failures | Falhas Criptográficas |
| A05:2025 | Injection | Injeção |
| A06:2025 | Insecure Design | Design Inseguro |
| A07:2025 | Authentication Failures | Falhas de Autenticação |
| A08:2025 | Software or Data Integrity Failures | Falhas de Integridade de Software e Dados |
| A09:2025 | Security Logging & Alerting Failures | Falhas de Registro e Alerta de Segurança |
| A10:2025 | Mishandling of Exceptional Conditions | Manuseio Incorreto de Condições Excepcionais |

### O que mudou em relação à 2021 [primária: 0x00_2025-Introduction.md]
- "Duas novas categorias e uma consolidação": novas **A03** e **A10**; **SSRF (A10:2021) foi incorporado à A01**.
- A01 permanece em 1º (3,73% das aplicações com alguma das 40 CWEs; inclui CWE-918 SSRF e CWE-352 CSRF).
- A02 Security Misconfiguration **subiu de 5º para 2º**.
- A03 é **expansão de A06:2021 (Vulnerable and Outdated Components)**: dependências, sistemas de build e infraestrutura de distribuição; menos ocorrências nos dados, mas maiores escores médios de exploração e impacto; votada pela comunidade.
- A04 Cryptographic Failures **caiu de 2º para 4º**; A05 Injection **caiu de 3º para 5º** (inclui XSS e SQL injection); A06 Insecure Design **caiu de 4º para 6º**.
- A07 manteve o 7º lugar e mudou de nome (antes "Identification and Authentication Failures").
- A08 manteve o 8º lugar (integridade de software, código e dados em nível mais baixo que a cadeia de suprimentos; ex.: atualização sem verificação de assinatura, desserialização insegura).
- A09 manteve o 9º lugar e mudou de nome (antes "Security Logging and Monitoring Failures"), para enfatizar o **alerta**: "registro excelente sem alerta tem valor mínimo".
- A10 nova (24 CWEs): tratamento inadequado de erros, erros lógicos, **falha aberta (failing open)** e condições anormais. Prevenção: capturar a exceção onde ocorre, tratador global, registrar e alertar, **falhar fechado** e **reverter integralmente** a transação interrompida (não tentar recuperá-la pela metade), limites de recursos (rate limiting, cotas).
- Metodologia: 8 categorias pelos dados (mais de 2,8 milhões de aplicações; 589 CWEs analisadas; 248 CWEs nas 10 categorias) e **2 pela pesquisa com a comunidade**; foco na **causa raiz**; máximo de 40 CWEs por categoria.
- Prevenção (trechos usados): A01 — controle de acesso no **servidor**, negar por padrão, impor propriedade do registro, invalidar sessão no logout, JWT de vida curta, registrar falhas e limitar taxa; A03 — SBOM, inventário contínuo de dependências diretas e transitivas, monitorar CVE/NVD/OSV, SCA, componentes de fontes oficiais e assinados, **segregação de funções** no pipeline, implantação escalonada (canário), endurecer repositórios ("não versionar segredos"); A05 — API segura/consultas parametrizadas; validação positiva no servidor não é defesa completa.

### DevSecOps [primária: OWASP DevSecOps Guideline, github.com/OWASP/DevSecOpsGuideline]
- **SAST**: analisa código-fonte, bytecode ou binários **sem executar**; caixa-branca; roda cedo (IDE, pre-commit, CI) — pilar do **shift-left**.
- **DAST**: testa a aplicação **em execução, de fora** (caixa-preta); acha problemas de configuração, sessão e autenticação; não aponta a linha de código; roda mais tarde.
- **IAST**: **agente instrumentado** dentro da aplicação em execução, observando o fluxo de dados durante testes funcionais; aponta arquivo/linha com contexto de execução; não exige código-fonte.
- **SCA**: identifica componentes de terceiros (inclusive dependências transitivas), CVEs conhecidas, licenças e pacotes maliciosos; base do SBOM (caso Log4Shell, CVE-2021-44228).
- **Segredos**: segredo que chega a um repositório Git "deve ser considerado comprometido" (histórico, clones, bots) — revogar/rotacionar; prevenir com varredura no pre-commit e no CI e cofre de segredos.

Fontes: https://github.com/OWASP/Top10/tree/master/2025/docs · https://owasp.org/Top10/2025/ · https://github.com/OWASP/Top10/blob/master/2025/docs/pt-BR/0x00_2025-Introduction.md · https://github.com/OWASP/DevSecOpsGuideline · https://owasp.org/www-project-devsecops-guideline/

## 8. Segurança em APIs, containers e nuvem

- **OWASP API Security Top 10:2023** (edição vigente; a anterior é de 2019) [primária: github.com/OWASP/API-Security, editions/2023/en/0x11-t10.md]: API1 Broken Object Level Authorization (BOLA); API2 Broken Authentication; API3 **Broken Object Property Level Authorization** (funde Excessive Data Exposure e **Mass Assignment** de 2019); API4 Unrestricted Resource Consumption; API5 Broken Function Level Authorization (BFLA); API6 Unrestricted Access to Sensitive Business Flows; API7 Server Side Request Forgery; API8 Security Misconfiguration; API9 Improper Inventory Management; API10 Unsafe Consumption of APIs. BOLA: checar autorização em toda função que acessa registro a partir de ID enviado pelo cliente; preferir GUIDs aleatórios (complementar, não substituto).
- **Containers** — NIST SP 800-190 (2017) organiza riscos em imagem, registro, orquestrador, container e SO do host; riscos de imagem: vulnerabilidades, defeitos de configuração, malware embutido, **segredos em texto claro embutidos**, imagens não confiáveis [secundária]. OWASP Docker Security Cheat Sheet [primária]: containers **compartilham o kernel do host** (manter host e engine atualizados); **não expor o socket do Docker** (montá-lo "somente leitura" não torna a API somente leitura); **definir usuário sem privilégios**; remover capacidades (`--cap-drop all`) e **não usar `--privileged`**; sistema de arquivos somente leitura; limitar recursos; varredura de imagens no CI; assinatura de imagens, SBOM, registro confiável.
- **Nuvem — responsabilidade compartilhada** [secundária: Microsoft Learn]: em on-premises, IaaS, PaaS e SaaS, **dados, contas/identidades e configurações de acesso** permanecem com o cliente; segurança física do datacenter é do provedor nos modelos em nuvem; em IaaS o cliente cuida do SO convidado (patches), da rede virtual e das aplicações. (Dispositivos do cliente aparecem como "compartilhado" em SaaS na tabela oficial — por isso as questões não usam "dispositivos" como responsabilidade sempre exclusiva.) ISO/IEC 27002:2022, 5.23: segurança da informação para uso de serviços em nuvem (controle novo).

Fontes: https://github.com/OWASP/API-Security/tree/master/editions/2023/en · https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html · https://csrc.nist.gov/files/pubs/shared/itlb/itlbul2017-10.pdf · https://learn.microsoft.com/en-in/azure/security/fundamentals/shared-responsibility

## 9. Backup, continuidade de negócios e recuperação de desastres

- **Completo**: copia tudo. **Incremental**: o que mudou desde o **último backup de qualquer tipo**; restauração = último completo + **todos** os incrementais posteriores, **em ordem**. **Diferencial**: o que mudou desde o **último completo**; restauração = último completo + **último** diferencial. Completo e incremental limpam o bit de arquivamento; diferencial não [secundária: JumpCloud, ComputerWeekly, Professor Messer].
- **Regra 3-2-1**: 3 cópias (1 primária + 2 backups), em 2 tipos de mídia, 1 fora do local (atribuída ao paper "Data Backup Options", US-CERT/CMU, 2012); variações como 3-2-1-1-0 acrescentam cópia offline/imutável e zero erro na verificação [secundária].
- CISA #StopRansomware Guide: manter backups **offline e cifrados** dos dados críticos e **testar** periodicamente disponibilidade e integridade em cenário de recuperação [secundária: página da CISA].
- **RPO**: ponto até o qual a informação deve ser restaurada (perda máxima tolerável, medida em tempo) — orienta a frequência de cópia/replicação. **RTO**: prazo para retomar a atividade em nível mínimo aceitável; **RTO ≤ MTPD** (período máximo tolerável de interrupção) [secundária: relatório de BIA do TRE-SE].
- **BIA** (ISO 22301:2019, 8.2.2; diretrizes na ISO/TS 22317): identifica atividades prioritárias, impactos ao longo do tempo, dependências e recursos, e fixa prazos de retomada [secundária]. ISO/IEC 27002:2022: 5.29 segurança durante disrupção; **5.30 prontidão de TIC para continuidade** (novo); 8.13 backup; 8.14 redundância.
- **Sites**: **quente** (equipado, dados replicados, retomada em minutos/horas, mais caro); **morno** (infraestrutura parcial, exige restaurar dados/configurar, horas a dias); **frio** (espaço, energia e climatização sem equipamentos, dias a semanas, mais barato) [conhecimento prévio].

Fontes: https://jumpcloud.com/blog/incremental-vs-differential-backup-understanding-the-differences · https://www.backblaze.com/blog/the-3-2-1-backup-strategy/ · https://www.cisa.gov/stopransomware/ransomware-guide · https://www.tre-se.jus.br/institucional/governanca-e-gestao/gestao-e-planejamento/gestao-de-continuidade-de-negocio-1/repositorio/relatorio-de-analise-de-impacto-no-negocio

## 10. Malware, ransomware, phishing e engenharia social

- **Cartilha de Segurança para Internet (CERT.br), fascículo Códigos Maliciosos** [secundária/conhecimento prévio]: **vírus** se propaga inserindo cópias de si em programas/arquivos e **depende da execução do hospedeiro**; **worm** se propaga **automaticamente** pelas redes, por execução direta de cópias ou exploração de vulnerabilidades, sem se anexar a arquivos; **bot** = worm + comunicação com o invasor (controle remoto; conjunto = **botnet**); **cavalo de troia** executa funções aparentes e, às ocultas, maliciosas (não se replica); **rootkit** esconde e assegura a presença do invasor; **backdoor** garante o retorno; **spyware** monitora e envia dados (keylogger, screenlogger, adware); **ransomware** torna dados inacessíveis (geralmente por criptografia) e exige resgate.
- **Dupla extorsão** [secundária: CISA #StopRansomware Guide]: exfiltrar dados e ameaçar publicá-los, além de cifrar; há grupos que só exfiltram. Resposta: isolar imediatamente os sistemas afetados; desligar só se não for possível desconectar (desligar destrói evidências na memória volátil); restaurar a partir de backups limpos após contenção/erradicação; pagamento não é recomendado.
- **Phishing**: spear phishing (direcionado), **whaling** (alto escalão), **smishing** (SMS), **vishing** (voz), **pharming** (redirecionamento por envenenamento de DNS/hosts), BEC; engenharia social: pretexting, baiting, tailgating/piggybacking, quid pro quo [conhecimento prévio].

Fontes: https://cartilha.cert.br/ · https://cartilha.cert.br/ransomware/ransomware-slides-notas.pdf · https://www.cisa.gov/stopransomware/ransomware-guide

## 11. Firewalls, antivírus e IDS/IPS

- **NIST SP 800-41 Rev. 1 (2009)**: filtro de pacotes atua na camada de rede, sem analisar conteúdo; **stateful** mantém tabela de estado por conexão e bloqueia pacotes fora do estado esperado [secundária, boletim ITL]. Política recomendada de negar por padrão [conhecimento prévio].
- **NGFW**: identifica aplicações e usuários, inspeção profunda, IPS integrado; **WAF**: camada de aplicação (HTTP), protege contra injeção/XSS (ex.: ModSecurity + OWASP Core Rule Set, citado na A09:2025) [conhecimento prévio + primária OWASP].
- **NIST SP 800-94 (2007)** (a Rev. 1 de 2012 ficou em minuta, aposentada em 2022): classes de IDPS — rede, sem fio, análise de comportamento de rede (NBA) e host; metodologias — **assinatura**, **anomalia** e **análise de protocolo com estado** [secundária]. IPS fica **em linha** e bloqueia; IDS monitora (em regra cópia do tráfego) e alerta; assinatura → poucos falsos positivos para ameaças conhecidas, cega para o inédito; anomalia → detecta o novo, mais falsos positivos.
- **EDR**: telemetria contínua do endpoint, detecção comportamental e resposta (isolar máquina, encerrar processo) [conhecimento prévio]. ISO/IEC 27002:2022, 8.7 proteção contra malware; 8.16 atividades de monitoramento (novo); 8.20 segurança de redes; 8.22 segregação de redes; 8.23 filtragem web (novo).

Fontes: https://csrc.nist.gov/files/pubs/shared/itlb/itlbul2009-10.pdf · https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-94.pdf

## 12. Testes de invasão e análise de vulnerabilidades

- **NIST SP 800-115 (2008)**: metodologia de teste de invasão em **quatro fases — planejamento, descoberta, ataque e relatório**; o planejamento define regras de engajamento, escopo e **aprovação por escrito** [secundária].
- Caixa **preta** (sem conhecimento prévio), **cinza** (conhecimento parcial, ex.: credencial de usuário comum), **branca** (conhecimento amplo: código-fonte, arquitetura) [conhecimento prévio].
- **Varredura de vulnerabilidades**: automatizada, identifica falhas conhecidas e configurações fracas, pode gerar falsos positivos, em regra não explora. **Pentest**: tenta explorar para validar e demonstrar impacto. Do lado de quem contrata/audita: autorização formal, escopo, janelas, contatos de emergência, tratamento dos dados obtidos, relatório com recomendações e reteste.

Fontes: https://blog.rsisecurity.com/nists-penetration-testing-recommendations-explained/

## 13. Zero Trust

- **NIST SP 800-207 (ago./2020)** [secundária/primária via OWASP Zero Trust Architecture Cheat Sheet, que cita a seção 2.1]: sete princípios — todos os dados e serviços são recursos; toda comunicação é protegida **independentemente da localização na rede**; acesso concedido **por sessão** (a seção 2.1 admite avaliação de confiança suficientemente recente — **não exige novo login interativo a cada requisição**); acesso determinado por **política dinâmica**; monitoramento contínuo da postura dos ativos; autenticação e autorização dinâmicas e estritamente aplicadas antes do acesso; coleta de informações para melhorar a postura.
- Componentes lógicos (seção 3): **Policy Engine (PE)** decide (algoritmo de confiança); **Policy Administrator (PA)** estabelece/encerra o caminho de comunicação e comanda o PEP; PE + PA = **Policy Decision Point (PDP)**; **Policy Enforcement Point (PEP)** habilita, monitora e encerra conexões junto ao recurso. Fontes de dados: CDM, threat intelligence, logs/SIEM, políticas de acesso, PKI, gestão de identidades.
- Abordagens de implantação: governança de identidade aprimorada, **microssegmentação**, perímetro definido por software. "Nunca confiar, sempre verificar"; elimina confiança implícita da rede interna; reduz movimento lateral.
- **CISA Zero Trust Maturity Model 2.0 (abr./2023)**: cinco pilares (identidade, dispositivos, redes, aplicações e cargas de trabalho, dados), três capacidades transversais (visibilidade e análise; automação e orquestração; governança) e estágios **tradicional, inicial, avançado e ótimo** [secundária].

Fontes: https://cheatsheetseries.owasp.org/cheatsheets/Zero_Trust_Architecture_Cheat_Sheet.html · https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf · https://www.cisa.gov/sites/default/files/2023-04/zero_trust_maturity_model_v2_508.pdf

## 14. Família ABNT NBR ISO/IEC 27000

- **ISO/IEC 27001:2022** (publicada em 25/10/2022; ABNT NBR ISO/IEC 27001:2022): requisitos do SGSI nas **cláusulas 4 a 10**; **não é aceitável excluir** requisitos dessas cláusulas para declarar conformidade (cláusula 1) [conhecimento prévio]. **Anexo A: 93 controles em 4 temas — organizacionais (37, 5.1–5.37), pessoas (8, 6.1–6.8), físicos (14, 7.1–7.14) e tecnológicos (34, 8.1–8.34)**; a edição de 2013 tinha **114 controles em 14 domínios** (A.5–A.18). Reestruturação: 11 novos, 57 fundidos em 24, 23 renomeados, 35 mantidos [secundária, várias fontes concordantes]. Transição de certificados 2013 encerrada em **31/10/2025**.
- **11 controles novos**: 5.7 inteligência de ameaças; 5.23 serviços em nuvem; 5.30 prontidão de TIC para continuidade; 7.4 monitoramento de segurança física; 8.9 gestão de configuração; 8.10 exclusão de informações; 8.11 mascaramento de dados; 8.12 prevenção de vazamento de dados; 8.16 atividades de monitoramento; 8.23 filtragem web; 8.28 codificação segura [secundária].
- **Declaração de Aplicabilidade (6.1.3 d)**: controles necessários, justificativa de inclusão, se estão implementados e **justificativa de exclusão** de controles do Anexo A; não é obrigatório implementar os 93 [secundária].
- **ISO/IEC 27002:2022**: orientação (não certificável); cada controle tem **atributos**: tipo de controle (preventivo, detectivo, corretivo), propriedades de SI (C, I, D), conceitos de segurança cibernética (identificar, proteger, detectar, responder, recuperar — ISO/IEC TS 27110), capacidades operacionais e domínios de segurança (governança e ecossistema, proteção, defesa, resiliência) [secundária].
- **PDCA**: a ISO/IEC 27001:2005 adotava expressamente o modelo PDCA; a 2013 retirou essa exigência (alinhamento ao Anexo SL) e deixou à organização a escolha do método de **melhoria contínua** (cláusula 10); o fluxo PDCA continua compatível (4–7 ≈ Plan, 8 ≈ Do, 9 ≈ Check, 10 ≈ Act) [secundária para 2013; conhecimento prévio para 2022].
- **ISO/IEC 27001:2022/Amd 1:2024** (fev./2024): acrescenta à 4.1 que a organização deve determinar se a **mudança climática** é questão relevante, e nota na 4.2; **nenhum controle novo** no Anexo A [secundária].
- Outras: 27005 (riscos), 27035 (incidentes), 27701 (privacidade), 27017/27018 (nuvem) [conhecimento prévio].

Fontes: https://www.welivesecurity.com/br/2023/02/09/iso-270012022-quais-foram-as-principais-mudancas-na-nova-norma-de-seguranca/ · https://www.dqsglobal.com/blog/new-iso-27001-2022-key-changes · https://www.scrut.io/hub/iso-27001/iso-27001-statement-of-applicability · https://www.tuvsud.com/en-in/services/auditing-and-system-certification/climate-action-changes-amendment-1-in-management-system-standards · https://www.scribd.com/doc/207947808/BSI-ISO-IEC-27001-Transition-Guide

## Pontos de cautela

1. **OWASP Top 10:2025 — RC × final.** O RC1 foi divulgado em novembro de 2025. Em 13/12/2025 a A09 foi renomeada de "Logging & Alerting Failures" para **"Security Logging & Alerting Failures"** (commit 2a2effd/f999bc2 no repositório oficial); em 24/12/2025 o aviso de "Release Candidate" foi removido (commit d4d000e) e o README passou a dizer "RELEASED ... (Final)". Material de cursinho feito sobre o RC pode trazer o nome antigo da A09. Não cobrar números de CWE por categoria além dos citados na introdução.
2. **A08 tem grafia oscilante**: o título 2025 é "Software **or** Data Integrity Failures" (2021: "Software **and** Data Integrity Failures"); a própria documentação ainda mistura as duas formas e a tradução pt-BR usa "Software e Dados". Evitar questão que dependa da conjunção.
3. **SSRF não sumiu**: foi incorporado à A01:2025 (CWE-918). Na OWASP **API** Security Top 10:2023, SSRF continua categoria própria (API7). Não confundir as duas listas.
4. **NIST SP 800-61**: a Rev. 3 (abr./2025) substituiu a Rev. 2. As quatro fases (Preparação; Detecção e Análise; Contenção, Erradicação e Recuperação; Pós-Incidente) são da Rev. 2. Questão que cite "as fases da revisão vigente" sem qualificar é ambígua — sempre nomear a revisão.
5. **ISO/IEC 27005**: a versão ABNT é **2023** (adoção da ISO/IEC 27005:2022). Citar "ISO/IEC 27005:2022 (ABNT NBR ISO/IEC 27005:2023)". Sinônimos de mercado (mitigar, transferir, aceitar) equivalem a modificar, compartilhar, reter: distratores não podem usar sinônimos da resposta certa.
6. **ISO/IEC 27000:2026** (6ª edição, julho/2026) foi publicada com novo foco (conceitos e princípios, menos vocabulário). As definições de CIDAN foram citadas pela edição 2018. Não cobrar o conteúdo da 2026.
7. **ISO 27001 e PDCA**: não afirmar que a 27001:2022 "exige o PDCA"; exige melhoria contínua.
8. **CVSS**: o escore não é risco; Supplemental não altera o escore; "Temporal" é nome da v3.x. O NVD deixou de enriquecer todas as CVEs (2026): não afirmar que "o NVD atribui CVSS a todas as CVEs".
9. **LAI**: prazos contam da **produção**, não da classificação; informação pessoal (art. 31) tem restrição independente de classificação. Competência para classificar (art. 27) é regra federal — não cobrada.
10. **ICP-Brasil**: a vinculação ministerial do ITI mudou por atos posteriores (o texto original da MP fala em Ministério da Ciência e Tecnologia) — não cobrada. Prazos de validade de certificados A1/A3 não foram reconferidos — não cobrados.
11. **Responsabilidade compartilhada**: dados, identidades e acessos ficam sempre com o cliente; "dispositivos" aparecem como compartilhados em SaaS na tabela da Microsoft — não usar como regra absoluta.
12. **NIST SP 800-63B-4**: datas de publicação divergem entre fontes (julho × agosto/2025) — não cobrar a data.
13. Não confirmados nesta sessão (orçamento de buscas esgotado): glossário do GSI/PR (Portaria 93/2021), redação do Decreto 9.637/2018, edição ABNT vigente da ISO 22301, texto integral das fases da ISO/IEC 27035-1:2023. Nenhuma questão depende deles.
