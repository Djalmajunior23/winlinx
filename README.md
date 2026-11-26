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
- **Comando `explain <termo>`:** Explicações pedagógicas em tempo real no terminal (`explain ptrace`, `explain lsass`, `explain aslr`, `explain dep`, `explain fork`, `explain seimpersonate`, `explain unquoted`, `explain runasppl`, `explain capabilities`).
- **Comando `hint`:** Mentor interativo de Kernel com orientações defensivas e investigativas.
- **Linux Capabilities (`getcap` / `setcap`):** Exploração e mitigação de binários com `cap_setuid+ep` (`/usr/bin/python3.11`).
- **Seletor de Postura Operacional:** Alternância rápida entre **Blue Team (Defesa & Hardening)** e **Red Team (Ataque & PrivEsc)** no cabeçalho.

---

## 💻 Comandos e Testes Automatizados

### Rodar a Suíte Completa de Testes
```bash
npm test
```
```text
✔ Linux Simulator: Navegação, VFS e I/O Redirection (13ms)
✔ Linux Simulator: Detecção de Processos & Kill com Syscall (0.3ms)
✔ Linux Simulator: Firewall Netfilter & UFW Rule (0.2ms)
✔ Windows Simulator: DACL, Processos e EDR Alerts (1.0ms)
✔ Windows Simulator: Registro reg.exe e Hardening RunAsPPL (0.2ms)
✔ Windows Simulator: Firewall netsh advfirewall Rule (0.2ms)
✔ Linux Simulator: Kernel Copilot (explain, hint), Capabilities e Logs Forenses auditd (0.3ms)
✔ Windows Simulator: Kernel Copilot (explain, hint) e Logs Forenses Event ID 4688/4672 (0.9ms)
ℹ tests 8, pass 8, fail 0
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
