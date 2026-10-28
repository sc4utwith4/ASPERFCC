# Pesquisa: Sistemas Operacionais, Redes e Computação em Nuvem (`so-redes-nuvem`)

Sessão de 28/10/2026. Foram usadas 7 das 12 buscas permitidas. As fontes primárias no GitHub foram `quicwg/base-drafts` e `MicrosoftDocs/PowerShell-Docs`. O conteúdo de livro-texto vem do conhecimento consolidado: Silberschatz, Tanenbaum, Kurose e os RFCs citados.

## 1. Fatos voláteis confirmados nesta sessão

| Fato | Fonte |
|---|---|
| HTTP/3 = RFC 9114; QPACK = RFC 9204; QUIC = RFC 9000 (transporte), 9001 (TLS no QUIC), 9002 (perdas e congestionamento). | README do repositório oficial do QUIC WG (github.com/quicwg/base-drafts) |
| TLS 1.3: o **RFC 9846** (julho de 2026, Standards Track) torna obsoleto o RFC 8446 e mantém a versão 1.3, de forma compatível. Também torna obsoletos os RFCs 5077, 5246, 6961, 7627 e 8422. | rfc-editor.org/rfc/rfc9846 e datatracker (via busca) |
| IEEE 802.11be-2024 (Wi-Fi 7): aprovado em 26/09/2024 e publicado em 22/07/2025. O 802.11bn (Wi-Fi 8, "Ultra High Reliability") está em desenvolvimento, com publicação projetada para 2028. | ieee802.org/11, anúncio do WG 802.11 (via busca) |
| Na faixa de 6 GHz (Wi-Fi 6E e 7), só são aceitos WPA3 (SAE com H2E) ou Enhanced Open (OWE). PMF é obrigatório e WPA2 não é permitido. | Guias Cisco e Meraki. **São fontes secundárias: o texto da Wi-Fi Alliance não foi lido.** |
| O NIST SP 800-145 (set. 2011) segue vigente, sem versão substituta. Define 5 características essenciais, 3 modelos de serviço e 4 modelos de implantação. | nvlpubs.nist.gov (PDF) e catálogo do NIST |
| PowerShell (about_Execution_Policies): a política de execução **não é fronteira de segurança** ("defense in depth"). RemoteSigned roda scripts locais sem assinatura e exige assinatura confiável nos baixados da internet, salvo se desbloqueados (Unblock-File). Restricted aceita comandos individuais, mas não scripts. AllSigned exige assinatura em todos. Bypass não bloqueia nem avisa. Fora do Windows, a política é Unrestricted e não pode ser alterada. | MicrosoftDocs/PowerShell-Docs (5.1 e 7.5) |
| Em junho de 2024, a Microsoft incluiu todas as versões do NTLM (LANMAN, v1, v2) na lista de recursos preteridos. O NTLM ainda funciona no Windows 11 24H2 e no Windows Server 2025, e a recomendação é usar Negotiate, que tenta Kerberos primeiro. Kerberos é o padrão no AD desde o Windows 2000. | The Register (06/06/2024), Petri. São fontes secundárias. |

## 2. Fatos consolidados por subtópico

**Windows e Linux: processos, memória e sistemas de arquivos**
- Estados do processo: novo, pronto, executando, bloqueado e terminado.
  - Transições: despacho (pronto → executando), preempção ou fim do quantum (executando → pronto), E/S (executando → bloqueado) e fim da E/S (bloqueado → pronto).
  - Não existe a transição bloqueado → executando.
- Threads compartilham código, dados, heap e arquivos do processo. Pilha, registradores e PC são próprios de cada thread.
- Deadlock (condições de Coffman, todas simultâneas): exclusão mútua, posse e espera, não preempção e espera circular.
  - Prevenção: negar uma das condições. Por exemplo, a ordem global de aquisição de recursos quebra a espera circular.
  - Evitação: algoritmo do banqueiro.
- Memória:
  - Paginação: páginas e quadros fixos, sem fragmentação externa.
  - Falta de página, TLB e algoritmos de substituição (FIFO, LRU, ótimo).
  - Thrashing: muita paginação, CPU ociosa e disco saturado. O remédio é reduzir a multiprogramação ou ampliar a RAM, segundo o modelo de conjunto de trabalho.
  - Área de troca: swap no Linux; pagefile.sys no Windows.
- Sinais e comandos de processo:
  - SIGTERM (15) é o padrão do `kill` e pode ser tratado. SIGKILL (9) e SIGSTOP não podem ser capturados nem ignorados.
  - Outros sinais: SIGHUP (1), SIGINT (2, Ctrl+C) e SIGTSTP (Ctrl+Z).
  - Comandos: `ps aux`, `top`, `kill`, `pkill`, `nice` e `renice`.
