# WinLinx ULTIMATE - Simulador de Sistemas Operacionais & Cibersegurança

<p align="center">
  <img src="public/favicon.svg" alt="WinLinx Logo" width="96" height="96" />
</p>

> **WinLinx ULTIMATE** é uma plataforma de engenharia de software e simulação de **Sistemas Operacionais (Código Aberto vs Código Fechado)** desenhada especificamente para formação prática em **Cibersegurança Ofensiva e Defensiva**. O sistema atua como microfrontend ou aplicação autônoma integrável ao ecossistema **CiberLab Academy** e **CiberSim**.

---

## 🏛️ Novas Funcionalidades de Engenharia Adicionadas

### 1. Inspetor de Memória Virtual, ASLR & DEP/NX
- **Mapeamento do Espaço de Endereçamento Virtual (VASP):**
  - Segmentação visual: `Kernel Space (Ring 0)`, `Stack (Pilha)`, `Shared Libraries (DLLs / .so)`, `Heap (Alocação Dinâmica)`, `.data`, `.bss` e `.text (Código R-X)`.
- **Mecanismos de Segurança de Hardware e SO:**
  - **ASLR (Address Space Layout Randomization):** Simulação dinâmica com randomização de endereços base.
  - **DEP / NX (Data Execution Prevention):** Proteção de páginas com bit No-Execute (Write XOR Execute).
  - **Simulador de Injeção de Shellcode & NOP Sled:** Teste interativo demonstrando a violação de acesso (`EXCEPTION_ACCESS_VIOLATION 0xC0000005`) quando DEP está ligado versus a execução indevida quando desativado.

### 2. Windows Registry Explorer (`regedit` & Hive Simulator)
- **Navegador Visual e CLI (`reg.exe`):**
  - Inspeção das Hives `HKEY_LOCAL_MACHINE` (`HKLM`).
  - Chaves de Persistência: `HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run`.
  - Configuração de Segurança LSA: `HKLM\SYSTEM\CurrentControlSet\Control\Lsa`.
  - Serviços NT: `HKLM\SYSTEM\CurrentControlSet\Services\WinVulnerableUpdater`.
- **Hardening do LSASS (RunAsPPL):**
  - O aluno aprende a ativar o valor `RunAsPPL=1` no Registro para isolar o processo `lsass.exe` como Protected Process Light, mitigando ataques de dump de senhas com Mimikatz (`FLAG{WINLINX_WINDOWS_LSA_RUNASPPL_ACTIVATED_2026}`).

### 3. Simulador de Firewalls de Host (Netfilter/UFW vs WFP/netsh)
- **Controle de Tráfego de Rede na Camada de Kernel:**
  - **Linux (Netfilter / iptables / UFW):** Comandos `ufw status`, `ufw deny 4444` e `iptables -A INPUT -p tcp --dport 4444 -j DROP`.
  - **Windows (Windows Filtering Platform / netsh advfirewall):** Comandos `netsh advfirewall firewall show rule` e regras de bloqueio com `netsh advfirewall firewall add rule`.
- **Sonda Interativa de Portas (Port Tester):**
  - O aluno dispara sondas TCP SYN em tempo real e visualiza o descarte de pacotes (*Packet Drop*) nas portas de C2 bloqueadas.

### 4. Árvore Hierárquica Completa de Processos (`pstree` & `tasklist`)
- Catálogo de processos legítimos do Linux (`systemd`, `kthreadd`, `systemd-journald`, `systemd-udevd`, `auditd`, `sshd`, `dbus-daemon`, `cron`, `nginx`).
- Catálogo de processos legítimos do Windows (`System Idle Process`, `System`, `smss.exe`, `csrss.exe`, `wininit.exe`, `services.exe`, `lsass.exe`, `svchost.exe`, `winlogon.exe`, `explorer.exe`).
- Comparação contínua de caminho real vs caminho homologado para detecção de **Masquerading (MITRE ATT&CK T1036)**.

