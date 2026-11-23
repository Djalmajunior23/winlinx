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

---

## 💻 Comandos e Testes Automatizados

### Rodar a Suíte Completa de Testes
```bash
npm test
```
```text
✔ Linux Simulator: Navegação, VFS e I/O Redirection (47ms)
✔ Linux Simulator: Detecção de Processos & Kill com Syscall (3ms)
✔ Linux Simulator: Firewall Netfilter & UFW Rule (1ms)
✔ Windows Simulator: DACL, Processos e EDR Alerts (10ms)
✔ Windows Simulator: Registro reg.exe e Hardening RunAsPPL (2ms)
✔ Windows Simulator: Firewall netsh advfirewall Rule (1ms)
ℹ tests 6, pass 6, fail 0
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