- Sistemas de arquivos:
  - ext4: journaling e inodes. Com blocos de 4 KiB, aceita arquivos de até 16 TiB.
  - XFS: padrão do RHEL desde a versão 7. Btrfs: copy-on-write.
  - NTFS: journaling, ACLs, MFT, EFS e cotas.
  - FAT32: sem journaling e sem permissões, com arquivo máximo de 4 GiB − 1 byte.
  - exFAT: arquivos grandes em mídia removível, sem permissões.
- Inodes e links:
  - O inode guarda tipo, permissões, dono, tamanho, carimbos de tempo, contagem de links e ponteiros. **Não guarda o nome**, que fica na entrada de diretório.
  - Quando os inodes se esgotam (verifique com `df -i`), o sistema acusa "No space left on device" mesmo com blocos livres.
  - Hard link: mesmo inode; não cruza sistemas de arquivos. Link simbólico: guarda um caminho, cruza sistemas de arquivos e quebra se o alvo sumir.
- FHS 3.0:
  - /etc: configuração. /var: dados variáveis, como /var/log.
  - /tmp tem sticky bit. /proc é virtual.
  - Outros diretórios: /boot, /usr, /opt, /srv, /home e /root.
- systemd:
  - `systemctl start|stop|restart|status|enable|disable|mask`; `enable --now` habilita e inicia.
  - `journalctl -u <unidade>`, `-f`, `-b`, `-p err`, `--since`.
  - Pacotes: `apt` (Debian/Ubuntu) e `dnf` (Fedora/RHEL 8+, sucessor do yum).
- Windows:
  - Permissões NTFS: o Negar explícito prevalece sobre o Permitir explícito, e o Permitir explícito prevalece sobre o Negar herdado.
  - Entre permissões de compartilhamento e NTFS, vale a mais restritiva.
  - Serviços: inicialização Automática, Automática (atraso), Manual ou Desabilitada.

**Shell Linux, PowerShell e automação**
- Permissões:
  - Valores octais r=4, w=2, x=1: 750 = rwxr-x--- e 640 = rw-r-----.
  - Bits especiais: setuid 4000, setgid 2000 e sticky 1000 (/tmp = 1777).
  - A umask retira bits de 666 (arquivos) e 777 (diretórios): 022 → 644/755, 027 → 640/750, 077 → 600/700. **Conferido por script.**
- Redirecionamento:
  - `>` sobrescreve, `>>` acrescenta, `2>` envia stderr, `|` é o pipe.
  - `cmd > arq 2>&1` leva as duas saídas ao arquivo. `cmd 2>&1 > arq` deixa o stderr no terminal.
  - Encadeamento e variáveis: `&&`, `||`, `;`, `$?` (0 = sucesso), `$1`, `$#`, `$@`.
- cron:
  - Campos: min hora dia-do-mês mês dia-da-semana (0 e 7 = domingo).
  - Se o dia do mês **e** o dia da semana forem restritos, o comando roda quando **qualquer** um coincidir, conforme o crontab(5) do cronie/Vixie cron: "30 4 1,15 * 5" roda nos dias 1 e 15 e em toda sexta.
- PowerShell:
  - Cmdlets Verbo-Substantivo (`Get-Verb`) e pipeline de **objetos .NET**.
  - Cmdlets comuns: `Get-Process`, `Get-Service`, `Get-ChildItem`, `Where-Object`, `Select-Object`, `Sort-Object`, `Get-Member`, `Get-Help`.
  - Elementos da linguagem: `$_`/`$PSItem`, operadores `-eq`, `-gt`, `-like`, `-match` (`>` é redirecionamento) e os parâmetros `-WhatIf` e `-Confirm`.
  - Extensões: `.ps1` para scripts, `.psm1` para módulos.

**Active Directory e LDAP**
- Estrutura lógica:
  - Domínio, árvore (namespace DNS contíguo) e floresta (esquema, configuração e catálogo global comuns; fronteira de segurança).
  - A OU é contêiner para organizar objetos, delegar administração e vincular GPO. **Não é entidade de segurança.**
- Controlador de domínio: cópia gravável do NTDS.dit, replicação multimestre e KDC. O catálogo global usa as portas 3268/3269.
- Funções FSMO:
  - Floresta: Esquema e Nomeação de Domínio.
  - Domínio: RID, Emulador PDC e Infraestrutura.