### 5. Anatomia Comparativa de Kernel (Monolítico vs Híbrido NT)
- **Visualizador Interativo de Níveis de Privilégio de Hardware (Ring 3 vs Ring 0):**
  - **Linux (Monolítico / Open-Source):** Espaço de Usuário (`Ring 3`: glibc, shells, daemons) ➔ Instrução `SYSCALL` / `sys_enter` (MSR_LSTAR) ➔ Espaço de Kernel Privilegiado (`Ring 0`: VFS, CFS Process Scheduler, MMU/Paging, Netfilter, Drivers LKMs compartilhando o mesmo espaço de memória).
  - **Windows NT (Híbrido / Proprietário):** Espaço de Usuário (`Ring 3`: Subsystem DLLs `kernel32/user32`, `csrss.exe`, `lsass.exe`, `ntdll.dll`) ➔ `KiFastSystemCall` / `SYSENTER` e SSDT ➔ Espaço de Kernel Privilegiado (`Ring 0`: Windows Executive com SRM, Object Manager, Microkernel, HAL `hal.dll`, subsistema gráfico `win32k.sys` e drivers de kernel).
  - **Análise de Ameaças & Mitigações:** Rootkits de Kernel (DKOM, SSDT Hooking), KASLR, SMEP, SMAP, KPTI e PatchGuard (Kernel Patch Protection).

### 6. Central Forense de Auditoria e Logs de SO (SIEM / Event Viewer)
- **Windows Event Viewer (`Security.evtx` & `System.evtx`):**
  - Auditoria em tempo real correlacionada com execuções no terminal.
  - Event IDs: **4688** (Criação de processo com linha de comando e nível de elevação de token), **7045** (Novo serviço instalado), **4672** (Privilégios especiais atribuídos ao logon como `SeDebugPrivilege` e `SeImpersonatePrivilege`), **4624/4625** (Logons com sucesso e falha).
- **Linux Auditd & Syslog (`audit.log` & `auth.log`):**
  - Registros de chamadas `execve`, `ptrace`, `setuid` e `kill`, com identificação de UID real vs UID efetivo (EUID).
  - Sessões PAM e tentativas de acesso com `sudo` gravadas dinamicamente.
- **Exportação de Dossiê:** Exportação de evidências forenses em formato padronizado JSON para relatórios de incidentes.

### 7. Kernel Copilot & Trilha de Escalação de Privilégios no Terminal
- **Comando `explain <termo>`:** Explicações pedagógicas em tempo real no terminal (`explain ptrace`, `explain lsass`, `explain aslr`, `explain dep`, `explain fork`, `explain seimpersonate`, `explain unquoted`, `explain runasppl`, `explain capabilities`, `explain posix`, `explain ntfs`, `explain ads`, `explain inode`).
- **Comando `hint`:** Mentor interativo de Kernel com orientações defensivas e investigativas.
- **Linux Capabilities (`getcap` / `setcap`):** Exploração e mitigação de binários com `cap_setuid+ep` (`/usr/bin/python3.11`).
- **Seletor de Postura Operacional:** Alternância rápida entre **Blue Team (Defesa & Hardening)** e **Red Team (Ataque & PrivEsc)** no cabeçalho.

### 8. Sistemas de Arquivos & Permissões (ext4 / POSIX vs NTFS / DACL)
- **Mapeamento de Storage & Estruturas de Disco:**
  - **Linux (ext4 / VFS):** Superblock, Inode Table (`stat`, `ls -i`), Blocos de Dados, Journaling e Links (Hard vs Soft).
  - **Windows (NTFS):** Master File Table ($MFT), registros de 1024 bytes ($STANDARD_INFORMATION, $FILE_NAME, $SECURITY_DESCRIPTOR, $DATA), $LogFile e metadados de volume via `fsutil fsinfo ntfsinfo C:`.
- **Calculadora Interativa de Permissões POSIX:**
  - Seletor dinâmico de Owner, Group e Others (r, w, x) com pesos binários 4, 2 e 1.
  - Bits especiais: **SUID (4000)**, **SGID (2000)** e **Sticky Bit (1000)** com geração imediata do comando `chmod <octal>`.
- **NTFS Alternate Data Streams (ADS - $DATA):**
  - Simulação forense de streams ocultos em arquivos legítimos (ex: `invoice.pdf:hidden_payload.ps1:$DATA`).
  - Identificação de **Zone.Identifier (MOTW - Mark of the Web)** e inspeção via comando `dir /r` e `Get-Content -Stream`.

