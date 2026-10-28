# Pesquisa — Desenvolvimento de Sistemas (TCE-GO 2026, Técnico de Controle Externo — TI)

Data da pesquisa: 28/10/2026. Buscas WebSearch usadas: 5 de 12. As demais confirmações vieram de fontes primárias no GitHub (arquivos brutos) e do registro npm. O conteúdo consolidado de livro-texto veio do conhecimento prévio e está marcado como tal.

## 1. Fatos voláteis confirmados nesta sessão

| Tema | Fato | Fonte |
|---|---|---|
| Java | JDK 25 é a LTS mais recente (set/2025); JDK 27 é a versão corrente, não LTS (set/2026). Cadência de LTS a cada 2 anos (17 → 21 → 25). | Páginas de download da Oracle (via busca) |
| React | Versão estável: 19.3.1. 19.3.0 (09/09/2026): `<ViewTransition />`, refs em `<Fragment>`, `browser()` no react-dom. 19.2 (01/10/2025): `<Activity>`, `useEffectEvent`. 19.0 (05/12/2024): Actions, `useActionState`, `useOptimistic`, `use`, `ref` como prop, `propTypes` ignorado. | Registro npm; `CHANGELOG.md` de facebook/react |
| Python | 3.15.0 lançado em 09/10/2026 (3.15.2 em 26/10/2026). 3.14.0 saiu em 07/10/2025. Ciclo anual (PEP 602): 2 anos de correções e suporte de segurança até 5 anos. | PEP 790 e PEP 745 (python/peps) |
| Node.js | v24 "Krypton": LTS desde 28/10/2025, em manutenção desde 20/10/2026. v26 entra em LTS em 28/10/2026. A partir do v27 (alpha desde 28/10/2026), toda linha passa por Alpha e vira LTS, o que acaba com a regra de par e ímpar. | nodejs/Release (`schedule.json`, README) |
| TypeScript | 6.0 (23/03/2026) foi a última versão escrita em JS e tornou `strict` o padrão, além de depreciar `target: es5`, `moduleResolution node10`, `baseUrl` e `outFile`. 7.0.x, o compilador nativo em Go, é a `latest` no npm (7.0.2, jul/2026). | Registro npm; busca (Visual Studio Magazine, Socket) |
| npm | CLI 12.x (12.0.0 em 08/07/2026). O trusted publishing (OIDC) exige npm ≥ 11.5.1 e Node ≥ 22.14.0 e atende GitHub Actions, GitLab.com e CircleCI; runners auto-hospedados ainda não. O `npm ci` exige `package-lock.json`, falha se ele divergir do `package.json`, remove `node_modules` e nunca grava nesses arquivos. | npm/cli (`CHANGELOG.md`, docs de npm-ci); npm/documentation |
| OpenAPI | 3.2.0 (19/09/2025) e 3.2.1 (10/09/2026, revisão de correção); 3.1.2 (19/09/2025); 3.1.1 e 3.0.4 (24/10/2024). O Swagger 2.0 foi doado à OpenAPI Initiative em 2015. A 3.2 trouxe `additionalOperations`, a operação `query` (método HTTP QUERY), `in: querystring`, o fluxo OAuth `deviceAuthorization` e `$self`. | OAI/OpenAPI-Specification (`versions/3.2.1.md`, Apêndice A) |
| OAuth 2.1 | Continua Internet-Draft (draft-ietf-oauth-v2-1-16, set/2026). Marco do grupo para envio ao IESG: dez/2026. | IETF Datatracker (via busca) |
| RFC 9700 | BCP 240, jan/2025. PKCE é MUST para clientes públicos e RECOMMENDED para confidenciais, e o servidor de autorização MUST suportá-lo; S256 é o método que não expõe o verificador. Fluxo implícito: SHOULD NOT. ROPC: MUST NOT. Redirect URI com comparação exata. Refresh token de cliente público: vinculado ao remetente ou com rotação. Access token com audiência restrita (SHOULD). | Fonte do draft em oauthstuff/draft-ietf-oauth-security-topics; busca (rfc-editor) |
| Maven Central | OSSRH encerrado em 30/06/2025; a publicação passou ao Central Publisher Portal. Requisitos: assinatura PGP, JARs de sources e de javadoc, metadados no POM (licença, desenvolvedores, SCM) e namespace verificado. | central.sonatype.org (via busca) |
| PyPI | Trusted Publishing troca um token OIDC do CI por um token de API de curta duração (15 minutos). | pypi/warehouse (`docs/user/trusted-publishers`) |
| Git | Versão estável 2.55 (master já em 2.56). O Git 3.0 está planejado com SHA-256 e reftable como padrão em repositórios novos e branch padrão `main`, mas ainda não foi lançado. | git/git (`GIT-VERSION-GEN`, `Documentation/BreakingChanges.adoc`) |
| SemVer | Especificação 2.0.0: item 3 (versão publicada não pode ser modificada), 4 (0.y.z é instável), 6 a 8 (PATCH, MINOR e MAJOR; depreciação exige MINOR), 9 (pré-release tem precedência menor) e 10 (metadados de build não contam na precedência). | semver/semver (`semver.md`) |
| Faixas npm | Conferidas com node-semver local: `^1.4.2` = `>=1.4.2 <2.0.0`; `~1.4.2` = `>=1.4.2 <1.5.0`; `^0.4.2` = `>=0.4.2 <0.5.0`. Pré-releases ficam fora da faixa. | `node_modules/semver` do repositório |
| FastAPI | Starlette (camada web, ASGI) com Pydantic (dados). Documentação automática em `/docs` (Swagger UI) e `/redoc` (ReDoc), baseada em OpenAPI e JSON Schema. | README de fastapi/fastapi |
| Python | PEP 751 (`pylock.toml`, formato padrão de lockfile) está em status Final desde 31/03/2025. | python/peps |

