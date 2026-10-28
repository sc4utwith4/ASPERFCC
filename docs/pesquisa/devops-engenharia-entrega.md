# Pesquisa — DevOps, Plataforma de Desenvolvimento e Engenharia de Entrega

Matéria `devops-engenharia-entrega` (prefixo `devops`), 4 questões de peso 2 na prova. Pesquisa feita em 28/10/2026. As fontes primárias foram lidas nos repositórios oficiais no GitHub (arquivos-fonte das documentações). "Fonte secundária" indica busca na web sem leitura da página oficial completa.

## 1. CI/CD e pipelines
- **Integração contínua (CI):** integrar no tronco com frequência (pelo menos diária), com build e testes automáticos a cada integração (Fowler, *Continuous Integration*).
- **Entrega contínua:** o software fica sempre em condição de ser implantado; a ida para produção é **decisão de negócio** e pode exigir acionamento/aprovação manual. **Implantação contínua:** toda mudança que passa no pipeline vai **automaticamente** para produção; pressupõe entrega contínua (Fowler, bliki *ContinuousDelivery*; artigo *Continuous Integration*).
- **Pipeline de implantação:** estágio de commit (build + testes rápidos) → testes de aceitação automatizados → outros testes (desempenho, segurança, exploratórios) → implantação. Prática "construir o binário uma única vez" e **promover o mesmo artefato** entre ambientes (Humble & Farley, *Continuous Delivery*, cap. 5). Fowler, bliki *DeploymentPipeline*.
- **Estratégias:** *blue-green* = dois ambientes idênticos, troca do roteador, rollback revertendo a troca; *canary* = nova versão para um pequeno subconjunto de usuários/infraestrutura, ampliado gradualmente, rollback = reencaminhar para a versão antiga (Fowler, *BlueGreenDeployment*, *CanaryRelease*). *Rolling update* no Kubernetes: padrão de 25% `maxUnavailable` e 25% `maxSurge`; `kubectl rollout undo` volta à revisão anterior (kubernetes/website, `deployment.md`). *Feature flags* separam implantação de liberação (Hodgson/Fowler, *Feature Toggles*).
- **DORA (fonte primária: dora-team/dora.dev, guia atualizado em 05/01/2026):** cinco métricas de desempenho de entrega, em dois fatores.
  - **Throughput:** *change lead time* (do commit à produção), *deployment frequency* e *failed deployment recovery time*.
  - **Instability:** *change fail rate* (implantações que exigem intervenção imediata: rollback ou hotfix) e *deployment rework rate* (implantações não planejadas, feitas por causa de incidente em produção).
  - Histórico (página *A history of DORA's software delivery metrics*): 2023 trocou MTTR/"time to restore service" por *failed deployment recovery time* (só falhas causadas por mudança). 2024 incluiu a 5ª métrica (*rework rate*). Antes, o tempo de recuperação era métrica de estabilidade; no modelo atual fica em throughput.
  - DORA alerta contra transformar métrica em meta (lei de Goodhart) e contra comparar aplicações muito diferentes.

## 2. Automação de build e de testes
- Pirâmide de testes (Cohn; Fowler, bliki *TestPyramid*): muitos testes de unidade (rápidos, baratos), menos testes de serviço/integração, poucos testes de ponta a ponta/UI (lentos, frágeis). *Não relido nesta sessão; conceito consolidado.*
- Paralelismo: GitHub Actions maximiza jobs paralelos (jobs são paralelos por padrão; `needs` cria dependência; `matrix` gera até 256 jobs por execução). GitLab: jobs do mesmo estágio rodam em paralelo; a palavra-chave `parallel` cria N instâncias (`test 1/5`…). Fontes: github/docs `workflow-syntax.md`; gitlabhq `doc/ci/yaml/_index.md`.
- Cache: GitLab diferencia **cache** (dependências baixadas, reaproveitadas entre execuções) de **artifacts** (resultado de job repassado a estágios seguintes, guardado no GitLab) — `doc/ci/caching/_index.md`. Chave de cache derivada do hash do lockfile (`hashFiles` no Actions, `cache:key:files` no GitLab).
- Gate de qualidade: conjunto de condições (cobertura, duplicação, vulnerabilidades, testes) que interrompe o pipeline se não forem atendidas. *Conceitual.* "Falhar rápido": etapas baratas primeiro.

## 3. Infraestrutura como código e gerenciamento de configuração
- Declarativo (descreve o estado desejado) × imperativo (descreve os passos). Idempotência: executar uma ou várias vezes leva ao mesmo resultado (glossário oficial do Ansible: módulos "idempotentes", só mudam o necessário).
- Ansible: **sem agente**, sem daemon residente; módulos enviados ao nó e removidos após a execução; modo **push** é o padrão (via SSH/WinRM); existe `ansible-pull` como opção (ansible-documentation, glossário: *Push Mode*, *Pull Mode*, *Modules*).
- Puppet e Chef: modelo clássico **com agente** que consulta o servidor (pull). Puppet agent a cada 30 min por padrão (*fonte secundária*). Intervalo padrão do Chef: *não confirmado nesta sessão*.
- OpenTofu/Terraform: o **estado** (`terraform.tfstate`, local por padrão) mapeia recursos reais à configuração; backends remotos permitem **lock** de estado; `plan` compara configuração, estado e mundo real; modo `-refresh-only` só atualiza o estado com mudanças externas; `refresh=false` pode ignorar *drift* (opentofu/opentofu `website/docs`).
- GitOps (OpenGitOps v1): estado desejado **declarativo**, **versionado e imutável**, **puxado automaticamente** por agentes e **reconciliado continuamente** (open-gitops/documents `PRINCIPLES.md`).
- Infraestrutura imutável: não se altera servidor em produção; cria-se nova imagem e substitui-se (Fowler, *ImmutableServer*, *SnowflakeServer*). *Não relido nesta sessão.*

## 4. Observabilidade: métricas, logs e traces
- OpenTelemetry suporta hoje **traces, métricas, logs e baggage**; *events* e *profiles* estão em desenvolvimento/proposta (opentelemetry.io `concepts/signals`).
- Instrumentação: **code-based** (API/SDK, telemetria rica de dentro da aplicação) e **zero-code** (antes chamada "automática"; bibliotecas e ambiente, "nas bordas"); podem ser usadas juntas (`concepts/instrumentation`).
- **Collector:** recebe, processa e exporta telemetria de forma neutra quanto a fornecedor; pipelines com receivers, processors e exporters (e connectors); implantável como agente ou gateway (`collector/_index.md`, `architecture.md`).
- **Propagação de contexto:** move o contexto entre serviços; propagador padrão W3C TraceContext, cabeçalho `traceparent` (`concepts/context-propagation`). Permite correlacionar sinais (ex.: `trace_id` nos logs).

## 5. Monitoramento, alertas e indicadores técnicos
- **Quatro sinais de ouro:** latência, tráfego, erros e saturação; separar a latência das requisições bem-sucedidas da das falhas; saturação = quão "cheio" está o recurso mais restrito (Google SRE Book, cap. 6). Alertar por **sintoma** (o que o usuário sente), com alertas por causa só para problemas iminentes e definidos (mesmo capítulo; fonte via busca).
- **RED** (Tom Wilkie): Rate, Errors, Duration, por serviço/endpoint. **USE** (Brendan Gregg): Utilization, Saturation, Errors, por recurso (CPU, memória, disco, filas). *Fonte secundária.*
- **SLI/SLO/SLA e error budget** (SRE Book, cap. 3 e 4): SLI = medida quantitativa do nível de serviço; SLO = valor-alvo para um SLI; SLA = contrato com consequências se o SLO não for cumprido; orçamento de erro = 1 − SLO (99,9% em 30 dias = 43,2 min). *Definições não relidas nesta sessão.*
- **Prometheus:** séries temporais com rótulos chave-valor; coleta por **pull** via HTTP; Pushgateway para jobs de curta duração; PromQL; Alertmanager trata alertas; Grafana para visualização (prometheus/docs `overview.md`). Contador só cresce ou zera no reinício; gauge sobe e desce (`metric_types.md`).

## 6. Git distribuído, GitHub e GitLab
- Cada clone tem o histórico completo; commit é local; `push`/`fetch` sincronizam; `pull` = `fetch` + integração (merge ou rebase). `revert` cria commit inverso (seguro em branch compartilhada); `reset` + `push --force` reescreve histórico publicado. *Conhecimento consolidado da documentação do Git.*
- GitHub: *pull request*; GitLab: *merge request*. Branch protection do GitHub: por padrão a regra **impede force push e exclusão**; opções como exigir revisões, status checks, histórico linear, commits assinados, merge queue (github/docs `about-protected-branches.md`).
- CODEOWNERS no GitHub: `.github/`, raiz ou `docs/` (busca nessa ordem); revisores solicitados automaticamente; vale o arquivo do **branch base** do PR; a **última** regra que casa tem precedência; não solicita em PR rascunho (`about-code-owners.md`). No GitLab: raiz, `docs/`, `.gitlab/` (nessa ordem; usa o primeiro encontrado).

## 7. Estratégias de branching
- **Git Flow** (Driessen, 2010): `master`/`main` e `develop` permanentes; `feature` (de develop para develop), `release` (de develop para main e develop), `hotfix` (de main para main e develop). Nota do autor (2020): modelo pensado para software com várias versões em uso; para web apps entregues continuamente, sugere fluxo mais simples. *Texto integral da nota não confirmado nesta sessão.*
- **GitHub Flow:** fluxo leve baseado em branches: cria branch, abre PR, revisa, faz merge e apaga o branch (github/docs `github-flow.md`).
- **Trunk-based:** todos colaboram em um único branch (trunk/main), sem branches de desenvolvimento de longa duração; branches de feature curtos (no máximo cerca de **dois dias**); viabiliza CI/CD; usa feature flags e *branch by abstraction* (paul-hammant/tbd).

## 8. Pull/merge requests e revisão de código
- Ver itens 6 e 7. Revisões obrigatórias, *dismiss stale approvals*, status checks obrigatórios, resolução de conversas. Boas práticas: PRs pequenos, verificação automática antes da revisão humana, revisão por outra pessoa (segregação de funções).

## 9. Docker e Docker Compose
- Imagem = modelo somente leitura em camadas; container = instância em execução com camada gravável.
- Cache de build: se uma camada muda, todas as seguintes são refeitas (docker/docs `build/cache`). Copiar o manifesto de dependências antes do código.
- `CMD`: só o último vale; fornece padrões, sobrescritos pelos argumentos do `docker run`. `ENTRYPOINT` (forma exec) recebe esses argumentos; troca-se com `--entrypoint`. Forma shell de `ENTRYPOINT` ignora `CMD` e argumentos e não repassa sinais (moby/buildkit `reference.md`).
- `EXPOSE` **não publica** a porta, é documentação; publicar com `-p`/`-P`. `ADD` aceita URLs remotas e extrai tar local; `COPY` só copia do contexto ou de outro estágio. `USER` para rodar sem root (`best-practices.md`).
- Multi-stage: vários `FROM`, `COPY --from` copia só o necessário (`multi-stage.md`).
- Volumes = gerenciados pelo Docker, mecanismo preferido para persistência; bind mount = caminho do host montado no container. Redes bridge definidas pelo usuário têm DNS automático entre containers; na bridge padrão, só por IP.
- Compose: arquivo padrão `compose.yaml` (aceita `docker-compose.yml`); `version` é obsoleto; `depends_on` só espera o container estar *rodando*, a menos que use `condition: service_healthy` com `healthcheck` (ou `service_completed_successfully`).

## 10. Kubernetes (kubernetes/website)
- Plano de controle: kube-apiserver, etcd (chave-valor consistente), kube-scheduler (atribui Pods sem nó), kube-controller-manager, cloud-controller-manager (opcional). Nó: kubelet, kube-proxy (**hoje marcado como opcional**), runtime de containers.
- Deployment gerencia ReplicaSets (não usar ReplicaSet direto); StatefulSet = identidade estável e armazenamento persistente; DaemonSet = uma cópia por nó; Job = execução até concluir; CronJob = Jobs em agenda.
- Service: `ClusterIP` (padrão, interno), `NodePort` (porta 30000–32767 em cada nó), `LoadBalancer` (externo, depende de provedor), `ExternalName` (CNAME). **Ingress está congelado**; o projeto recomenda Gateway API.
- Secret: por padrão **não criptografado** no etcd; valores de `data` em base64 (codificação, não sigilo); habilitar criptografia em repouso e RBAC.
- Probes: *startup* suspende liveness e readiness até ter sucesso; *liveness* falha → kubelet reinicia o container; *readiness* falha → Pod sai dos EndpointSlices dos Services, sem reinício.
- Requests usados no agendamento; limite de CPU → throttling; limite de memória → OOM kill. HPA (`autoscaling/v2`): laço de controle, `desired = ceil(atual × métrica atual / alvo)`.

## 11. Ambientes de desenvolvimento, homologação e produção
- 12-Factor, fator X (*Dev/prod parity*): reduzir as lacunas de tempo, de pessoal e de ferramentas; manter dev, staging e produção tão semelhantes quanto possível (heroku/12factor). Fator III: configuração no ambiente.
- LGPD (Lei 13.709/2018): art. 6º, III (necessidade) e VII (segurança); art. 5º, XI (anonimização) e art. 12 (dado anonimizado não é dado pessoal, salvo reversão); art. 46 (medidas de segurança). Para homologação: preferir dados sintéticos ou anonimizados/mascarados.

## 12. GitHub Actions, GitLab CI/CD e Jenkins
- **GitHub Actions:** workflows em `.github/workflows`; `on`, `jobs`, `runs-on`, `steps`, `uses`, `run`, `secrets`, `strategy.matrix`, `needs`. Jobs paralelos por padrão; job que falha faz pular os dependentes (salvo `always()`). Segredos mascarados nos logs (redação não garantida). **Environments:** até 6 revisores obrigatórios, basta 1 aprovar; opção de impedir autoaprovação; wait timer de 1 a 43.200 min; segredos do environment só ficam disponíveis após a aprovação.
- **GitLab CI/CD:** `.gitlab-ci.yml`; estágios padrão `.pre`, `build`, `test`, `deploy`, `.post`; job sem `stage` vai para `test`; mesmo estágio em paralelo; `needs` cria DAG (até 50 jobs); `rules` avaliadas em ordem, a primeira que casa decide; `only`/`except` estão na página de palavras-chave obsoletas; `when: manual`; runners de instância (antes "shared"), grupo e projeto; protected environments.
- **Jenkins:** sintaxes **declarativa** (`pipeline { }` no topo, `agent` obrigatório no topo, `stages`, `steps`, `post { always { } }`) e **scripted** (DSL Groovy de propósito geral, `node { }`, execução sequencial com controle de fluxo Groovy). `Jenkinsfile` versionado = "Pipeline-as-code" (jenkins-infra/jenkins.io).

## Fontes
- dora-team/dora.dev: `hugo/content/guides/dora-metrics/_index.md`; `hugo/content/insights/dora-metrics-history/index.md`.
- kubernetes/website: `content/en/docs/concepts/` (`overview/components.md`, `configuration/secret.md`, `services-networking/service.md`, `ingress.md`, `workloads/pods/pod-lifecycle.md`, `workloads/controllers/*.md`, `configuration/manage-resources-containers.md`, `workloads/autoscaling/horizontal-pod-autoscale.md`).
- docker/docs (`content/manuals/build/...`, `engine/storage/...`, `engine/network/...`, `compose/...`, `reference/compose-file/...`); moby/buildkit `frontend/dockerfile/docs/reference.md`.
- github/docs: `actions/reference/workflows-and-actions/workflow-syntax.md` e `deployments-and-environments.md`; `actions/concepts/security/secrets.md`; `repositories/.../about-code-owners.md` e `about-protected-branches.md`; `get-started/using-github/github-flow.md`.
- gitlabhq/gitlabhq (espelho mantido pela própria GitLab): `doc/ci/yaml/_index.md`, `doc/ci/caching/_index.md`, `doc/ci/runners/_index.md`, `doc/user/project/codeowners/_index.md`, `doc/ci/environments/protected_environments.md`.
- open-telemetry/opentelemetry.io: `content/en/docs/concepts/` e `collector/`.
- prometheus/docs: `docs/introduction/overview.md`, `docs/concepts/metric_types.md`.
- jenkins-infra/jenkins.io: `content/doc/book/pipeline/syntax.adoc` e `index.adoc`.
- ansible/ansible-documentation (glossário); opentofu/opentofu (`website/docs/language/state`, `cli/commands/plan.mdx`); open-gitops/documents; heroku/12factor; paul-hammant/tbd.
- Web: martinfowler.com (ContinuousDelivery, CanaryRelease, BlueGreenDeployment); sre.google (cap. 6); grafana.com (RED); nvie.com (Git Flow, via cópias).

## Pontos de cautela
- Não chamar o tempo de recuperação de "MTTR" nem de métrica de estabilidade no modelo DORA atual. Também não falar em "quatro métricas" como modelo vigente: desde 2024 são cinco. Em 2021, "confiabilidade" era tratada como métrica operacional à parte.
- kube-proxy aparece hoje como componente **opcional** na documentação; evitar "obrigatório em todo nó".
- Ingress não foi removido nem depreciado: está **congelado** (GA, sem novas funções); a recomendação é Gateway API.
- Docker atualizou a orientação sobre `ADD`: é o recomendado para baixar artefato remoto, com validação de checksum. Não cobrar "nunca use ADD".
- OpenTelemetry passou a falar em instrumentação **zero-code** e **code-based**; "automática/manual" ainda aparece em materiais de estudo. Logs, métricas e traces são estáveis; *profiles* não é sinal estável.
- Ansible tem `ansible-pull`: não cobrar "Ansible nunca opera em pull". Puppet pode usar `puppet apply` sem servidor: dizer "modelo clássico com agente".
- GitHub Environments: limites de plano (revisores obrigatórios só em repositório público nos planos Free, Pro e Team). Não cobrar o detalhe do plano.
- GitLab renomeou "shared runners" para **instance runners**; `only/except` estão em "deprecated keywords".
- Compose: `docker compose` (V2, plugin da CLI) × `docker-compose` (V1, legado). Data exata de fim do V1: *não confirmada nesta sessão*.
- Nota de 2020 do Git Flow: texto integral não lido; cobrar só a ideia geral (modelo adequado a múltiplas versões, menos a entrega contínua).