- GPO:
  - Ordem de aplicação LSDOU (local, site, domínio, OU). A última aplicada prevalece, e a OU mais próxima vence.
  - "Impor" (Enforced) vence "Bloquear herança".
  - Comandos: `gpupdate /force`, `gpresult /r`.
- Kerberos:
  - Porta 88; KDC nos DCs; TGT e tíquetes de serviço.
  - A tolerância padrão de defasagem de relógio é de 5 min.
  - O DNS e os registros SRV localizam os DCs.
- LDAP v3 (RFC 4511):
  - Nomes: DN (`cn=...,ou=...,dc=...`) e RDN.
  - Operações: bind (simples, SASL ou anônimo), search (base, escopo base/one/sub, filtros como `(&(objectClass=user)(cn=Ana*))`), compare, add, delete, modify, modifyDN, unbind e StartTLS.
  - Portas: 389 (LDAP/StartTLS) e 636 (LDAPS, TLS implícito). O bind simples sem TLS expõe a senha.

**Virtualização e containers**
- Hipervisor tipo 1 (bare metal): ESXi, Hyper-V e Xen. O Hyper-V é tipo 1 mesmo com o Windows na partição pai.
- Hipervisor tipo 2 (hospedado): VirtualBox e VMware Workstation.
- Recursos: VT-x/AMD-V e migração ao vivo. Snapshot não é backup.
- Containers:
  - Compartilham o kernel do hospedeiro.
  - Namespaces isolam a visão (pid, net, mnt, uts, ipc, user, cgroup, time). Cgroups limitam CPU, memória e E/S.
  - Imagens em camadas, especificações OCI e volumes para persistência.
  - Um container Linux no Windows exige kernel Linux (VM leve/WSL 2).

**Arquitetura TCP/IP**
- Camadas: o modelo de 4 camadas é o do RFC 1122. As PDUs são segmento (TCP), datagrama (UDP), pacote e quadro.
- Protocolos auxiliares: ARP (IPv4) e NDP (IPv6); ICMP (traceroute usa TTL e "time exceeded").
- TCP × UDP:
  - TCP (RFC 9293): confiável, ordenado, com controle de fluxo e de congestionamento; cabeçalho de 20 bytes ou mais.
  - UDP (RFC 768): sem conexão; cabeçalho de 8 bytes.
- Conexão TCP:
  - Handshake: SYN → SYN+ACK → ACK. O encerramento usa FIN.
  - SYN flood: conexões semiabertas (SYN_RECV). Mitigação: SYN cookies e limitação de taxa.
- Portas: 0–1023 bem conhecidas, 1024–49151 registradas, 49152–65535 dinâmicas.
- syslog: UDP 514; sobre TLS, porta 6514 (RFC 5425).

**Endereçamento IPv4 e IPv6**
- IPv4:
  - RFC 1918: 10/8, 172.16/12 (até 172.31.255.255) e 192.168/16.
  - Não são RFC 1918: 100.64/10 (CGNAT, RFC 6598), 169.254/16 (APIPA, RFC 3927) e 127/8.
  - Hosts úteis = 2^(32−n) − 2.
- IPv6 (RFC 8200/4291/5952):
  - 128 bits em 8 grupos hexadecimais. Omitem-se zeros à esquerda (nunca à direita), e `::` aparece uma única vez, na maior sequência de grupos nulos.
  - Tipos: 2000::/3 global, fe80::/10 link-local, fc00::/7 ULA, ff00::/8 multicast, ::1 loopback, 2001:db8::/32 documentação.
  - **Sem broadcast.** Configuração por SLAAC (RFC 4862) ou DHCPv6.
  - Cabeçalho de 40 bytes; MTU mínima de 1280.

**DNS e DHCP**
- DNS:
  - Porta 53 em UDP e TCP; TCP para AXFR/IXFR e respostas grandes (RFC 7766).
  - Registros: A, AAAA, CNAME (não coexiste com outros registros nem fica no ápice), MX (menor preferência = prioridade), NS, PTR (in-addr.arpa/ip6.arpa), TXT (SPF/DKIM/DMARC), SOA (serial, refresh, retry, expire, TTL negativo), SRV e CAA.
  - Consulta recursiva (cliente → resolvedor) × iterativa (resolvedor → raiz → TLD → autoritativo). Cache por TTL.
  - DNSSEC garante integridade e autenticidade, não sigilo. DoT usa a porta 853 e DoH, a 443.
- DHCP (RFC 2131):
  - Fluxo DORA, com servidor na porta UDP 67 e cliente na 68. O Discover vai em broadcast.
  - O relay (giaddr / ip helper) atende outras sub-redes.
  - Renovação: T1 = 50% da concessão; rebinding: T2 = 87,5%.
  - Sem resposta, o Windows usa APIPA. DHCP snooping protege contra servidores falsos.
  - DHCPv6: portas 546 (cliente) e 547 (servidor).

