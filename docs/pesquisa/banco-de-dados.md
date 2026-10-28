# Pesquisa — Banco de Dados (slug `banco-de-dados`, prefixo `bd`)

> Pesquisa feita em 28/10/2026 para o banco de 50 questões inéditas no padrão FCC (TCE-GO 2026, Técnico de Controle Externo — TI).
>
> **Como ler.** **[primária]**: lido no texto do emissor (fontes SGML da documentação do PostgreSQL no repositório oficial `postgres/postgres`, ramo `REL_18_STABLE`; README do `pgvector/pgvector`; `redis.conf` do repositório `redis/redis`). **[busca]**: confirmado por WebSearch (5 buscas usadas de 8). **[livro-texto]**: conteúdo estável de Elmasri & Navathe, Silberschatz, Date, não reconferido.
>
> Limitação: WebFetch/curl só alcançam GitHub e npm; a documentação da Oracle e da MongoDB veio por busca (resumos com citação), não por leitura integral.

## Versões vigentes (out./2026)

- **PostgreSQL**: estável = 18 (tags `REL_18_0` a `REL_18_6`); a 19 está em `REL_19_RC1` [primária, `git ls-remote`]. As questões citam "PostgreSQL" sem número, salvo quando o fato é do 18.
- **Oracle**: *Oracle AI Database 26ai* é a versão de suporte de longo prazo que substituiu a 23ai (anúncio de out./2025; migração pela *release update* de outubro/2025) [busca: oracle.com, docs 26ai]. As questões não dependem da versão.
- **pgvector**: tags até `v0.8.7` [primária].
- **Redis**: série 8.x [primária, tags]. As questões não citam versão.

## 1. Modelo entidade-relacionamento [livro-texto]

- Entidade fraca: sem chave própria; identificada pela **chave parcial + chave da entidade proprietária** via relacionamento identificador; participação **total** no relacionamento identificador (retângulo duplo; losango duplo no relacionamento).
- Cardinalidade (1:1, 1:N, N:N) × participação (total/parcial; mínimo 1 ou 0).
- Mapeamento: 1:N → FK no lado N (NOT NULL se a participação do lado N for total); N:N → tabela associativa com as duas FKs (PK composta) e os atributos do relacionamento; multivalorado → tabela própria.
- Especialização: total/parcial e disjunta/sobreposta. Mapeamento: tabela por superclasse + subclasses (PK da subclasse = FK para a superclasse), só subclasses (se total) ou tabela única com discriminador.

## 2. Normalização e desnormalização [livro-texto]

- 1FN: atributos atômicos, sem grupos repetidos. 2FN: 1FN + nenhum atributo não primo com dependência **parcial** de chave candidata. 3FN: 2FN + nenhuma dependência **transitiva** de atributo não primo (formalmente: para X → A, X é superchave **ou** A é primo). BCNF: todo determinante é superchave.
- Caso clássico 3FN ≠ BCNF: duas chaves candidatas sobrepostas e um determinante que não é superchave cujo dependente é primo. A decomposição em BCNF é sem perda de junção, mas pode não preservar dependências.
- Desnormalização: redundância controlada para leitura (BI, relatórios, DW); custo em escrita, espaço e sincronização. A base transacional continua normalizada.

## 3. SQL (DDL, DML e consultas) — conferido em sqlite3 3.45.1

- DDL (CREATE, ALTER, DROP), DML (INSERT, UPDATE, DELETE; SELECT em muitas classificações), DCL (GRANT, REVOKE), controle de transação (COMMIT, ROLLBACK, SAVEPOINT).
- LEFT JOIN + filtro da tabela à direita no WHERE descarta as linhas sem correspondência (vira junção interna na prática); o filtro deve ir para o ON. `COUNT(*)` conta a linha preenchida com NULL; `COUNT(col)` não (conferido: 0 × 1).
- WHERE filtra linhas antes do agrupamento; HAVING filtra grupos. `SUM` ignora NULL; `COUNT(*)` conta a linha com valor NULL (conferido).
- Lógica de três valores: `col <> 'X'` é UNKNOWN para NULL e a linha sai do resultado (conferido). `NOT IN` com subconsulta que devolve NULL não retorna linhas; `NOT EXISTS` não tem esse problema (conferido).
- UNION elimina duplicatas; UNION ALL preserva; nomes das colunas vêm da primeira consulta (conferido).
- Janela: `RANK()` repete a posição em empates; `ROW_NUMBER()` não (conferido: 4 × 3 linhas no exemplo).