## 2. Fatos consolidados por subtópico (livro-texto)

- **Algoritmos e estruturas de dados:**
  - Pilha é LIFO e fila é FIFO, com push/pop e enqueue/dequeue em O(1). A pilha de chamadas é uma pilha.
  - Árvore binária de busca: O(h) por operação, ou seja, O(log n) se balanceada e O(n) se degenerada (inserção em ordem). AVL e rubro-negra garantem O(log n). O percurso em ordem devolve as chaves ordenadas.
  - Tabela hash: O(1) em média e O(n) no pior caso.
  - Busca binária: O(log n), exige vetor ordenado com acesso direto.
  - Ordenação:
    - bubble e insertion: O(n²), com melhor caso O(n) (bubble só com parada antecipada);
    - selection: O(n²) sempre;
    - merge: O(n log n) sempre, estável, memória O(n);
    - quick: O(n log n) em média e O(n²) no pior caso, não estável;
    - heap: O(n log n) sempre, in-place, não estável.
  - Grafos:
    - BFS usa fila e dá o menor número de arestas; DFS usa pilha ou recursão e detecta ciclos. Ambas custam O(V + E) com lista de adjacências.
    - A lista ocupa O(V + E), e a matriz, O(V²).
    - Dijkstra exige pesos não negativos; Bellman-Ford aceita negativos.
  - Fonte: Cormen et al. (3ª ed.), caps. 2, 6, 7, 10, 11, 12, 13, 22 e 24; Ziviani.
- **POO:**
  - Os quatro pilares: encapsulamento, herança, polimorfismo e abstração.
  - Sobrecarga: mesma classe, parâmetros diferentes, resolvida em compilação pelo tipo declarado. Sobrescrita: mesma assinatura na subclasse, resolvida em execução pelo tipo real.
  - Interface × classe abstrata em Java:
    - uma classe estende uma superclasse e implementa várias interfaces;
    - classe abstrata tem construtores e estado;
    - campos de interface são `public static final`;
    - métodos `default` e `static` em interfaces desde o Java 8, e `private` desde o Java 9.
  - Fonte: JLS SE 25, §8.1.1.1, §8.4.8, §8.4.9, §9.3, §9.4, §15.12.
- **Programação funcional:**
  - Função pura: determinística e sem efeitos colaterais (transparência referencial).
  - Ordem superior: recebe ou retorna funções. Closure: preserva o escopo léxico.
  - Em JS, `map`, `filter` e `reduce` não mutam o array; `sort` muta, e `toSorted` (ES2023) devolve cópia. `const` não é imutabilidade.
- **Java básico:**
  - 8 primitivos e seus wrappers; autoboxing e unboxing (unboxing de `null` lança NPE).
  - String imutável; literais internados (JLS §3.10.5). `==` compara referências e `equals` compara conteúdo.
  - Modificadores: private, pacote, protected, public.
  - Exceções: checked = Exception fora de RuntimeException; unchecked = RuntimeException e Error (JLS §11.1.1). `finally` sempre executa, salvo `System.exit` ou falha da JVM.
  - Coleções: ArrayList, LinkedList, HashSet, TreeSet, HashMap, TreeMap. Contrato equals/hashCode (Effective Java, item 11).
- **JavaScript/Node.js:**
  - Event loop: código síncrono, depois todas as microtarefas (`then`/`await`), depois a próxima tarefa (`setTimeout`).
  - Combinadores de promises: `all` falha no primeiro erro; `allSettled` espera todas; `race` pega a primeira a terminar; `any` pega o primeiro sucesso (AggregateError se todas falharem).
  - `var` tem escopo de função e é içada com `undefined`; `let` e `const` têm escopo de bloco e zona morta temporal. `===` não faz coerção.
  - ESM × CommonJS: `"type": "module"`; `.mjs` é sempre ESM e `.cjs` é sempre CJS. ESM não tem `require`, `__dirname` nem `__filename` (usa-se `import.meta.url`, `import.meta.dirname` e `import.meta.filename`). `import` é estático, e `import()` é dinâmico.
  - Rejeição não tratada encerra o processo por padrão (desde o Node 15).
