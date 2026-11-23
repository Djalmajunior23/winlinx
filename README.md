# WinLinx - Simulador Prático de Sistemas Operacionais & Cibersegurança

<p align="center">
  <img src="public/favicon.svg" alt="WinLinx Logo" width="96" height="96" />
</p>

> **WinLinx** é um ambiente de simulação prático e interativo focado no aprendizado profundo de **Sistemas Operacionais (Código Aberto vs Código Fechado)** aplicado à **Cibersegurança Ofensiva e Defensiva**. O sistema integra-se ao ecossistema educacional de segurança cibernética (CiberLab Academy / CiberSim).

---

## 🎯 Por que WinLinx?

No estudo de cibersegurança, o domínio de Sistemas Operacionais é a base para qualquer especialização:
- **Red Team (Ofensivo):** Exploração de permissões fracas (SUID, DACL), escalação local de privilégios (LPE), injeção de processos, criação de persistências (Cron, Task Scheduler, Services).
- **Blue Team / SOC / DFIR (Defensivo):** Rastreamento de processos anômalos, investigação de conexões suspeitas, análise forense de logs de autenticação (`/var/log/auth.log` vs `Security.evtx`), auditoria e hardening CIS Benchmarks.

O **WinLinx** resolve a lacuna entre teoria e prática ao colocar o aluno em contato com **dois ambientes simultâneos**:
1. **Linux (GNU/Linux):** Representando a filosofia de **Código Aberto** (kernel monolítico, POSIX, tudo é arquivo, permissões UGO/SUID, systemd, journald).
2. **Windows (Microsoft Windows):** Representando a arquitetura de **Código Fechado / Proprietário** (kernel híbrido, Win32/NT API, NTFS DACL/SACL, tokens de acesso, Registro do Windows, Event Viewer .evtx).

---

## 🚀 Principais Funcionalidades

- **Dual-Shell Playground:** Execute comandos no Linux (Bash) e no Windows (PowerShell) lado a lado em tempo real.
- **5 Laboratórios Práticos Guiados com Validação Automática:**
  1. *Lab 01:* Caça e Remediação de Permissões Críticas (Linux SUID vs Windows DACL/icacls).
  2. *Lab 02:* Triagem de Processos & Detecção de Malware Oculto (`ps aux` + `ss` vs `Get-Process` + `netstat -ano`).
  3. *Lab 03:* Caça a Persistências em Serviços e Agendadores (Cron vs Unquoted Service Path).
  4. *Lab 04:* Investigação Forense de Logs & Rastreamento de Logins (`auth.log` vs `Security.evtx` Event 4625/4672).
  5. *Lab 05:* Hardening de Estação de Trabalho & Baselines CIS (`whoami /priv` vs `sudoers NOPASSWD`).
- **Comparador Lado a Lado de Comandos & Conceitos:** Busca instantânea da sintaxe e mecanismo correspondente entre os dois SOs.
- **Captura de Flags (CTF-Style):** Feedback imediato ao resolver anomalias e descobrir configurações inseguras.
- **Exportação de Evidências em JSON e Emissão de Certificados:** Compatibilidade total com o modelo de dados e auditoria do CiberLab Academy.

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite
- **Estilização:** Tailwind CSS v4 + Lucide React Icons
- **Simulação de Kernel & Shell:** Virtual File System com motores sandboxed em TypeScript para Linux e Windows.
- **Persistência de Progresso:** `localStorage` do navegador com suporte a exportação de relatório pericial em JSON.

---

## 💻 Como Executar

### 1. Clonar o repositório
```bash
git clone https://github.com/Djalmajunior23/winlinx.git
cd winlinx
```

### 2. Instalar as dependências
```bash
npm install
```

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```

Acesse no seu navegador: `http://localhost:3000`

### 4. Build para produção
```bash
npm run build
```

---

## 📂 Estrutura do Projeto

```
winlinx/
├── public/
│   └── favicon.svg             # Ícone do projeto (Escudo Dual OS)
├── src/
│   ├── components/
│   │   ├── Navbar.tsx                  # Navegação e placar de flags
│   │   ├── Terminal.tsx                # Terminal interativo realista
│   │   ├── DualTerminalPlayground.tsx  # Playground lado a lado (Split)
│   │   ├── CommandComparator.tsx       # Tabela comparativa interativa
│   │   ├── CurriculumView.tsx          # Módulos teóricos de SO e MITRE
│   │   ├── LabRunnerView.tsx           # Executor guiado com validação
│   │   ├── DashboardView.tsx           # Visão geral e métricas do aluno
│   │   └── CertificateModal.tsx        # Emissão de certificado e JSON
│   ├── core/
│   │   ├── defaultFileSystem.ts        # Árvores virtuais Linux & Windows
│   │   ├── linuxEngine.ts              # Interpretador Bash & utilitários
│   │   └── windowsEngine.ts            # Interpretador PowerShell & WinAPI
│   ├── data/
│   │   ├── modules.ts                  # Currículo de SO Aberto vs Fechado
│   │   └── labs.ts                     # Definições completas dos 5 labs
│   ├── types/
│   │   └── simulator.ts                # Interfaces e tipos do simulador
│   ├── App.tsx                         # Componente raiz e gerenciamento
│   ├── main.tsx                        # Ponto de entrada React
│   └── index.css                       # Tailwind v4 e estilos globais
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔒 Alinhamento ao MITRE ATT&CK

| Técnica MITRE | Descrição | Cobertura no WinLinx |
| :--- | :--- | :--- |
| **T1548.001** | Setuid and Setgid | Lab 01 (Linux SUID find) |
| **T1548.002** | Bypass UAC / DACL | Lab 01 (Windows icacls) |
| **T1057** | Process Discovery | Lab 02 (`ps aux`, `Get-Process`) |
| **T1036** | Masquerading | Lab 02 (`kworker_rev`) |
| **T1053.003** | Scheduled Task: Cron | Lab 03 (`/etc/crontab`) |
| **T1574.009** | Unquoted Service Path | Lab 03 (`sc qc WinVulnerableUpdater`) |
| **T1110** | Brute Force Detection | Lab 04 (`/var/log/auth.log`) |
| **T1078** | Valid Accounts / Event Logs | Lab 04 (`Security.evtx` Event 4625) |
| **T1087** | Account Discovery / Tokens | Lab 05 (`whoami /priv`, `sudoers`) |

---

## 🎓 Conexão com o Ecossistema de Cibersegurança

O WinLinx foi desenhado para atuar como o módulo base para os alunos antes de ingressarem em trilhas avançadas como **Red Team**, **Blue Team**, **Purple Team** ou **DFIR** em plataformas como o **CiberLab Academy**. Ao final do treinamento, o aluno pode exportar suas evidências em formato JSON para aproveitamento no seu portfólio acadêmico e profissional.