## 4. Álgebra relacional [livro-texto]

- σ seleção (linhas), π projeção (colunas, elimina duplicatas na semântica de conjuntos), ⋈ junção (natural = produto + seleção por igualdade dos atributos homônimos + projeção), ∪ e − exigem compatibilidade de união, × produto cartesiano, ÷ divisão ("todos"). Divisão conferida em SQL com NOT EXISTS duplo.

## 5. Transações e ACID

- ACID [livro-texto]. Anomalias: leitura suja, não repetível, fantasma, anomalia de serialização.
- **PostgreSQL [primária, `mvcc.sgml`]**: Read Committed é o padrão; Read Uncommitted se comporta como Read Committed; o Repeatable Read do PostgreSQL **não permite leitura fantasma** (o padrão SQL admite garantias maiores). Leitores não bloqueiam escritores (MVCC).
- Deadlock: espera circular; o SGBD detecta e escolhe uma vítima, que recebe erro. Prevenção: ordem padronizada de acesso.

## 6. Índices e otimização

- **PostgreSQL [primária, `indices.sgml`]**: tipos B-tree (padrão), Hash (só igualdade), GiST, SP-GiST, GIN (índice invertido; jsonb, arrays, full text), BRIN (resumo por faixa de blocos). Só B-tree pode ser UNIQUE. Índice multicoluna: mais eficiente com condições nas colunas **iniciais (à esquerda)**.
- **PostgreSQL 18 [primária, `release-18.sgml`]**: *skip scan* em B-tree permite usar índice multicoluna sem condição na primeira coluna em mais casos; `EXPLAIN ANALYZE` passa a incluir `BUFFERS` automaticamente.
- `EXPLAIN ANALYZE` **executa** a instrução (para DML, usar dentro de transação com ROLLBACK) [primária, `explain.sgml`].

## 7. Procedures, triggers e views (PostgreSQL) [primária]

- Procedure: `CALL`; pode executar COMMIT/ROLLBACK se o CALL não estiver em bloco de transação explícito; procedure `SECURITY DEFINER` não pode (`create_procedure.sgml`).
- Trigger FOR EACH ROW: uma vez por linha; FOR EACH STATEMENT: uma vez por comando, **mesmo que nenhuma linha seja afetada**; INSTEAD OF só em views e só por linha; TRUNCATE só por instrução (`create_trigger.sgml`).
- `REFRESH MATERIALIZED VIEW CONCURRENTLY`: não bloqueia leituras; exige ao menos um índice UNIQUE só com nomes de colunas, sem WHERE; exige a view já populada (`refresh_materialized_view.sgml`).

## 8. PostgreSQL: administração [primária]

- VACUUM: recupera espaço de versões mortas para reutilização (em regra não devolve ao SO), atualiza estatísticas, atualiza o mapa de visibilidade (index-only scans) e previne *wraparound* de XID. VACUUM FULL compacta e devolve espaço, mas exige `ACCESS EXCLUSIVE` (`maintenance.sgml`).
- Autovacuum automatiza VACUUM e ANALYZE.
- `pg_stat_statements` exige `shared_preload_libraries` (memória compartilhada adicional) (`pgstatstatements.sgml`). `work_mem` = memória por operação de consulta (ordenação/hash).

## 9. Oracle Database [busca + livro-texto]

- SGA compartilhada (buffer cache, shared pool, redo log buffer, large pool); PGA privativa do processo servidor.
- Redo log online (mínimo de dois grupos, uso circular); ARCHIVELOG copia grupos preenchidos (ARCn) e permite backup com banco aberto e recuperação até um ponto no tempo.
- Undo: rollback, leitura consistente, flashback; `UNDO_RETENTION`; ORA-01555 *snapshot too old* quando o undo necessário foi sobrescrito; padrão `RETENTION NOGUARANTEE` [busca: Pythian citando "Managing Undo"; Netdata].
- RMAN: incremental nível 0 = base com todos os blocos usados; nível 1 **diferencial** (padrão) = desde o último incremental de nível 0 ou 1; **cumulativo** = desde o último nível 0 [busca: fontes secundárias concordantes]. Metadados no control file; catálogo opcional.
- Data Guard: standby físico (Redo Apply), lógico (SQL Apply); modos Maximum Protection, Maximum Availability e **Maximum Performance (padrão)** [busca: docs Oracle 26 "Oracle Data Guard Protection Modes"].

## 10. NoSQL