- **React:**
  - Props são somente leitura e o fluxo de dados é unidirecional.
  - O estado funciona como instantâneo da renderização, com atualizações agrupadas (batching); a forma funcional é `setX(v => v + 1)`.
  - `useEffect`:
    - `[]` executa só na montagem;
    - `[dep]` executa na montagem e quando `dep` muda;
    - sem lista, executa após toda renderização;
    - a limpeza roda antes da próxima execução e na desmontagem;
    - o StrictMode faz um ciclo extra em desenvolvimento.
  - A key deve ser estável e única entre irmãos; índice como key só em listas estáticas.
  - Regras dos Hooks: chamar só no nível superior de componentes ou de Hooks customizados.
  - Fonte: react.dev.
- **Python:**
  - Tipagem dinâmica e forte (`"10" + 5` lança TypeError); type hints não são impostas em tempo de execução (PEP 484); a indentação é sintática.
  - Tuplas são imutáveis e listas, mutáveis. List comprehension: `[expr for x in it if cond]`.
  - Ambiente e dependências: `python -m venv`; `pip freeze` e `pip install -r requirements.txt`.
  - Frameworks: Flask é microframework WSGI; Django é completo (ORM, admin, migrações, MTV, aceita ASGI); FastAPI é ASGI com Pydantic e devolve 422 quando a validação falha.
- **HTTP/REST, GraphQL e WebSocket:**
  - RFC 9110:
    - métodos seguros: GET, HEAD, OPTIONS, TRACE;
    - idempotentes: os seguros mais PUT e DELETE;
    - POST não é seguro nem idempotente;
    - códigos: 201 com Location, 401 (credenciais ausentes ou inválidas, com WWW-Authenticate), 403 (sem permissão), 409 (conflito com o estado) e 422 ("Unprocessable Content").
  - REST (Fielding, cap. 5): cliente-servidor, stateless, cache, interface uniforme, sistema em camadas e código sob demanda (opcional).
  - GraphQL: endpoint único; query, mutation e subscription; schema tipado obrigatório; o cliente escolhe os campos, o que evita over-fetching e under-fetching.
  - WebSocket (RFC 6455):
    - abertura: GET com `Upgrade: websocket` e `Sec-WebSocket-Key`, respondido com `101 Switching Protocols` e `Sec-WebSocket-Accept`;
    - transporte full-duplex sobre TCP;
    - `ws://` usa a porta 80 e `wss://` (TLS) usa a 443;
    - SSE, por comparação, é unidirecional.
- **JSON e XML:**
  - JSON (RFC 8259): aspas duplas, sem vírgula final, sem comentários, ponto decimal; tipos string, number, object, array, true, false e null.
  - XML: bem formado é sintaxe; válido é sintaxe mais esquema (DTD ou XSD).
  - O XSD é escrito em XML e tem tipos e minOccurs/maxOccurs; o DTD tem sintaxe própria.
  - O URI de namespace é só identificador e não é baixado pelo analisador.
- **OAuth 2.0, OIDC e JWT:**
  - Papéis do OAuth 2.0 (RFC 6749 §1.1): proprietário do recurso, cliente, servidor de autorização e servidor de recursos.
  - Fluxos:
    - client credentials (§4.4) serve à comunicação máquina a máquina;
    - SPA usa código de autorização com PKCE (RFC 7636).
  - OIDC Core 1.0:
    - `scope=openid` é obrigatório; sem ele, o comportamento não é especificado;
    - ID Token é JWT com iss, sub, aud, exp e iat obrigatórios, e nonce se tiver sido enviado;
    - o cliente valida se aud contém o seu client_id;
    - o UserInfo é acessado com o access token e responde em JSON (ou JWT).
  - JWT (RFC 7519): todas as claims registradas são opcionais.
  - Formatos: JWS compacto tem 3 partes em Base64URL, sem sigilo; JWE compacto tem 5 partes.
  - Boas práticas (RFC 8725): restringir algoritmos, recusar `alg: none` e prevenir confusão RS256/HS256.