**HTTP/2, HTTP/3, HTTPS, SMTP, FTP e SSH**
- HTTP/2 (RFC 9113, obsoleta o 7540): binário, multiplexado sobre uma conexão TCP, com HPACK (RFC 7541). O bloqueio de cabeça de fila do TCP persiste.
- HTTP/3 (RFC 9114): roda sobre o QUIC/UDP, com TLS 1.3 integrado e QPACK. Oferece fluxos independentes, migração de conexão e 0-RTT.
- TLS 1.3:
  - Handshake de 1-RTT; 0-RTT opcional, sujeito a replay.
  - Somente (EC)DHE efêmero, portanto sigilo direto. Removidos RSA estático, CBC, RC4, compressão e renegociação.
  - Somente cifras AEAD. O certificado trafega cifrado. HSTS: RFC 6797.
- SMTP: porta 25 (MTA ↔ MTA), 587 (submissão com STARTTLS e autenticação, RFC 6409) e 465 (submissão com TLS implícito, RFC 8314).
- Transferência de arquivos:
  - FTP: portas 21 (controle) e 20 (dados no modo ativo), com credenciais em claro.
  - FTPS = FTP sobre TLS (AUTH TLS na 21, RFC 4217; implícito na 990).
  - **SFTP = subsistema do SSH na porta 22**, não é FTP.
- SSH (RFC 4251–4254):
  - A chave privada fica no cliente; a pública vai em `~/.ssh/authorized_keys` no servidor.
  - `known_hosts` guarda as chaves de host.
  - Endurecimento: `PasswordAuthentication no`, `PermitRootLogin no`.

**VPN, balanceamento, proxies e firewalls**
- VPN:
  - Tipos: site a site × acesso remoto.
  - IPsec:
    - AH (protocolo 51) autentica sem cifrar e não convive com NAT; ESP (protocolo 50) cifra e autentica.
    - IKE usa UDP 500, e o NAT-T usa UDP 4500.
    - O modo túnel encapsula o pacote inteiro, como no site a site; o modo transporte protege só a carga.
  - VPN TLS: OpenVPN usa UDP 1194 por padrão.
- Balanceamento:
  - L4 (IP e porta) × L7 (caminho, cabeçalho e cookie; termina TLS).
  - Algoritmos: round robin (simples e ponderado), menos conexões, hash de IP de origem. Afinidade de sessão e health checks.
- Proxy direto (em nome dos clientes) × reverso (em frente aos servidores: TLS, cache, WAF e balanceamento).
- Firewalls:
  - Tipos: sem estado, com estado (tabela de conexões), proxy de aplicação, NGFW e WAF.
  - Avaliação por primeira correspondência, com negação implícita no final.

**Redes sem fio**
- Gerações:
  - Wi-Fi 4 = 802.11n e Wi-Fi 5 = 802.11ac (só 5 GHz).
  - Wi-Fi 6 = 802.11ax (OFDMA, TWT, BSS coloring); Wi-Fi 6E = 802.11ax em 6 GHz.
  - Wi-Fi 7 = 802.11be (320 MHz, 4096-QAM, MLO).
- Meio e canais: CSMA/CA. Em 2,4 GHz, os canais sem sobreposição são 1, 6 e 11.
- Segurança:
  - WEP e TKIP são obsoletos. WPA2 usa CCMP/AES.
  - WPA3-Personal usa SAE, que resiste a dicionário offline e dá sigilo direto. O PMF é obrigatório.
  - WPA3-Enterprise tem modo de 192 bits. OWE protege redes abertas.
  - 802.1X/EAP com RADIUS dá credenciais individuais.

**Nuvem: IaaS, PaaS, SaaS e serverless**
- NIST SP 800-145:
  - Características: autosserviço sob demanda, amplo acesso à rede, agrupamento de recursos, elasticidade rápida e serviço medido.
  - Modelos de serviço: SaaS, PaaS e IaaS.
  - Modelos de implantação: privada, comunitária, pública e híbrida.
  - A ISO/IEC 17788 inclui multilocação como característica-chave; a NIST não a lista entre as cinco.
- Responsabilidade compartilhada:
  - IaaS: o cliente cuida de SO, middleware, runtime, aplicação e dados.
  - PaaS: o cliente cuida de aplicação, dados e configurações.
  - SaaS: o cliente cuida de dados, usuários, acessos e configurações.
  - Dados e acessos são sempre do cliente.