### 9. Scanner & Auditoria de Vulnerabilidades de SO (Security Audit Dashboard)
- **Varredura Automatizada & Pontuação de Hardening (0 a 100%):**
  - **Auditoria Linux:** Detecção de binários SUID permissivos (`/bin/find` 4755), capabilities abusivas (`cap_setuid+ep`), processos anômalos em `/tmp/.hidden` e regras ausentes no Netfilter.
  - **Auditoria Windows:** Detecção de Unquoted Service Paths, DACLs excessivas para `BUILTIN\Users`, ausência de isolamento `RunAsPPL` no LSASS e portas C2 abertas sem regra no WFP.
- **Remediação Assistida:**
  - Botão de um clique para aplicar comandos de remediação diretamente no terminal e acompanhar a atualização do índice de postura defensiva.

---

### 10. Módulo de Comunicação Inter-Processos (IPC: Unix Sockets vs Named Pipes)
- **Comparativo Técnico de Arquiteturas IPC:**
  - **Linux (POSIX & SysV):** Pipes Anônimos e Nomeados via `mkfifo`, Unix Domain Sockets (`/var/run/docker.sock`), Memória Compartilhada (`/dev/shm`), Filas de Mensagens e Sinais de Kernel (`kill -SIG*`).
  - **Windows NT:** Named Pipes (`\\.\pipe\*`), ALPC (Advanced Local Procedure Call) e Mailslots.
