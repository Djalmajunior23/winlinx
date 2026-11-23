# WinLinx PRO - Simulador Prático de Sistemas Operacionais & Cibersegurança

<p align="center">
  <img src="public/favicon.svg" alt="WinLinx Logo" width="96" height="96" />
</p>

> **WinLinx PRO** é um ambiente de engenharia e simulação prático-pedagógica de **Sistemas Operacionais (Código Aberto vs Código Fechado)** integrado à especialização em **Cibersegurança Ofensiva e Defensiva**. O sistema atua como microfrontend ou aplicação autônoma comunicando-se com o ecossistema educacional de segurança cibernética (**CiberLab Academy** e **CiberSim**).

---

## 🎯 Arquitetura & Inovações de Engenharia

O WinLinx vai além de um terminal convencional: ele implementa o ciclo de vida completo de um Sistema Operacional simulado em memória (VFS + Process Scheduler + SRM + Syscall Dispatcher + EDR Engine):

### 1. Syscall Tracer & Kernel Layers (Ring 3 vs Ring 0)
- **Ring 3 (User Space):** Ambiente não privilegiado onde executam o shell, utilitários do usuário e binários.
- **Ring 0 (Kernel Space):** Onde reside o Kernel Monolítico (Linux) ou o Windows Executive/Microkernel (ntoskrnl.exe).
- **Rastreamento em Tempo Real:** Cada comando executado pelo aluno exibe as chamadas de sistema interceptadas:
  - *Linux (POSIX):* `execve()`, `openat()`, `read()`, `write()`, `getdents64()`, `kill()`, `mkdir()`.
  - *Windows (NT Native API):* `NtCreateUserProcess()`, `NtOpenFile()`, `NtQueryDirectoryFile()`, `NtTerminateProcess()`, `NtDuplicateToken()`.
- **Conceito de Cibersegurança:** Demonstra a relevância do *User-mode API Hooking* (utilizado por EDRs) e técnicas avançadas de *Direct Syscalls* para evasão.

### 2. Motor de EDR & Telemetria SOC em Tempo Real
- Agente heurístico embutido que analisa em tempo real os comandos digitados pelo aluno e aciona regras de detecção mapeadas ao **MITRE ATT&CK**:
  - *SUID Binary Enumeration:* `T1548.001`
  - *Unquoted Service Path Inspection:* `T1574.009`
  - *Process Masquerading (/tmp/.hidden):* `T1036`
  - *Local Account Token Enumeration (whoami /priv):* `T1087.001`
  - *Credential File Dumping (/etc/shadow):* `T1003.008`
- Diagnóstico do analista de SOC e recomendações imediatas de **Hardening**.

### 3. Shell Parser Robusto & Virtual File System (VFS)
- Suporte a argumentos complexos com aspas simples e duplas (ex: `icacls "C:\Program Files\Custom App"`).
- Redirecionamento de saída padrão: `>` (sobrescrita) e `>>` (anexação).
- Autocompletion inteligente via tecla <kbd>TAB</kbd> para comandos e caminhos de arquivo.
- Gerenciamento dinâmico de processos: `kill -9 <PID>` no Linux e `Stop-Process -Id <PID>` no Windows desativam processos e fecham portas de rede associadas em `ss` e `netstat`.

### 4. Event Bridge (Microfrontend Ready)
- Módulo `WinLinxEventBridge` baseado na Web `postMessage` API para emissão e recepção de eventos bidirecionais:
  - `WINLINX_READY`
  - `WINLINX_TASK_COMPLETED`
  - `WINLINX_FLAG_CAPTURED`
  - `WINLINX_LAB_FINISHED`

---

## 🚀 Principais Módulos da Aplicação

- **Visão Geral (Dashboard):** Métricas de progresso, placar de flags e comparação visual Código Aberto vs Fechado.
- **Trilha Curricular de SO:** Fundamentos teóricos, kernel monolítico vs híbrido, isolamento de memória e perspectiva Red/Blue Team.
- **Dual-Shell Playground:** Execução paralela de Linux e Windows com terminais xterm-like customizados.
- **5 Labs Práticos com Validação Automática:** Cenários reais com flags e pontuação.
- **Comparador Lado a Lado:** Guia de equivalência técnica imediata entre utilitários de comando.
- **Syscall Tracer:** Visualizador das chamadas de sistema e anéis de proteção da CPU.
- **Console EDR SOC:** Monitoramento defensivo de eventos e alertas.
- **Certificação Pericial:** Exportação em formato JSON compatível com a plataforma CiberLab.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite
- **Estilização:** Tailwind CSS v4 + Lucide React
- **Testes Unitários:** Test Runner Node 26 + Bundler esbuild
- **Arquitetura:** Microfrontend / Standalone Híbrido

---

## 💻 Comandos de Execução

### Instalação
```bash
npm install
```

### Ambiente de Desenvolvimento
```bash
npm run dev
```
Acesse em: `http://localhost:3000`

### Executar Testes Automatizados
```bash
npm test
```

### Compilar para Produção
```bash
npm run build
```

---

## 🧪 Cobertura de Testes Unitários

```text
✔ Linux Simulator: Navegação, VFS e I/O Redirection
✔ Linux Simulator: Detecção de Processos & Kill com Syscall
✔ Windows Simulator: DACL, Processos e EDR Alerts
ℹ tests 3, pass 3, fail 0
```