- MongoDB: documentos BSON, esquema flexível (validação opcional), limite de **16 MB** por documento (GridFS para maiores) [busca: docs MongoDB "Limits"].
- Redis [primária, `redis.conf`]: AOF desligado por padrão (`appendonly no`), `appendfsync everysec` padrão, `aof-use-rdb-preamble yes`; RDB = snapshots. TTL via EXPIRE [livro-texto].
- Cassandra: chave de partição (distribuição) + colunas de agrupamento (ordem na partição); consistência ajustável; QUORUM com RF = 3 → 2 réplicas; R + W > N [livro-texto].
- Neo4j: grafo de propriedades, Cypher. CAP: diante de partição, escolher C ou A; BASE e consistência eventual [livro-texto].

## 11. Bancos vetoriais [primária, README pgvector]

- Sem índice, busca exata (recall perfeito). Índices aproximados: HNSW (grafo multicamadas; melhor velocidade×recall; build mais lento, mais memória; sem etapa de treino) e IVFFlat (listas; criar após ter dados; `lists`; `ivfflat.probes`, padrão 1).
- Operadores: `<->` L2, `<#>` produto interno negativo, `<=>` distância de cosseno, `<+>` L1. Similaridade de cosseno = 1 − `<=>`. Um índice por função de distância (`vector_l2_ops`, `vector_cosine_ops`, `vector_ip_ops`).
- HNSW: `m` padrão 16, `ef_construction` padrão 64, `hnsw.ef_search` padrão 40. `vector` indexável até 2.000 dimensões; `halfvec` até 4.000. Filtro aplicado **depois** do índice; 0.8.0 trouxe *iterative index scans*.

## 12. Replicação, backup e alta disponibilidade [primária]

- Streaming replication é **assíncrona por padrão**; síncrona com `synchronous_standby_names` + `synchronous_commit` (`remote_write`, `on`, `remote_apply`) (`high-availability.sgml`).
- `pg_dump`: cópia lógica consistente, não bloqueia leitores nem escritores, serve para migrar para versão mais nova (`pg_dump.sgml`). Backup físico (`pg_basebackup`) copia o cluster inteiro; PG 17+ tem incremental (`--incremental`, `pg_combinebackup`).
- PITR: backup-base + arquivamento contínuo de WAL (`archive_command` ou `archive_library`) + `restore_command`, `recovery_target_time` e `recovery.signal` (`backup.sgml`).
- RPO = perda máxima tolerável (tempo); RTO = tempo máximo para restabelecer [livro-texto].

## 13. Segurança e governança [primária + pesquisa de legislação do repositório]

- GRANT/REVOKE; `WITH GRANT OPTION`; `REVOKE ... CASCADE` revoga privilégios dependentes (sem CASCADE, falha se houver dependentes). Roles; menor privilégio.
- RLS (`ddl.sgml`): sem política → **default deny**; superusuários e papéis `BYPASSRLS` sempre ignoram; o dono da tabela normalmente ignora, salvo `FORCE ROW LEVEL SECURITY`. USING filtra linhas existentes; WITH CHECK valida linhas novas.
- LGPD (Lei 13.709/2018): art. 5º, III e XI (anonimizado/anonimização); art. 6º, III (necessidade = minimização); art. 12 (anonimizado não é dado pessoal, salvo reversão); art. 13, § 4º (pseudonimização); art. 46 (medidas de segurança). Fatos reaproveitados de `docs/pesquisa/legislacao-aplicada-ti.md`.

## Pontos de cautela

1. **Prefixo à esquerda × skip scan.** Desde o PostgreSQL 18 (e há muito no Oracle, *index skip scan*), um índice composto pode ser usado sem condição na coluna líder. As questões dizem "menos favorecida"/"mais eficiente", nunca "não pode usar".
2. **Repeatable Read**: no padrão SQL admite fantasma; no PostgreSQL, não. Toda questão sobre isso nomeia o SGBD.
3. **Deadlock no Oracle** desfaz só a instrução da vítima, não a transação inteira; por isso a questão de deadlock é ambientada no PostgreSQL.
4. **COMMIT/ROLLBACK** não são DCL (são controle de transação); nenhuma alternativa depende dessa classificação.
5. **TRUNCATE** é transacional no PostgreSQL e faz commit implícito no Oracle: evitado.
6. **RMAN diferencial × cumulativo** veio de fontes secundárias concordantes; cobrado só na definição consolidada.
7. **Data Guard padrão = Maximum Performance** conferido na documentação 26; detalhes de Active Data Guard (licença) evitados.
8. **pgvector**: `<=>` é **distância**, não similaridade; a ordem ASC devolve os mais parecidos.