- Serverless/FaaS:
  - Funções disparadas por eventos, com escala automática até zero e cobrança por invocação × duração × memória.
  - São sem estado, têm limite de tempo e sofrem partida a frio (cold start), que se mitiga com concorrência provisionada.

**Escalabilidade, alta disponibilidade, nuvem híbrida e monitoramento**
- Escalabilidade e elasticidade:
  - Vertical (scale up) × horizontal (scale out: aplicação sem estado e balanceador).
  - Elasticidade é ajustar para cima e para baixo automaticamente.
- Região, zonas e disponibilidade:
  - Uma região contém zonas de disponibilidade isoladas. Distribuir entre zonas protege contra falha de datacenter; entre regiões, contra desastre regional.
  - Disponibilidade em série = produto; em paralelo = 1 − ∏(1 − Ai). **Conferido por script:** 2 servidores de 99% em paralelo, com balanceador de 99,9% e banco de 99,5%, dão ≈ 99,39%.
  - 99,9% equivale a ≈ 8,76 h por ano.
  - RTO × RPO.
- Híbrida × multicloud:
  - Híbrida: local/privada + pública integradas, como no cloud bursting.
  - Multicloud: vários provedores públicos.
  - Conexão por VPN site a site ou enlace dedicado.
- Monitoramento:
  - Métricas, logs e rastros. Sinais de ouro: latência, tráfego, erros e saturação.
  - SNMP: UDP 161, traps na 162; a v3 tem autenticação e cifragem.
  - Ferramentas: Prometheus (pull), Zabbix, Grafana e OpenTelemetry.

## 3. Pontos de cautela
- **Padrão da política de execução em clientes Windows:** a documentação do 5.1 indica Restricted; a do 7.5 indica RemoteSigned, mas ainda menciona Restricted efetivo. **Não cobrar.**
- **RFC 8446 → RFC 9846 (jul. 2026):** a versão continua sendo TLS 1.3. "Obsoleto" em RFC não significa proibido: o TLS 1.2 segue em uso.
- **WPA3 em 6 GHz:** confirmado apenas em documentação de fabricantes, por isso cobrar com cautela.
- **Wi-Fi CERTIFIED 7:** o lançamento em janeiro de 2024 **não foi confirmado nesta sessão**.
- **KVM:** a classificação tipo 1 × tipo 2 varia na literatura. Não usar como ponto decisivo.
- **TCP/IP:** o modelo de 4 camadas (RFC 1122) difere do modelo didático de 5. Nomear o modelo no enunciado.
- **/31 ponto a ponto é válido (RFC 3021):** não usar como distrator.
- **IPv6:** formas não canônicas também são válidas (RFC 4291). Cada questão deve ter só uma forma válida entre as alternativas.
- **NTLM:** fontes secundárias divergem sobre a remoção do NTLMv1 no 24H2. Cobrar apenas "Kerberos é o padrão e o NTLM é legado".
- **Limites de fornecedores de nuvem** (tempo máximo de função etc.) mudam. Não cobrar números.
- **FHS 3.0 (2015)** é a última versão conhecida; a existência de revisão posterior **não foi confirmada nesta sessão**.
- **Aliases do PowerShell 7 fora do Windows** (ls, ps, cat não definidos): **não confirmado nesta sessão**, então não cobrar.

## 4. Fontes
- github.com/quicwg/base-drafts (README)
- rfc-editor.org/rfc/rfc9846; datatracker.ietf.org/doc/draft-ietf-tls-rfc8446bis
- ieee802.org/11; anúncio de publicação do IEEE 802.11be-2024; Wikipedia, "IEEE 802.11be-2024" e "Wi-Fi 8" (secundárias)
- Cisco, "WPA3 Deployment Guide" e "Migrate to Wi-Fi 7 and 6 GHz"; Meraki, "WPA3 Encryption and Configuration Guide" (secundárias)
- NIST SP 800-145 (nvlpubs.nist.gov)
- github.com/MicrosoftDocs/PowerShell-Docs: about_Execution_Policies (5.1 e 7.5)
- The Register (06/06/2024) e Petri, sobre a preterição do NTLM (secundárias)
- RFCs citados de memória: 768, 959, 1034/1035, 1122, 1918, 2131, 3021, 3849, 3927, 4193, 4217, 4251–4254, 4291, 4511, 4862, 5321, 5425, 5737, 5952, 6409, 6598, 6797, 7541, 7766, 8200, 8314, 9110, 9113, 9293. Também NIST SP 800-41 Rev. 1 e crontab(5)/cronie.