- **Auditoria & Vetores de Exploração:**
  - Inspeção de Named Pipes no Windows via `dir \\.\pipe\` (`spoolss`, `samr`, `lsass`).
  - Explicação e simulação de abuso de personificação de tokens (`ImpersonateNamedPipeClient` / PrintSpoofer) e escape de containers via Docker Socket.

### 11. Subsistema de Drivers de Kernel, Módulos LKMs e Mecânica BYOVD
- **Módulos de Kernel Linux (LKM):**
  - Listagem com `lsmod` e descarregamento dinâmico de rootkits via `rmmod rootkit_diamorphine`.
  - Análise de ganchos em `sys_call_table`.
- **Drivers de Dispositivo Windows (`.sys`):**
  - Auditoria com `driverquery` identificando drivers críticos (`ntfs.sys`, `fltmgr.sys`) e drivers vulneráveis com assinatura válida (`gdrv.sys` - CVE-2018-19320).
  - Simulação da técnica **BYOVD (Bring Your Own Vulnerable Driver - MITRE T1068)** para burlar o DSE (Driver Signature Enforcement).

### 12. Threat Injector em Tempo Real & Centro de Resposta a Incidentes (IR)
- **Simulação Ativa de Ataques:**
  - **Ransomware:** Criptografia de arquivos (`.locked`), geração de nota de resgate `LEIA_ME_RESGATE.txt` e mitigação via `restore-files`.
  - **Cryptominer:** Picos de CPU para 100%, evasão de processos e remediação com encerramento de threads e bloqueio de pool de mineração.
  - **Kernel Rootkit:** Ocultação de PIDs e ganchos de chamadas com descarregamento de LKM.
- **Painel de Triagem & Saúde:**
  - Timer regressivo de 180 segundos para resposta a incidentes, barra de saúde do sistema e checklists de contenção, erradicação e recuperação.

### 13. Runner de Scripts Multi-Linha & Construtor Customizado de Labs CTF
- **Interpretadores de Scripts no VFS:**
  - Linux: Execução sequencial de scripts `.sh` via `bash <script.sh>` ou `sh <script.sh>`.
  - Windows: Execução sequencial de scripts `.ps1` via `powershell -File <script.ps1>`.
- **Custom Lab Builder para Instrutores:**
  - Interface interativa para criar desafios personalizados com título, descrição, sistema operacional alvo, tarefas e flags customizadas.
  - Exportação e importação instantânea de esquemas JSON `.winlinx-lab.json` para compartilhamento entre turmas.

### 14. Motor de Análise Dinâmica de Malware & Sandbox Forense (Cuckoo / ANY.RUN Style)
- **Execução Contida em Hypervisor Simulado:**
  - Detonação isolada de artefatos maliciosos reais (`mssecsvc.exe` WannaCry, `dvrHelper.elf` Mirai Botnet, `loader_hollowing.exe`).
  - Desarmamento de verificações **Anti-Análise & Anti-VM** (`IsDebuggerPresent()`, `Sleep` com `NtDelayExecution`, checagem de CPU cores e nomes de processos de AV).
  - Cálculo automatizado de **Threat Score (0 a 10.0)** e mapeamento MITRE ATT&CK (`FLAG{WINLINX_SANDBOX_MALWARE_ANALYZED_2026}`).

### 15. Módulo de Engenharia Reversa & Descompilação de Binários (PE vs ELF)
- **Análise Estática de Cabeçalhos e Seções:**
  - **Windows PE:** DOS Header `MZ`, PE Signature, IAT (Import Address Table) auditando chamadas críticas (`VirtualAllocEx`, `WriteProcessMemory`, `CreateRemoteThread`).
  - **Linux ELF:** Magic `\x7fELF`, Program Headers, Section Headers (`.text`, `.rodata`, `.got.plt`, `.bss`).
- **Verificação de Entropia & Packing:**
  - Detecção de compactação e ofuscação (ex: UPX com entropia > 7.5).
- **Desmontador Assembly x86_64:**
  - Inspeção do fluxo de instruções assembly (`sub rsp`, `mov rax, gs:[60h]` para PEB, `syscall` para `ptrace`), desvendando evasões de baixo nível (`FLAG{WINLINX_REVERSE_ENGINEERING_DISASM_2026}`).

### 16. Topologia de Rede, Pivoteamento & Movimentação Lateral (Active Directory & SSH)
- **Simulação de Rede Corporativa Multi-Host:**
  - **Workstation (WS-ALUNO-01):** Ponto de acesso inicial com serviços WinRM/SMB.
  - **Jump Server (SRV-LINUX-JUMP):** Servidor Linux com SSH e Docker Socket (`/var/run/docker.sock`).
  - **Domain Controller (CORP-DC-01):** Kerberos KDC, LDAP e SMB.
- **Técnicas de Exploração em Cadeia:**
  - Pivot para Linux via SSH ➔ Docker Socket Breakout para root ➔ Kerberoasting e Pass-the-Ticket obtendo domínio total (`FLAG{WINLINX_LATERAL_MOVEMENT_DOMAIN_DOMINATED_2026}`).

### 17. Emulação de Adversários Automatizada (Campanhas APT - MITRE ATT&CK)
- **Campanhas de Ameaças Avançadas:**
  - **APT29 (Cozy Bear / Nobelium):** Operação Sunburst / Supply Chain trojanizando DLLs, sleep prolongado, Golden Ticket e exfiltração HTTPS.
  - **LockBit 3.0 (Black):** Ransomware-as-a-Service com encerramento de defesas, exclusão de cópias de sombra (`vssadmin`) e criptografia rápida.
- **Defesa Ativa:**
  - Interface interativa para analistas SOC aplicarem contramedidas específicas em cada tática da Kill Chain (`FLAG{WINLINX_APT_ADVERSARY_EMULATION_NEUTRALIZED_2026}`).

### 18. Assistente Autônomo de Resposta SOAR (Security Orchestration, Automation & Response)
- **Playbooks Automatizados com Controles Human-in-the-Loop:**
  - Contenção imediata de Ransomware via isolamento de rede WFP (`netsh advfirewall set allprofiles firewallpolicy blockinbound,blockoutbound`).
  - Solicitação de aprovação de analista sênior para encerramento forçado de processos críticos com tokens SYSTEM.
  - Orquestração de snapshots forenses e restauração automatizada de arquivos (`restore-files`) (`FLAG{WINLINX_SOAR_PLAYBOOK_AUTOMATION_EXECUTED_2026}`).

### 19. Motor de Análise Forense de Memória RAM (Volatility Lite Simulator)
- **Inspeção de Despejos de Memória Física (`memory.raw`):**
  - **`windows.malfind`:** Detecção de páginas de memória alocadas com permissão `PAGE_EXECUTE_READWRITE` (violação do princípio W^X) contendo shellcodes de Cobalt Strike ou cabeçalhos PE injetados.
  - **`windows.psscan`:** Localização de processos desvinculados da lista duplamente encadeada `_EPROCESS` por rootkits via manipulação de ponteiros DKOM.
  - **`linux.check_syscall`:** Comparação de `sys_call_table` contra o `System.map` identificando ganchos de rootkits LKM (`diamorphine.ko`) em `sys_getdents64` e `sys_kill` (`FLAG{WINLINX_MEMORY_VOLATILITY_ANALYZED_2026}`).

### 20. Threat Hunting Studio: Criação de Regras YARA & SIGMA
- **YARA Studio:**
  - Editor interativo para assinaturas de detecção de malwares com blocos `meta`, `strings` (hexadecimal, ascii, wide) e `condition`.
  - Scanner de regras integrado que varre o VFS e segmentos de memória com flags de confirmação (`FLAG{WINLINX_YARA_SIGMA_RULE_HUNTER_2026}`).
- **SIGMA Rule Converter:**
  - Criação de regras de detecção agnósticas (YAML) convertidas automaticamente para queries Splunk e Elastic Lucene.

### 21. Segurança em Nuvem & Contêineres (Cloud & Kubernetes Workload Defense)
- **Simulação de Fuga de Contêiner (Container Breakout - MITRE T1611):**
  - Fuga via montagem indevida do Docker Socket (`/var/run/docker.sock`) obtendo shell root no host.
  - Abuso de contêineres com `--privileged` ou `CAP_SYS_ADMIN` montando cgroups do host.
  - Exploração SSRF contra APIs de metadados de instâncias em nuvem (IMDSv1 `169.254.169.254`) extraindo credenciais de Role IAM temporárias (`FLAG{WINLINX_CLOUD_CONTAINER_SECURITY_BREACHED_2026}`).

### 22. Evasão de EDR: Syscalls Diretas & Unhooking (Hell's Gate / Halos Gate)
- **Mapeamento de Ganchos de User-Mode:**
  - Inspeção de memória dos stubs de `ntdll.dll` (`NtAllocateVirtualMemory`, `NtProtectVirtualMemory`, `NtCreateThreadEx`), identificando desvios `JMP` injetados por sensores de antivírus/EDR.
- **Técnicas de Evasão Avançadas:**
  - **Hell's Gate / Halos Gate:** Resolução dinâmica do System Service Number (SSN) e execução direta da instrução `syscall` em assembly inline.
  - **Unhooking (Perun's Fart):** Leitura de `ntdll.dll` original do disco e substituição a quente da seção `.text` em memória virtual (`FLAG{WINLINX_EDR_DIRECT_SYSCALL_HELLS_GATE_2026}`).

### 23. Criptoanálise & Quebra Acelerada de Hashes (Hashcat Lite)
- **Formatos de Hashes de Autenticação:**
  - Quebra acelerada via OpenCL/GPU de senhas Linux `/etc/shadow` (SHA-512 `$6$`), Windows NTLM (`MD4`) e Kerberos TGS (Kerberoasting).
  - Telemetria de taxa de hashes por segundo (GH/s) e regras de mutação com wordlists (`FLAG{WINLINX_HASHCAT_CREDENTIAL_CRACKED_2026}`).

### 24. Inteligência de Ameaças (CTI / MISP TAXII Feed)
- **Correlacionamento de Indicadores de Comprometimento (IOCs):**
  - Feed de IPs de C2, hashes de malwares conhecidos (WannaCry, Mirai) e domínios DGA com níveis de confiança (95%).
  - Exportação e compartilhamento de relatórios no padrão internacional **STIX 2.1 / TAXII** (`FLAG{WINLINX_CTI_MISP_STIX_CORRELATED_2026}`).

### 25. Sistemas Industriais & OT (SCADA / Modbus TCP & Firmware Analysis)
- **Exploração de Redes Operacionais (ICS/OT):**
  - Simulação de PLC industrial (Siemens S7-1200) e protocolo Modbus TCP na porta 502.
  - Injeção de pacotes `Force Single Coil` (Função 05) causando sobrepressão de 14.8 Bar em turbinas industriais (estilo *Stuxnet*).
  - Extração forense de firmware IoT com simulador de `binwalk` extraindo sistemas de arquivos SquashFS (`FLAG{WINLINX_ICS_SCADA_MODBUS_EXPLOITED_2026}`).

---

## 💻 Comandos e Testes Automatizados

### Rodar a Suíte Completa de Testes
```bash
npm test
```
```text
✔ Linux Simulator: Navegação, VFS e I/O Redirection (76.4ms)
✔ Linux Simulator: Detecção de Processos & Kill com Syscall (1.4ms)
✔ Linux Simulator: Firewall Netfilter & UFW Rule (0.8ms)
✔ Windows Simulator: DACL, Processos e EDR Alerts (4.4ms)
✔ Windows Simulator: Registro reg.exe e Hardening RunAsPPL (3.1ms)
✔ Windows Simulator: Firewall netsh advfirewall Rule (1.7ms)
✔ Linux Simulator: Kernel Copilot (explain, hint), Capabilities e Logs Forenses auditd (1.5ms)
✔ Windows Simulator: Kernel Copilot (explain, hint) e Logs Forenses Event ID 4688/4672 (29.2ms)
✔ Linux Simulator: Sistemas de Arquivos POSIX, stat, Inodes e umask (8.6ms)
✔ Windows Simulator: Sistemas de Arquivos NTFS, Alternate Data Streams (ADS) e fsutil MFT (10.4ms)
✔ Linux Simulator: IPC (mkfifo, ipcs), LKMs (lsmod, rmmod), Resgate e Script Runner (3.5ms)
✔ Windows Simulator: Named Pipes (\\.\pipe\), Kernel Drivers BYOVD (driverquery), Resgate e PowerShell Runner (1.5ms)
✔ WinLinx Ultimate Range: Engenharia Reversa (readelf / dumpbin) & Kerberos AD (klist) (1.0ms)
✔ WinLinx Fase 4: Forense de Memória (Volatility), YARA Hunting e Cloud/Docker Breakout (1.0ms)
✔ WinLinx Fase 5: Quebra de Credenciais (Hashcat), Firmware Forensics (Binwalk) e SCADA OT (Modbus) (0.8ms)
ℹ tests 15, pass 15, fail 0
```
```

