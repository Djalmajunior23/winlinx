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

---

## 💻 Comandos e Testes Automatizados

### Rodar a Suíte Completa de Testes
```bash
npm test
```
```text
✔ Linux Simulator: Navegação, VFS e I/O Redirection (52.7ms)
✔ Linux Simulator: Detecção de Processos & Kill com Syscall (4.0ms)
✔ Linux Simulator: Firewall Netfilter & UFW Rule (2.1ms)
✔ Windows Simulator: DACL, Processos e EDR Alerts (3.2ms)
✔ Windows Simulator: Registro reg.exe e Hardening RunAsPPL (0.7ms)
✔ Windows Simulator: Firewall netsh advfirewall Rule (1.1ms)
✔ Linux Simulator: Kernel Copilot (explain, hint), Capabilities e Logs Forenses auditd (0.8ms)
✔ Windows Simulator: Kernel Copilot (explain, hint) e Logs Forenses Event ID 4688/4672 (0.4ms)
✔ Linux Simulator: Sistemas de Arquivos POSIX, stat, Inodes e umask (0.4ms)
✔ Windows Simulator: Sistemas de Arquivos NTFS, Alternate Data Streams (ADS) e fsutil MFT (0.4ms)
✔ Linux Simulator: IPC (mkfifo, ipcs), LKMs (lsmod, rmmod), Resgate e Script Runner (1.2ms)
✔ Windows Simulator: Named Pipes (\\.\pipe\), Kernel Drivers BYOVD (driverquery), Resgate e PowerShell Runner (2.6ms)
✔ WinLinx Ultimate Range: Engenharia Reversa (readelf / dumpbin) & Kerberos AD (klist) (4.5ms)
ℹ tests 13, pass 13, fail 0
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
