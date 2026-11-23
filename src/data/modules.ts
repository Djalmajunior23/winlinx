import { CurriculumModule } from '../types/simulator';

export const CURRICULUM_MODULES: CurriculumModule[] = [
  {
    id: 'mod-1-arquitetura',
    title: '1. Arquitetura de Sistemas Operacionais: Aberto vs Fechado',
    subtitle: 'Kernel Monolítico vs Híbrido, Syscalls, Gerenciamento de Memória e Estrutura de Processos',
    isOpenSourceVsClosed: {
      openSourceConcepts: [
        'Código-fonte totalmente auditável publicamente (GNU/Linux, BSD).',
        'Kernel monolítico: drivers e subsistemas essenciais rodam no mesmo espaço de memória do kernel para máxima performance.',
        'Chamadas de sistema diretas (Syscalls com POSIX: sys_read, sys_write, fork, execve).'
      ],
      closedSourceConcepts: [
        'Código proprietário fechado (Windows NT), foco em compatibilidade binária e abstração corporativa.',
        'Kernel híbrido: separação entre subsistema de usuário (Win32, POSIX subsystem) e Executive/Kernel.',
        'Abstração de chamadas via Win32 API, Native API (ntdll.dll) e RPC/COM.'
      ],
      comparativeAnalysis: 'No Linux, a transparência do código aberto permite auditar cada linha do kernel e compilar kernels customizados com patches de segurança (ex: grsecurity). No Windows, o modelo fechado foca em proteção de integridade com assunções proprietárias (PatchGuard/KPP), Driver Signature Enforcement e telemetria nativa.'
    },
    cybersecRelevance: 'Compreender a camada de kernel e chamadas de sistema é vital para detectar injeção de processos (Process Hollowing, DLL Injection), ganchos de API (API Hooking) e rootkits.',
    subtopics: [
      {
        title: 'Hierarquia de Processos e Memória',
        description: 'Como o SO organiza processos pais, filhos e isolamento de espaço de endereçamento virtual.',
        linuxSyntax: 'ps aux | grep <processo> ; pstree -p',
        windowsSyntax: 'Get-Process | Format-Table Id, ProcessName, Path ; tasklist',
        defensePerspective: 'Identificação de processos orfãos ou executáveis rodando fora de seus diretórios padrão (ex: svchost.exe fora de System32).',
        offensePerspective: 'Mascaramento de processos maliciosos usando nomes de processos legítimos (Masquerading - T1036).'
      },
      {
        title: 'Espaço de Usuário vs Espaço de Kernel (Ring 3 vs Ring 0)',
        description: 'A barreira de segurança que impede que um processo comum acesse diretamente a memória física ou dispositivos.',
        linuxSyntax: 'dmesg | tail -n 20 ; lsmod ; cat /proc/kallsyms',
        windowsSyntax: 'Get-WmiObject Win32_SystemDriver ; fltmc filters',
        defensePerspective: 'Monitoramento de drivers não assinados e módulos de kernel carregados dinamicamente.',
        offensePerspective: 'Exploração de vulnerabilidades de kernel para elevação total de privilégios (BYOVD - Bring Your Own Vulnerable Driver).'
      }
    ],
    labIds: ['lab-processes-memory']
  },
  {
    id: 'mod-2-permissoes-acesso',
    title: '2. Sistemas de Arquivos e Modelos de Controle de Acesso',
    subtitle: 'POSIX UGO / SUID vs NTFS DACL / SACL e Níveis de Integridade',
    isOpenSourceVsClosed: {
      openSourceConcepts: [
        'Arquitetura "Tudo é Arquivo": sockets, dispositivos (/dev) e informações de estado (/proc) são representados no FS.',
        'Modelo POSIX tradicional: Permissões de Leitura, Escrita e Execução para Usuário (U), Grupo (G) e Outros (O).',
        'Bits especiais: SUID (executa como proprietário), SGID e Sticky Bit.'
      ],
      closedSourceConcepts: [
        'NTFS (New Technology File System) com listas de controle de acesso detalhadas (ACLs).',
        'DACL (Discretionary Access Control List) e SACL (System Access Control List para auditoria).',
        'Níveis de Integridade (Mandatory Integrity Control): Untrusted, Low, Medium, High e System.'
      ],
      comparativeAnalysis: 'O Linux é direto e minimalista via `chmod` e `chown`, enquanto o Windows oferece granularidade cirúrgica com herança de permissões e controle ACE via `icacls`.'
    },
    cybersecRelevance: 'Configurações incorretas de permissões em pastas ou binários são a porta de entrada mais frequente para invasores escalarem privilégios locais (LPE - Local Privilege Escalation).',
    subtopics: [
      {
        title: 'Abuso de Bits Especiais e Herança Fraca',
        description: 'Identificação de binários com SUID no Linux e pastas com permissão Full Control para "Users" no Windows.',
        linuxSyntax: 'find / -perm -4000 -type f 2>/dev/null',
        windowsSyntax: 'icacls "C:\\Program Files\\*" /findsid *S-1-5-32-545',
        defensePerspective: 'Remoção preventiva do bit SUID de utilitários dispensáveis e aplicação do princípio do menor privilégio.',
        offensePerspective: 'Substituição de executáveis ou bibliotecas em caminhos graváveis para execução de código com privilégios elevados.'
      }
    ],
    labIds: ['lab-permissions-dacl']
  },
  {
    id: 'mod-3-servicos-persistencia',
    title: '3. Serviços, Daemons e Mecanismos de Persistência',
    subtitle: 'Systemd & Cron no Linux vs Windows Services, Registry & Task Scheduler',
    isOpenSourceVsClosed: {
      openSourceConcepts: [
        'Inicialização controlada por systemd (.service units) ou scripts de init.',
        'Agendamento de tarefas através do cron (`/etc/cron.*`, `crontab -e`).',
        'Persistência comum via `.bashrc`, profiles e timers do systemd.'
      ],
      closedSourceConcepts: [
        'Serviços gerenciados pelo Service Control Manager (SCM - `services.exe`).',
        'Registro do Windows (Windows Registry) com chaves críticas como `HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`.',
        'Agendador de Tarefas do Windows (Task Scheduler) com suporte a triggers complexos.'
      ],
      comparativeAnalysis: 'No Linux as configurações são arquivos de texto planos e fáceis de inspecionar com `grep` e `cat`. No Windows, o Registro centraliza chaves binárias e estruturas relacionais pesquisadas via `reg` e PowerShell.'
    },
    cybersecRelevance: 'Após obter acesso inicial, qualquer atacante estabelece persistência para sobreviver a reinicializações. Saber onde procurar é crucial para analistas de segurança.',
    subtopics: [
      {
        title: 'Unquoted Service Paths & Hijacking',
        description: 'Caminhos de executáveis sem aspas contendo espaços permitem injeção de binários maliciosos.',
        linuxSyntax: 'cat /etc/crontab ; ls -la /etc/cron.d/',
        windowsSyntax: 'sc qc <NomeDoServiço> ; Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
        defensePerspective: 'Auditoria automatizada do registro e das pastas de inicialização do sistema.',
        offensePerspective: 'Instalação de persistência furtiva associada a serviços que sobem como LocalSystem.'
      }
    ],
    labIds: ['lab-persistence-services']
  },
  {
    id: 'mod-4-auditoria-logs',
    title: '4. Telemetria, Auditoria e Investigação de Incidentes',
    subtitle: 'Syslog & Journald no Linux vs Windows Event Logs (.evtx), ETW e Sysmon',
    isOpenSourceVsClosed: {
      openSourceConcepts: [
        'Logs em formato de texto estruturado ou serializado: `/var/log/auth.log`, `/var/log/syslog`, `journalctl`.',
        'Subsistema de auditoria de kernel `auditd` para rastrear execuções de comandos e syscalls.'
      ],
      closedSourceConcepts: [
        'Event Viewer com canais estruturados em XML binário: `Security.evtx`, `System.evtx`, `Application.evtx`.',
        'Eventos fundamentais: Event ID 4624 (Logon com sucesso), 4625 (Falha de logon), 4672 (Atribuição de privilégios especiais), 7045 (Novo serviço instalado).'
      ],
      comparativeAnalysis: 'No Linux, analistas usam ferramentas de texto (`awk`, `grep`, `jq`, `journalctl`). No Windows, analistas consultam o provedor ETW, Sysmon e cmdlets como `Get-WinEvent`.'
    },
    cybersecRelevance: 'Sem telemetria e análise de logs não existe detecção. Incidentes só são contidos quando o analista identifica a linha do tempo exata do ataque.',
    subtopics: [
      {
        title: 'Investigação de Força Bruta e Acesso Anômalo',
        description: 'Detecção de tentativas sucessivas de autenticação e identificação de IPs de origem.',
        linuxSyntax: 'journalctl -u sshd --since "1 hour ago" | grep "Failed password"',
        windowsSyntax: 'Get-EventLog -LogName Security -InstanceId 4625 -Newest 10',
        defensePerspective: 'Criação de alertas de SIEM correlacionando múltiplos eventos 4625 seguidos de um 4624.',
        offensePerspective: 'Limpeza de logs de auditoria (Log Cleared - Event ID 1102) para apagar rastros de invasão.'
      }
    ],
    labIds: ['lab-logs-investigation']
  },
  {
    id: 'mod-5-hardening',
    title: '5. Hardening de Sistemas Operacionais & Defesa em Profundidade',
    subtitle: 'Isolamento, Desativação de Superfície de Ataque e Controles de Integridade',
    isOpenSourceVsClosed: {
      openSourceConcepts: [
        'Módulos de Segurança Linux (LSM): AppArmor, SELinux.',
        'Desativação de serviços desnecessários, fechamento de portas com UFW/nftables e restrições de SSH.'
      ],
      closedSourceConcepts: [
        'Group Policy Objects (GPO), Microsoft Defender for Endpoint, BitLocker, Credential Guard e AppLocker / WDAC.',
        'Bloqueio de scripts não assinados (PowerShell ExecutionPolicy Restricted).'
      ],
      comparativeAnalysis: 'O hardening em Linux é comumente orquestrado via scripts Ansible e arquivos de configuração modulares; no Windows, o padrão corporativo é centralizado via GPO do Active Directory e Intune.'
    },
    cybersecRelevance: 'Sistemas com hardening robusto reduzem em mais de 90% a probabilidade de um ataque lateral bem-sucedido.',
    subtopics: [
      {
        title: 'Auditoria de Conformidade e Fechamento de Brechas',
        description: 'Varredura e correção de configurações inseguras identificadas no ambiente.',
        linuxSyntax: 'ss -tulpn ; cat /etc/ssh/sshd_config | grep PermitRootLogin',
        windowsSyntax: 'netstat -ano ; Get-ExecutionPolicy ; Get-MpComputerStatus',
        defensePerspective: 'Aplicação de baselines CIS Benchmarks para Linux e Windows.',
        offensePerspective: 'Identificação de máquinas legadas ou fora do domínio que não recebem políticas de hardening.'
      }
    ],
    labIds: ['lab-hardening-audit']
  }
];