### Iniciar o Ambiente Interativo
```bash
npm run dev
```
Acesse: `http://localhost:3000`

### Build para Produção
```bash
npm run build
```
---

## 🔒 Cobertura MITRE ATT&CK Expandida

| Técnica MITRE | Nome | Laboratório / Módulo |
| :--- | :--- | :--- |
| **T1548.001** | Setuid and Setgid | Lab 01 (Linux find) |
| **T1548.002** | Bypass UAC / DACL | Lab 01 (Windows icacls) |
| **T1057** | Process Discovery | Explorador de Processos (`pstree`) |
| **T1036** | Masquerading | Detecção de caminho anômalo (`/tmp/.hidden`) |
| **T1053.003** | Scheduled Task: Cron | Lab 03 (`/etc/crontab`) |
| **T1574.009** | Unquoted Service Path | Lab 03 (`sc qc WinVulnerableUpdater`) |
| **T1110** | Brute Force Detection | Lab 04 (`/var/log/auth.log`) |
| **T1078** | Valid Accounts / Event Logs | Lab 04 (`Security.evtx` Event 4625) |
| **T1087** | Account Discovery / Tokens | Lab 05 (`whoami /priv`) |
| **T1003.001** | LSASS Memory Dumping | Registro (`RunAsPPL` Hardening) |
| **T1547.001** | Registry Run Keys / Startup | Registro (`CurrentVersion\Run`) |
| **T1049** | System Network Connections | Firewall de Host (`ufw` & `netsh`) |
| **T1055** | Process Injection / DEP Bypass | Inspetor de Memória Virtual (ASLR/DEP) |
| **T1548.001** | Capabilities Abuse / cap_setuid | Kernel Copilot (`getcap` / `setcap`) |
| **T1134.001** | Token Impersonation / SeImpersonate | Kernel Copilot (`explain seimpersonate`) |
| **T1059.001** | Process Creation Telemetry | Central Forense (Windows Event 4688) |
| **T1543.003** | Windows Service Persistence | Central Forense (System Event 7045) |
| **T1564.004** | Alternate Data Streams (ADS) | Storage & Permissões (`dir /r` & ADS Explorer) |
| **T1083** | File and Directory Discovery | Storage & Permissões (`stat` & Inodes) |
| **T1068** | Exploitation for Privilege Escalation | Scanner & Auditoria de Vulnerabilidades |