- **HTML5, CSS3 e TypeScript:**
  - HTML5: elementos semânticos; `main` único visível e `section` temática.
  - CSS:
    - cascata: origem e importância, depois especificidade, depois ordem;
    - especificidade (a, b, c): id, depois classe, atributo ou pseudoclasse, depois elemento;
    - `content-box` é o padrão e `border-box` inclui padding e borda;
    - Flexbox é 1D (`justify-content` no eixo principal, `align-items` no transversal) e Grid é 2D.
  - TypeScript:
    - inferência e apagamento de tipos;
    - `unknown` exige refinamento, `any` desliga a verificação;
    - `interface` admite declaration merging, enquanto `type` expressa uniões.
- **Git:**
  - `merge` preserva o histórico (fast-forward ou commit com dois pais); `rebase` reescreve commits com novos hashes e não deve ser usado em commits publicados.
  - `reset` tem três modos: `--soft`, `--mixed` (padrão) e `--hard`; `revert` cria um commit inverso.
  - `stash`: `pop` reaplica e remove; `apply` reaplica e mantém; `drop` descarta; `-u` inclui não rastreados.
  - Tags: leve × anotada (`-a`, objeto com metadados). O push não envia tags; usa-se `git push origin <tag>`, `--tags` ou `--follow-tags`.
  - Fonte: Pro Git, 2ª ed., seções 2.6, 3.2, 3.6, 7.3 e 7.7.
- **Imagens de container:** a tag é mutável e o digest (sha256 do manifesto) é imutável. Fixar por digest torna o build reprodutível (especificações OCI).

## 3. Pontos de cautela

- **Node.js "LTS atual":** muda exatamente em 28/10/2026 (o v26 entra em LTS e o v24 já está em manutenção). Nenhuma questão depende disso.
- **TypeScript:** desde a 6.0, `strict` é padrão. As questões dizem explicitamente "com strict habilitado" e não afirmam padrões do `tsc`.
- **Git:** o 2.x ainda usa `master` como padrão (com aviso); `main` só virá no Git 3.0. Evitei qualquer questão sobre o nome da branch padrão.
- **Java:** o cache de Integer só é garantido entre −128 e 127; acima disso depende da JVM. Evitei `==` com wrappers e usei String (literal × `new`).
- **Python:** não nomeei o algoritmo do `list.sort` (Timsort com política powersort desde a 3.11).
- **GraphQL sobre HTTP:** o status HTTP das respostas depende do transporte. Não cobrei códigos de status em GraphQL.
- **RFC 9110, §15.5.4:** permite 404 para ocultar recurso proibido. A questão pede o código "mais adequado" e a explicação registra essa ressalva.
- **OIDC:** sem `openid` no scope, o comportamento "não é especificado"; não se pode dizer que "vira OAuth puro".
- **Pacotes npm e Node.js:** recursos recentes (`require(esm)`, type stripping, detecção de sintaxe ESM em arquivos sem `"type"`) ficaram fora das questões.
- **Não confirmado nesta sessão:**
  - JDK 29 como próxima LTS (set/2027), por cadência;
  - JEPs finalizadas no JDK 25 (por exemplo, a JEP 512), não usadas nas questões;
  - edição atual da especificação GraphQL, citada sem edição;
  - status de publicação do RFC 8725bis.

## 4. Fontes

- Oracle Java SE downloads: <https://www.oracle.com/java/technologies/downloads/>
- React: registro npm (<https://registry.npmjs.org/react>) e <https://github.com/facebook/react/blob/main/CHANGELOG.md>
- PEP 790 e PEP 745: <https://github.com/python/peps>
- Node.js Release: <https://github.com/nodejs/Release>
- TypeScript 6.0: <https://visualstudiomagazine.com/articles/2026/03/23/typescript-6-0-ships-as-final-javascript-based-release-clears-path-for-go-native-7-0.aspx>
- npm CLI e docs: <https://github.com/npm/cli>, <https://github.com/npm/documentation>
- OpenAPI Specification: <https://github.com/OAI/OpenAPI-Specification> (versions/3.2.1.md)
- OAuth 2.1: <https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/>
- RFC 9700: <https://www.rfc-editor.org/rfc/rfc9700> e <https://github.com/oauthstuff/draft-ietf-oauth-security-topics>
- Maven Central (OSSRH sunset e requisitos): <https://central.sonatype.org/news/20250326_ossrh_sunset/>, <https://central.sonatype.org/publish/requirements/>
- PyPI Trusted Publishers: <https://github.com/pypi/warehouse/tree/main/docs/user/trusted-publishers>
- Git: <https://github.com/git/git> (Documentation/BreakingChanges.adoc)
- SemVer 2.0.0: <https://github.com/semver/semver/blob/master/semver.md>
- FastAPI: <https://github.com/fastapi/fastapi>
- RFCs consolidadas: 6455, 6749, 6750, 7515, 7516, 7518, 7519, 7636, 8259, 8725, 9110; OIDC Core 1.0; W3C XML 1.0, Namespaces in XML e XSD 1.1; CSS Cascade 4 e Selectors 4; JLS SE 25.
